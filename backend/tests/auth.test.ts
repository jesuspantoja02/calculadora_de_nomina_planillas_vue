import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirServicios } from '../src/container.ts';
import { asegurarUsuarioAdmin, USUARIO_ADMIN_INICIAL } from '../src/modules/auth/infrastructure/seed-usuarios.ts';
import { SqliteUsuarioRepository } from '../src/modules/auth/infrastructure/sqlite-usuario.repository.ts';
import { abrirBaseDatos } from '../src/shared/infrastructure/sqlite/database.ts';
import { hashPassword } from '../src/shared/security/password.ts';
import { AppError } from '../src/shared/errors/app-error.ts';

const opcionesAuth = {
  authSecret: 'test-secret-min-16-chars',
  tokenTtlMs: 3_600_000,
  adminRecoverySecret: 'test-recovery-secret-ok',
};

test('login admin y rechazo de credenciales inválidas', () => {
  const db = abrirBaseDatos(':memory:');
  asegurarUsuarioAdmin(db);
  const { auth } = construirServicios(db, opcionesAuth);

  const sesion = auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'P@ntoja10' });
  assert.equal(sesion.usuario, USUARIO_ADMIN_INICIAL);
  assert.equal(sesion.rol, 'admin');
  assert.ok(sesion.id.length > 10);
  assert.ok(sesion.token.length > 20);

  const payload = auth.validarToken(sesion.token);
  assert.equal(payload.usuario, USUARIO_ADMIN_INICIAL);

  assert.throws(
    () => auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'incorrecta' }),
    (e) => e instanceof AppError && e.status === 401,
  );

  db.close();
});

test('recuperación de clave solo para administrador con código del servidor', () => {
  const db = abrirBaseDatos(':memory:');
  asegurarUsuarioAdmin(db);
  const { auth } = construirServicios(db, opcionesAuth);

  const adminId = auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'P@ntoja10' }).id;

  auth.recuperarClaveAdmin({
    usuario: USUARIO_ADMIN_INICIAL,
    codigoRecuperacion: 'test-recovery-secret-ok',
    passwordNueva: 'NuevaClave9!',
  });

  auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'NuevaClave9!' });

  const repo = new SqliteUsuarioRepository(db);
  repo.crear({
    id: randomUUID(),
    usuario: 'empleado.test',
    passwordHash: hashPassword('Empleado9!'),
    rol: 'usuario',
    fotoUrl: '',
    creadoEn: new Date().toISOString(),
  });

  assert.throws(
    () =>
      auth.recuperarClaveAdmin({
        usuario: 'empleado.test',
        codigoRecuperacion: 'test-recovery-secret-ok',
        passwordNueva: 'OtraClave9!',
      }),
    (e) => e instanceof AppError && e.status === 401,
  );

  assert.throws(
    () =>
      auth.recuperarClaveAdmin({
        usuario: USUARIO_ADMIN_INICIAL,
        codigoRecuperacion: 'codigo-incorrecto',
        passwordNueva: 'OtraClave9!',
      }),
    (e) => e instanceof AppError && e.status === 401,
  );

  assert.equal(auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'NuevaClave9!' }).id, adminId);

  db.close();
});

test('bloquea la cuenta tras 3 intentos fallidos y el admin puede liberarla', () => {
  const db = abrirBaseDatos(':memory:');
  asegurarUsuarioAdmin(db);
  const { auth, usuariosGestion } = construirServicios(db, opcionesAuth);

  for (let i = 0; i < 2; i++) {
    assert.throws(
      () => auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'mala' }),
      (e) => e instanceof AppError && e.status === 401 && e.code === 'CREDENCIALES_INVALIDAS',
    );
  }

  assert.throws(
    () => auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'mala' }),
    (e) => e instanceof AppError && e.status === 423 && e.code === 'CUENTA_BLOQUEADA',
  );

  const estado = auth.inspeccionarCuenta(USUARIO_ADMIN_INICIAL);
  assert.equal(estado.bloqueada, true);
  assert.ok(estado.segundosRestantes > 0);

  assert.throws(
    () => auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'P@ntoja10' }),
    (e) => e instanceof AppError && e.status === 423,
  );

  const cuenta = usuariosGestion.listar().find((u) => u.usuario === USUARIO_ADMIN_INICIAL);
  assert.ok(cuenta);
  const liberada = usuariosGestion.liberarBloqueo(cuenta.id);
  assert.equal(liberada.bloqueada, false);
  assert.equal(liberada.intentosFallidos, 0);

  const sesion = auth.iniciarSesion({ usuario: USUARIO_ADMIN_INICIAL, password: 'P@ntoja10' });
  assert.equal(sesion.usuario, USUARIO_ADMIN_INICIAL);

  db.close();
});
