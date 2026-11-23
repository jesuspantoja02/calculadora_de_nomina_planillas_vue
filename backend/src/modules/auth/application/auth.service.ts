import { createHash, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.ts';
import { hashPassword, verifyPassword } from '../../../shared/security/password.ts';
import { crearToken, verificarToken, type TokenPayload } from '../../../shared/security/token.ts';
import type { RolUsuario } from '../domain/roles.ts';
import {
  BLOQUEO_LOGIN_MS,
  MAX_INTENTOS_LOGIN,
  type Usuario,
} from '../domain/usuario.ts';
import type { UsuarioRepository } from '../domain/usuario.repository.ts';
import type {
  actualizarPerfilSchema,
  cambiarPasswordSchema,
  loginSchema,
  recuperarClaveAdminSchema,
} from './auth.dto.ts';
import type { z } from 'zod';

export interface SesionDto {
  token: string;
  id: string;
  usuario: string;
  rol: RolUsuario;
  fotoUrl: string;
}

export interface PerfilDto {
  id: string;
  usuario: string;
  rol: RolUsuario;
  fotoUrl: string;
  creadoEn: string;
}

export interface EstadoCuentaLoginDto {
  usuario: string;
  maxIntentos: number;
  intentosFallidos: number;
  intentosRestantes: number;
  bloqueada: boolean;
  bloqueadoHasta: string | null;
  segundosRestantes: number;
  /** Solo true si la cuenta existe y es administrador. */
  esAdmin: boolean;
  /** Admin + clave de recuperación configurada en el servidor. */
  puedeRecuperarAdmin: boolean;
}

function coincidenSecretos(recibido: string, esperado: string): boolean {
  if (!esperado) return false;
  const a = createHash('sha256').update(recibido, 'utf8').digest();
  const b = createHash('sha256').update(esperado, 'utf8').digest();
  return timingSafeEqual(a, b);
}

function segundosHasta(iso: string | null, ahora = Date.now()): number {
  if (!iso) return 0;
  const fin = Date.parse(iso);
  if (Number.isNaN(fin)) return 0;
  return Math.max(0, Math.ceil((fin - ahora) / 1000));
}

export class AuthService {
  #usuarios: UsuarioRepository;
  #authSecret: string;
  #tokenTtlMs: number;
  #adminRecoverySecret: string;

  constructor(usuarios: UsuarioRepository, authSecret: string, tokenTtlMs: number, adminRecoverySecret = '') {
    this.#usuarios = usuarios;
    this.#authSecret = authSecret;
    this.#tokenTtlMs = tokenTtlMs;
    this.#adminRecoverySecret = adminRecoverySecret;
  }

  recuperacionAdminHabilitada(): boolean {
    return this.#adminRecoverySecret.length >= 16;
  }

  recuperarClaveAdmin(body: z.infer<typeof recuperarClaveAdminSchema>): void {
    if (!this.recuperacionAdminHabilitada()) {
      throw new AppError(
        503,
        'RECUPERACION_DESHABILITADA',
        'La recuperación de administrador no está configurada en el servidor.',
      );
    }

    const codigoOk = coincidenSecretos(body.codigoRecuperacion, this.#adminRecoverySecret);
    const registro = this.#usuarios.buscarPorUsuario(body.usuario);
    const adminOk = registro?.rol === 'admin';

    if (!codigoOk || !adminOk || !registro) {
      throw new AppError(
        401,
        'RECUPERACION_INVALIDA',
        'No se pudo restablecer la clave. Revisa el usuario administrador y el código de recuperación.',
      );
    }

    this.#usuarios.actualizar(registro.id, {
      passwordHash: hashPassword(body.passwordNueva),
      intentosFallidos: 0,
      bloqueadoHasta: null,
    });
  }

  /** Estado de bloqueo/intentos para la cuenta que se intenta usar en el login. */
  inspeccionarCuenta(usuarioRaw: string): EstadoCuentaLoginDto {
    const usuario = usuarioRaw.trim();
    const vacio: EstadoCuentaLoginDto = {
      usuario,
      maxIntentos: MAX_INTENTOS_LOGIN,
      intentosFallidos: 0,
      intentosRestantes: MAX_INTENTOS_LOGIN,
      bloqueada: false,
      bloqueadoHasta: null,
      segundosRestantes: 0,
      esAdmin: false,
      puedeRecuperarAdmin: false,
    };
    if (!usuario) return vacio;

    const registro = this.#usuarios.buscarPorUsuario(usuario);
    if (!registro) return { ...vacio, usuario };

    const vigente = this.#estadoBloqueoVigente(registro);
    return this.#aEstadoCuenta(vigente.registro, vigente.bloqueada, vigente.segundosRestantes);
  }

  iniciarSesion(credenciales: z.infer<typeof loginSchema>): SesionDto {
    const registro = this.#usuarios.buscarPorUsuario(credenciales.usuario);

    if (registro) {
      if (registro.activo === false) {
        throw new AppError(
          403,
          'CUENTA_DESHABILITADA',
          'Esta cuenta está deshabilitada. Contacta a un administrador.',
        );
      }

      const { bloqueada, segundosRestantes, registro: actual } = this.#estadoBloqueoVigente(registro);
      if (bloqueada) {
        throw new AppError(
          423,
          'CUENTA_BLOQUEADA',
          'Demasiados intentos fallidos. Inténtalo más tarde o contacta a un administrador.',
          this.#aEstadoCuenta(actual, true, segundosRestantes),
        );
      }

      if (!verifyPassword(credenciales.password, actual.passwordHash)) {
        const actualizado = this.#registrarFallo(actual);
        const estado = this.inspeccionarCuenta(actualizado.usuario);
        if (estado.bloqueada) {
          throw new AppError(
            423,
            'CUENTA_BLOQUEADA',
            'Demasiados intentos fallidos. Inténtalo más tarde o contacta a un administrador.',
            estado,
          );
        }
        throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos.', estado);
      }

      this.#limpiarBloqueo(actual.id);
      const token = crearToken(
        { sub: actual.id, usuario: actual.usuario, rol: actual.rol },
        this.#authSecret,
        this.#tokenTtlMs,
      );

      return {
        token,
        id: actual.id,
        usuario: actual.usuario,
        rol: actual.rol,
        fotoUrl: actual.fotoUrl ?? '',
      };
    }

    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos.', {
      usuario: credenciales.usuario.trim(),
      maxIntentos: MAX_INTENTOS_LOGIN,
      intentosFallidos: 0,
      intentosRestantes: MAX_INTENTOS_LOGIN,
      bloqueada: false,
      bloqueadoHasta: null,
      segundosRestantes: 0,
      esAdmin: false,
      puedeRecuperarAdmin: false,
    } satisfies EstadoCuentaLoginDto);
  }

  validarToken(token: string): TokenPayload {
    return verificarToken(token, this.#authSecret);
  }

  /** Rechaza la sesión si la cuenta fue deshabilitada o eliminada. */
  asegurarCuentaActiva(payload: TokenPayload): void {
    const registro = this.#usuarios.buscarPorId(payload.sub);
    if (!registro || registro.activo === false) {
      throw new AppError(
        401,
        'CUENTA_DESHABILITADA',
        'Esta cuenta está deshabilitada. Contacta a un administrador.',
      );
    }
  }

  sesionDesdeToken(token: string): SesionDto {
    const payload = this.validarToken(token);
    const registro = this.#usuarios.buscarPorId(payload.sub);
    return {
      token,
      id: payload.sub,
      usuario: payload.usuario,
      rol: payload.rol,
      fotoUrl: registro?.fotoUrl ?? '',
    };
  }

  perfil(payload: TokenPayload): PerfilDto {
    const registro = this.#usuarios.buscarPorId(payload.sub);
    if (!registro) {
      throw new AppError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
    }
    return {
      id: registro.id,
      usuario: registro.usuario,
      rol: registro.rol,
      fotoUrl: registro.fotoUrl ?? '',
      creadoEn: registro.creadoEn,
    };
  }

  actualizarPerfil(payload: TokenPayload, body: z.infer<typeof actualizarPerfilSchema>): PerfilDto {
    const registro = this.#usuarios.buscarPorId(payload.sub);
    if (!registro) {
      throw new AppError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
    }
    const actualizado = this.#usuarios.actualizar(payload.sub, { fotoUrl: body.fotoUrl });
    return {
      id: actualizado.id,
      usuario: actualizado.usuario,
      rol: actualizado.rol,
      fotoUrl: actualizado.fotoUrl ?? '',
      creadoEn: actualizado.creadoEn,
    };
  }

  cambiarPassword(payload: TokenPayload, body: z.infer<typeof cambiarPasswordSchema>): void {
    const registro = this.#usuarios.buscarPorId(payload.sub);
    if (!registro) {
      throw new AppError(404, 'NO_ENCONTRADO', 'Usuario no encontrado.');
    }
    if (!verifyPassword(body.passwordActual, registro.passwordHash)) {
      throw new AppError(401, 'PASSWORD_ACTUAL_INVALIDA', 'La contraseña actual no es correcta.');
    }
    this.#usuarios.actualizar(payload.sub, { passwordHash: hashPassword(body.passwordNueva) });
  }

  #estadoBloqueoVigente(registro: Usuario): {
    registro: Usuario;
    bloqueada: boolean;
    segundosRestantes: number;
  } {
    const segundos = segundosHasta(registro.bloqueadoHasta);
    if (segundos > 0) {
      return { registro, bloqueada: true, segundosRestantes: segundos };
    }
    if (registro.bloqueadoHasta || registro.intentosFallidos >= MAX_INTENTOS_LOGIN) {
      const limpio = this.#limpiarBloqueo(registro.id);
      return { registro: limpio, bloqueada: false, segundosRestantes: 0 };
    }
    return { registro, bloqueada: false, segundosRestantes: 0 };
  }

  #registrarFallo(registro: Usuario): Usuario {
    const intentos = registro.intentosFallidos + 1;
    if (intentos >= MAX_INTENTOS_LOGIN) {
      return this.#usuarios.actualizar(registro.id, {
        intentosFallidos: intentos,
        bloqueadoHasta: new Date(Date.now() + BLOQUEO_LOGIN_MS).toISOString(),
      });
    }
    return this.#usuarios.actualizar(registro.id, {
      intentosFallidos: intentos,
      bloqueadoHasta: null,
    });
  }

  #limpiarBloqueo(id: string): Usuario {
    return this.#usuarios.actualizar(id, { intentosFallidos: 0, bloqueadoHasta: null });
  }

  #aEstadoCuenta(registro: Usuario, bloqueada: boolean, segundosRestantes: number): EstadoCuentaLoginDto {
    const intentosFallidos = bloqueada
      ? Math.max(registro.intentosFallidos, MAX_INTENTOS_LOGIN)
      : registro.intentosFallidos;
    const esAdmin = registro.rol === 'admin';
    return {
      usuario: registro.usuario,
      maxIntentos: MAX_INTENTOS_LOGIN,
      intentosFallidos,
      intentosRestantes: bloqueada ? 0 : Math.max(0, MAX_INTENTOS_LOGIN - intentosFallidos),
      bloqueada,
      bloqueadoHasta: bloqueada ? registro.bloqueadoHasta : null,
      segundosRestantes: bloqueada ? segundosRestantes : 0,
      esAdmin,
      puedeRecuperarAdmin: esAdmin && this.recuperacionAdminHabilitada(),
    };
  }

}
