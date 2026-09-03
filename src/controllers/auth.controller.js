import bcrypt from "bcrypt";
import pool from "../database/db.js";
import { generarToken } from "../services/jwt.service.js";
import { respuestaOk, respuestaError } from "../utils/response.js";
import { registrarAuditoria } from "../services/auditoria.service.js";

const SALT_ROUNDS = 10;

// POST /auth/registro
export async function registro(req, res) {
  try {
    const {
      nombre,
      apellido,
      dni,
      email,
      password,
      fecha_nacimiento,
      id_cobertura,
    } = req.body;

    // Validación básica de campos requeridos
    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
      return respuestaError(res, 400, "Faltan datos obligatorios");
    }

    // Chequear que no exista DNI o email duplicado
    const [existentes] = await pool.query(
      "SELECT id FROM usuario WHERE dni = ? OR email = ?",
      [dni, email]
    );

    if (existentes.length > 0) {
      return respuestaError(res, 409, "Ya existe un usuario con ese DNI o email");
    }

    // Validar que la cobertura exista
    const [coberturas] = await pool.query(
      "SELECT id FROM cobertura WHERE id = ?",
      [id_cobertura]
    );

    if (coberturas.length === 0) {
      return respuestaError(res, 400, "La cobertura indicada no existe");
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
      `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, 'paciente', ?, ?, ?, NULL, ?)`,
      [
        apellido,
        nombre,
        fecha_nacimiento,
        hash,
        email,
        req.body.telefono || "",
        dni,
        id_cobertura,
      ]
    );

    const usuarioId = resultado.insertId;

    // Registrar en auditoría (si viene del body, asumimos que es un admin creando el usuario)
    // Si no viene req.usuario, es un registro público (no se audita)
    if (req.usuario && req.usuario.id) {
      await registrarAuditoria(
        req.usuario.id,
        "ALTA",
        "usuario",
        usuarioId,
        `Alta de usuario paciente: ${nombre} ${apellido}`
      );
    }

    return respuestaOk(res, 201, {
      id: usuarioId,
      nombre,
      apellido,
      email,
      rol: "paciente",
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al registrar el usuario");
  }
}

// POST /auth/login
export async function login(req, res) {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return respuestaError(res, 400, "DNI y contraseña son obligatorios");
    }

    const [usuarios] = await pool.query(
      "SELECT * FROM usuario WHERE dni = ?",
      [dni]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 401, "Credenciales inválidas");
    }

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return respuestaError(res, 401, "Credenciales inválidas");
    }

    const token = generarToken({
      id: usuario.id,
      rol: usuario.rol,
      id_sede: usuario.id_sede,
    });

    return respuestaOk(res, 200, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        id_sede: usuario.id_sede,
      },
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al iniciar sesión");
  }
}

// GET /auth/perfil (protegido)
export async function perfil(req, res) {
  try {
    const { id } = req.usuario;

    const [usuarios] = await pool.query(
      `SELECT id, apellido, nombre, fecha_nacimiento, rol, email, telefono, dni, id_sede, id_cobertura
       FROM usuario WHERE id = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 404, "Usuario no encontrado");
    }

    return respuestaOk(res, 200, usuarios[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener el perfil");
  }
}

// GET /auth/coberturas (auxiliar para el form de registro)
export async function listarCoberturas(req, res) {
  try {
    const [coberturas] = await pool.query("SELECT id, nombre FROM cobertura");
    return respuestaOk(res, 200, coberturas);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener las coberturas");
  }
}
