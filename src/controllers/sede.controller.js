import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";
import { registrarAuditoria } from "../services/auditoria.service.js";

export async function crearSede(req, res) {
  try {
    const { nombre, direccion, telefono } = req.body;
    if (!nombre || !direccion || !telefono) {
      return respuestaError(res, 400, "Faltan datos obligatorios (nombre, direccion, telefono)");
    }
    const [resultado] = await pool.query(
      "INSERT INTO sede (nombre, direccion, telefono) VALUES (?, ?, ?)",
      [nombre, direccion, telefono]
    );
    const seatId = resultado.insertId;
    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "ALTA",
      "sede",
      seatId,
      `Alta de sede: ${nombre}`
    );
    return respuestaOk(res, 201, { id: seatId, nombre, direccion, telefono });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear la sede");
  }
}

export async function listarSedes(req, res) {
  try {
    const [sedes] = await pool.query("SELECT * FROM sede");
    return respuestaOk(res, 200, sedes);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar las sedes");
  }
}

export async function obtenerSede(req, res) {
  try {
    const { id } = req.params;
    const [sedes] = await pool.query("SELECT * FROM sede WHERE id = ?", [id]);
    if (sedes.length === 0) {
      return respuestaError(res, 404, "Sede no encontrada");
    }
    return respuestaOk(res, 200, sedes[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener la sede");
  }
}

export async function actualizarSede(req, res) {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;
    const [sedes] = await pool.query("SELECT id FROM sede WHERE id = ?", [id]);
    if (sedes.length === 0) {
      return respuestaError(res, 404, "Sede no encontrada");
    }
    if (!nombre || !direccion || !telefono) {
      return respuestaError(res, 400, "Faltan datos obligatorios (nombre, direccion, telefono)");
    }
    await pool.query(
      "UPDATE sede SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?",
      [nombre, direccion, telefono, id]
    );
    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "MODIFICACION",
      "sede",
      Number(id),
      `Modificación de sede: ${nombre}`
    );
    return respuestaOk(res, 200, { id: Number(id), nombre, direccion, telefono });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al actualizar la sede");
  }
}

export async function eliminarSede(req, res) {
  try {
    const { id } = req.params;
    const [sedes] = await pool.query("SELECT id, nombre FROM sede WHERE id = ?", [id]);
    if (sedes.length === 0) {
      return respuestaError(res, 404, "Sede no encontrada");
    }
    const [usuariosAsociados] = await pool.query(
      "SELECT id FROM usuario WHERE id_sede = ? LIMIT 1", [id]
    );
    if (usuariosAsociados.length > 0) {
      return respuestaError(res, 409, "No se puede eliminar la sede: tiene médicos u operadores asociados");
    }
    const [agendaAsociada] = await pool.query(
      "SELECT id FROM agenda WHERE id_sede = ? LIMIT 1", [id]
    );
    if (agendaAsociada.length > 0) {
      return respuestaError(res, 409, "No se puede eliminar la sede: tiene agenda asociada");
    }
    await pool.query("DELETE FROM sede WHERE id = ?", [id]);
    // Registrar en auditoría
    await registrarAuditoria(
      req.usuario.id,
      "BAJA",
      "sede",
      Number(id),
      `Baja de sede: ${sedes[0].nombre}`
    );
    return respuestaOk(res, 200, { mensaje: "Sede eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al eliminar la sede");
  }
}