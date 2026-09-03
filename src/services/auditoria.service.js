import pool from "../database/db.js";

/**
 * Registra una acción de auditoría
 * @param {number} idUsuario - ID del usuario que realizó la acción
 * @param {string} accion - Tipo de acción: 'ALTA', 'BAJA', 'MODIFICACION'
 * @param {string} entidad - Nombre de la entidad afectada (usuario, sede, especialidad, cobertura, agenda, turno)
 * @param {number} idEntidad - ID de la entidad afectada
 * @param {string} detalle - Descripción de la acción
 */
export async function registrarAuditoria(idUsuario, accion, entidad, idEntidad, detalle) {
  try {
    await pool.query(
      `INSERT INTO log_auditoria (id_usuario, accion, entidad, id_entidad, detalle) 
       VALUES (?, ?, ?, ?, ?)`,
      [idUsuario, accion, entidad, idEntidad, detalle]
    );
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
    // No lanzamos error para no afectar la operación principal
  }
}
