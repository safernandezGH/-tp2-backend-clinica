import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

/**
 * GET /auditoria
 * Obtiene los logs de auditoría con filtros opcionales
 * Filtros: idUsuario, entidad, fechaInicio, fechaFin
 * Solo para rol 'admin'
 */
export async function obtenerLogsAuditoria(req, res) {
  try {
    const { idUsuario, entidad, fechaInicio, fechaFin } = req.query;

    let query = "SELECT la.*, u.nombre, u.apellido FROM log_auditoria la LEFT JOIN usuario u ON la.id_usuario = u.id WHERE 1=1";
    const params = [];

    if (idUsuario) {
      query += " AND la.id_usuario = ?";
      params.push(idUsuario);
    }

    if (entidad) {
      query += " AND la.entidad = ?";
      params.push(entidad);
    }

    if (fechaInicio) {
      query += " AND la.fecha >= ?";
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += " AND la.fecha <= ?";
      params.push(fechaFin);
    }

    query += " ORDER BY la.fecha DESC";

    const [logs] = await pool.query(query, params);

    return respuestaOk(res, 200, logs);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener los logs de auditoría");
  }
}
