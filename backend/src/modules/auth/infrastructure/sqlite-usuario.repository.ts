import { randomUUID } from 'node:crypto';
import type { Db } from '../../../shared/infrastructure/sqlite/database.ts';
import type { ActualizarUsuarioInput, CrearUsuarioInput, UsuarioRepository } from '../domain/usuario.repository.ts';
import type { Usuario } from '../domain/usuario.ts';

import type { RolUsuario } from '../domain/roles.ts';

type Fila = {
  id: string;
  usuario: string;
  password_hash: string;
  rol: RolUsuario;
  foto_url: string;
  creado_en: string;
};

const COLUMNAS = 'id, usuario, password_hash, rol, foto_url, creado_en';

function mapFila(fila: Fila): Usuario {
  return {
    id: fila.id,
    usuario: fila.usuario,
    passwordHash: fila.password_hash,
    rol: fila.rol,
    fotoUrl: fila.foto_url ?? '',
    creadoEn: fila.creado_en,
  };
}

export class SqliteUsuarioRepository implements UsuarioRepository {
  #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  buscarPorUsuario(usuario: string): Usuario | null {
    const fila = this.#db
      .prepare(`SELECT ${COLUMNAS} FROM usuarios WHERE usuario = ? COLLATE NOCASE`)
      .get(usuario) as Fila | undefined;
    return fila ? mapFila(fila) : null;
  }

  buscarPorId(id: string): Usuario | null {
    const fila = this.#db.prepare(`SELECT ${COLUMNAS} FROM usuarios WHERE id = ?`).get(id) as Fila | undefined;
    return fila ? mapFila(fila) : null;
  }

  listar(): Usuario[] {
    const filas = this.#db
      .prepare(`SELECT ${COLUMNAS} FROM usuarios ORDER BY usuario COLLATE NOCASE ASC`)
      .all() as Fila[];
    return filas.map(mapFila);
  }

  crear(input: CrearUsuarioInput): Usuario {
    const id = input.id || randomUUID();
    this.#db
      .prepare(
        `INSERT INTO usuarios (id, usuario, password_hash, rol, foto_url, creado_en)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.usuario, input.passwordHash, input.rol, input.fotoUrl ?? '', input.creadoEn);
    return {
      id,
      usuario: input.usuario,
      passwordHash: input.passwordHash,
      rol: input.rol,
      fotoUrl: input.fotoUrl ?? '',
      creadoEn: input.creadoEn,
    };
  }

  actualizar(id: string, input: ActualizarUsuarioInput): Usuario {
    const actual = this.buscarPorId(id);
    if (!actual) throw new Error('Usuario no encontrado');

    const usuario = input.usuario ?? actual.usuario;
    const passwordHash = input.passwordHash ?? actual.passwordHash;
    const rol = input.rol ?? actual.rol;
    const fotoUrl = input.fotoUrl !== undefined ? input.fotoUrl : actual.fotoUrl;

    this.#db
      .prepare(`UPDATE usuarios SET usuario = ?, password_hash = ?, rol = ?, foto_url = ? WHERE id = ?`)
      .run(usuario, passwordHash, rol, fotoUrl, id);

    return { id, usuario, passwordHash, rol, fotoUrl, creadoEn: actual.creadoEn };
  }

  eliminar(id: string): void {
    this.#db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  }

  contarPorRol(rol: RolUsuario): number {
    const fila = this.#db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE rol = ?').get(rol) as { n: number };
    return fila.n;
  }
}
