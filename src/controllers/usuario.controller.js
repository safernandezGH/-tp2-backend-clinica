import bcrypt from "bcrypt";
import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";
import { registrarAuditoria } from "../services/auditoria.service.js";

const SALT_ROUNDS = 10;

/**
 * POST /usuarios
 * Crear un nuevo usuario (médico, operador, admin)
 * Solo para admin
 */
export async function crearUsuario(req, res) {
  try {
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      fecha_nacimiento,
      rol,
      id_sede,
      id_cobertura,
      telefono,
    } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !rol) {
      return respuestaError(res, 400, "Faltan datos obligatorios (nombre, apellido, dni, email, password, fecha_nacimiento, rol)");
    }

    // Validar rol permitido
    if (!["medico", "operador", "admin"].includes(rol)) {
      return respuestaError(res, 400, "Rol no permitido. Usar: medico, operador, admin");
    }

    // Chequear que no exista DNI o email duplicado
    const [existentes] = await pool.query(
      "SELECT id FROM usuario WHERE dni = ? OR email = ?",
      [dni, email]
    );

    if (existentes.length > 0) {
      return respuestaError(res, 409, "Ya existe un usuario con ese DNI o email");
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
      `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        apellido,
        nombre,
        fecha_nacimiento,
        hash,
        rol,
        email,
        telefono || "",
        dni,
        id_sede || null,
        id_cobertura || null,
      ]
    );

    const usuarioId = resultado.insertId;

    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "ALTA",
      "usuario",
      usuarioId,
      `Alta de usuario ${rol}: ${nombre} ${apellido}`
    );

    return respuestaOk(res, 201, {
      id: usuarioId,
      nombre,
      apellido,
      email,
      rol,
      id_sede: id_sede || null,
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear el usuario");
  }
}

/**
 * GET /usuarios
 * Listar todos los usuarios
 * Solo para admin
 */
export async function listarUsuarios(req, res) {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, apellido, nombre, email, rol, id_sede, id_cobertura, dni FROM usuario"
    );
    return respuestaOk(res, 200, usuarios);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar usuarios");
  }
}

/**
 * GET /usuarios/:id
 * Obtener un usuario específico
 * Solo para admin
 */
export async function obtenerUsuario(req, res) {
  try {
    const { id } = req.params;
    const [usuarios] = await pool.query(
      "SELECT id, apellido, nombre, email, rol, id_sede, id_cobertura, dni FROM usuario WHERE id = ?",
      [id]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 404, "Usuario no encontrado");
    }

    return respuestaOk(res, 200, usuarios[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener el usuario");
  }
}

/**
 * PUT /usuarios/:id
 * Actualizar un usuario
 * Solo para admin
 */
export async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, id_sede, id_cobertura, telefono } = req.body;

    const [usuarios] = await pool.query(
      "SELECT id, nombre, apellido FROM usuario WHERE id = ?",
      [id]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 404, "Usuario no encontrado");
    }

    if (!nombre || !apellido || !email || !rol) {
      return respuestaError(res, 400, "Faltan datos obligatorios (nombre, apellido, email, rol)");
    }

    // Validar rol permitido
    if (!["medico", "operador", "admin", "paciente"].includes(rol)) {
      return respuestaError(res, 400, "Rol no permitido");
    }

    // Chequear email duplicado (excluyendo el usuario actual)
    const [existentes] = await pool.query(
      "SELECT id FROM usuario WHERE email = ? AND id != ?",
      [email, id]
    );

    if (existentes.length > 0) {
      return respuestaError(res, 409, "Ya existe otro usuario con ese email");
    }

    await pool.query(
      "UPDATE usuario SET nombre = ?, apellido = ?, email = ?, rol = ?, id_sede = ?, id_cobertura = ?, telefono = ? WHERE id = ?",
      [nombre, apellido, email, rol, id_sede || null, id_cobertura || null, telefono || "", id]
    );

    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "MODIFICACION",
      "usuario",
      Number(id),
      `Modificación de usuario: ${nombre} ${apellido}`
    );

    return respuestaOk(res, 200, {
      id: Number(id),
      nombre,
      apellido,
      email,
      rol,
      id_sede: id_sede || null,
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al actualizar el usuario");
  }
}

/**
 * DELETE /usuarios/:id
 * Eliminar un usuario
 * Solo para admin
 */
export async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;

    const [usuarios] = await pool.query(
      "SELECT id, nombre, apellido FROM usuario WHERE id = ?",
      [id]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 404, "Usuario no encontrado");
    }

    await pool.query("DELETE FROM usuario WHERE id = ?", [id]);

    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "BAJA",
      "usuario",
      Number(id),
      `Baja de usuario: ${usuarios[0].nombre} ${usuarios[0].apellido}`
    );

    return respuestaOk(res, 200, { mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al eliminar el usuario");
  }
}
