import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

export async function registrarHistorial(req, res) {
  try {
    const usuario = req.usuario;
    if (usuario.rol !== "medico") {
      return respuestaError(res, 403, "Solo un médico puede registrar historial clínico");
    }

    const { id_turno, diagnostico, tratamiento, observaciones } = req.body;
    if (!id_turno || !diagnostico) {
      return respuestaError(res, 400, "Faltan campos obligatorios: id_turno, diagnostico");
    }

    const [[turno]] = await pool.query(
      "SELECT t.*, a.id_medico FROM turno t JOIN agenda a ON t.id_agenda = a.id WHERE t.id = ?",
      [id_turno]
    );
    if (!turno) return respuestaError(res, 404, "Turno no encontrado");
    if (turno.id_medico !== usuario.id) {
      return respuestaError(res, 403, "Solo podés registrar historial de turnos que vos atendiste");
    }
    if (turno.estado !== "atendido") {
      return respuestaError(res, 400, "El turno debe estar en estado 'atendido'");
    }

    const [resultado] = await pool.query(
      "INSERT INTO historial_clinico (id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones) VALUES (?, ?, ?, ?, ?, ?)",
      [id_turno, usuario.id, turno.id_paciente, diagnostico, tratamiento || null, observaciones || null]
    );

    return respuestaOk(res, 201, { id: resultado.insertId, id_turno, diagnostico, tratamiento, observaciones });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al registrar historial clínico");
  }
}

export async function consultarHistorial(req, res) {
  try {
    const usuario = req.usuario;
    let sql, params;

    if (usuario.rol === "paciente") {
      sql = "SELECT * FROM historial_clinico WHERE id_paciente = ? ORDER BY fecha_registro DESC";
      params = [usuario.id];
    } else if (usuario.rol === "medico") {
      sql = "SELECT * FROM historial_clinico WHERE id_medico = ? ORDER BY fecha_registro DESC";
      params = [usuario.id];
    } else {
      return respuestaError(res, 403, "No tenés permisos para consultar historial clínico");
    }

    const [historial] = await pool.query(sql, params);
    return respuestaOk(res, 200, historial);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al consultar historial clínico");
  }
}