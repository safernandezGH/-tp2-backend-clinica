import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

/**
 * GET /reportes/turnos-por-especialidad
 * Retorna cantidad de turnos por especialidad
 * Filtros opcionales: fechaInicio, fechaFin
 */
export async function turnosPorEspecialidad(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = `
      SELECT 
        e.id, 
        e.descripcion, 
        COUNT(t.id) as cantidad_turnos
      FROM especialidad e
      LEFT JOIN agenda a ON e.id = a.id_especialidad
      LEFT JOIN turno t ON a.id = t.id_agenda
      WHERE 1=1
    `;
    const params = [];

    if (fechaInicio) {
      query += " AND t.fecha >= ?";
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += " AND t.fecha <= ?";
      params.push(fechaFin);
    }

    query += " GROUP BY e.id, e.descripcion ORDER BY cantidad_turnos DESC";

    const [resultados] = await pool.query(query, params);

    return respuestaOk(res, 200, resultados);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener turnos por especialidad");
  }
}

/**
 * GET /reportes/turnos-por-sede
 * Retorna cantidad de turnos por sede
 * Filtros opcionales: fechaInicio, fechaFin
 */
export async function turnosPorSede(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = `
      SELECT 
        s.id, 
        s.nombre, 
        COUNT(t.id) as cantidad_turnos
      FROM sede s
      LEFT JOIN agenda a ON s.id = a.id_sede
      LEFT JOIN turno t ON a.id = t.id_agenda
      WHERE 1=1
    `;
    const params = [];

    if (fechaInicio) {
      query += " AND t.fecha >= ?";
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += " AND t.fecha <= ?";
      params.push(fechaFin);
    }

    query += " GROUP BY s.id, s.nombre ORDER BY cantidad_turnos DESC";

    const [resultados] = await pool.query(query, params);

    return respuestaOk(res, 200, resultados);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener turnos por sede");
  }
}

/**
 * GET /reportes/ranking-medicos
 * Retorna ranking completo de médicos por cantidad de turnos atendidos
 * Filtros opcionales: fechaInicio, fechaFin
 */
export async function rankingMedicos(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = `
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        COUNT(t.id) as cantidad_turnos_atendidos
      FROM usuario u
      LEFT JOIN agenda a ON u.id = a.id_medico
      LEFT JOIN turno t ON a.id = t.id_agenda AND (t.estado = 'atendido' OR t.estado = 'confirmado')
      WHERE u.rol = 'medico'
    `;
    const params = [];

    if (fechaInicio) {
      query += " AND t.fecha >= ?";
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += " AND t.fecha <= ?";
      params.push(fechaFin);
    }

    query += " GROUP BY u.id, u.nombre, u.apellido ORDER BY cantidad_turnos_atendidos DESC";

    const [resultados] = await pool.query(query, params);

    return respuestaOk(res, 200, resultados);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener ranking de médicos");
  }
}

/**
 * GET /reportes/tasa-cancelacion
 * Retorna la tasa de cancelación del período
 * Filtros opcionales: fechaInicio, fechaFin
 */
export async function tasaCancelacion(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = `
      SELECT 
        COUNT(CASE WHEN t.estado = 'cancelado' THEN 1 END) as turnos_cancelados,
        COUNT(t.id) as total_turnos,
        ROUND(
          (COUNT(CASE WHEN t.estado = 'cancelado' THEN 1 END) / COUNT(t.id)) * 100, 
          2
        ) as tasa_cancelacion_porcentaje
      FROM turno t
      WHERE 1=1
    `;
    const params = [];

    if (fechaInicio) {
      query += " AND t.fecha >= ?";
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += " AND t.fecha <= ?";
      params.push(fechaFin);
    }

    const [resultados] = await pool.query(query, params);

    // Si no hay turnos, retornar 0
    if (resultados[0].total_turnos === 0) {
      resultados[0].tasa_cancelacion_porcentaje = 0;
    }

    return respuestaOk(res, 200, resultados[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al calcular tasa de cancelación");
  }
}
