import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

async function crearNotificacion(id_usuario, tipo, mensaje) {
  await pool.query(
    "INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)",
    [id_usuario, tipo, mensaje]
  );
}

function formatearFechaHora(fecha, hora) {
  return `${fecha} a las ${hora}`;
}

export async function altaTurno(req, res) {
  try {
    const { id_agenda, fecha, hora, nota } = req.body;
    const usuario = req.usuario;

    // Solo paciente puede crear turno para sí mismo; operador puede hacerlo en su representación
    let id_paciente;
    if (usuario.rol === "paciente") {
      id_paciente = usuario.id;
    } else if (usuario.rol === "operador") {
      id_paciente = req.body.id_paciente;
      if (!id_paciente) return respuestaError(res, 400, "Falta id_paciente");
    } else {
      return respuestaError(res, 403, "Solo pacientes u operadores pueden crear turnos");
    }

    if (!id_agenda || !fecha || !hora || !nota) {
      return respuestaError(res, 400, "Faltan campos obligatorios: id_agenda, fecha, hora, nota");
    }

    // Obtener agenda
    const [[agenda]] = await pool.query("SELECT * FROM agenda WHERE id = ?", [id_agenda]);
    if (!agenda) return respuestaError(res, 404, "Agenda no encontrada");

    // Validar que hora está dentro del rango de la agenda
    if (hora < agenda.hora_entrada || hora >= agenda.hora_salida) {
      return respuestaError(res, 400, `Horario fuera del rango disponible (${agenda.hora_entrada} - ${agenda.hora_salida})`);
    }

    // Validar que no haya turno confirmado en ese slot
    const [solapados] = await pool.query(
      "SELECT id FROM turno WHERE id_agenda = ? AND fecha = ? AND hora = ? AND estado = 'confirmado'",
      [id_agenda, fecha, hora]
    );
    if (solapados.length > 0) {
      return respuestaError(res, 409, "Ya existe un turno confirmado en ese horario");
    }

    // Obtener cobertura del paciente
    const [[paciente]] = await pool.query("SELECT id_cobertura FROM usuario WHERE id = ?", [id_paciente]);
    if (!paciente) return respuestaError(res, 404, "Paciente no encontrado");

    const [resultado] = await pool.query(
      "INSERT INTO turno (nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado) VALUES (?, ?, ?, ?, ?, ?, 'confirmado')",
      [nota, id_agenda, fecha, hora, id_paciente, paciente.id_cobertura]
    );

    await crearNotificacion(
      id_paciente,
      "turno_confirmado",
      `Tu turno del ${formatearFechaHora(fecha, hora)} fue confirmado.`
    );

    return respuestaOk(res, 201, { id: resultado.insertId, id_agenda, fecha, hora, nota, estado: "confirmado" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear el turno");
  }
}

export async function cancelarTurno(req, res) {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const [[turno]] = await pool.query(
      "SELECT t.*, a.id_sede, a.id_medico FROM turno t JOIN agenda a ON t.id_agenda = a.id WHERE t.id = ?",
      [id]
    );
    if (!turno) return respuestaError(res, 404, "Turno no encontrado");

    if (turno.estado !== "confirmado") {
      return respuestaError(res, 400, "Solo se pueden cancelar turnos confirmados");
    }

    // Paciente: solo el propio; operador/médico: de su sede
    if (usuario.rol === "paciente" && usuario.id !== turno.id_paciente) {
      return respuestaError(res, 403, "No podés cancelar un turno que no es tuyo");
    }
    if ((usuario.rol === "operador" || usuario.rol === "medico") && usuario.id_sede !== turno.id_sede) {
      return respuestaError(res, 403, "No podés cancelar turnos de otra sede");
    }

    await pool.query("UPDATE turno SET estado = 'cancelado' WHERE id = ?", [id]);

    await crearNotificacion(
      turno.id_paciente,
      "turno_cancelado",
      `Tu turno del ${formatearFechaHora(turno.fecha, turno.hora)} fue cancelado.`
    );

    return respuestaOk(res, 200, { mensaje: "Turno cancelado correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al cancelar el turno");
  }
}

export async function atenderTurno(req, res) {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    if (usuario.rol !== "medico") {
      return respuestaError(res, 403, "Solo un médico puede marcar un turno como atendido");
    }

    const [[turno]] = await pool.query(
      "SELECT t.*, a.id_medico, a.id_sede FROM turno t JOIN agenda a ON t.id_agenda = a.id WHERE t.id = ?",
      [id]
    );
    if (!turno) return respuestaError(res, 404, "Turno no encontrado");

    if (turno.id_medico !== usuario.id) {
      return respuestaError(res, 403, "Solo podés atender tus propios turnos");
    }
    if (turno.estado !== "confirmado") {
      return respuestaError(res, 400, "Solo se pueden atender turnos confirmados");
    }

    await pool.query("UPDATE turno SET estado = 'atendido' WHERE id = ?", [id]);

    await crearNotificacion(
      turno.id_paciente,
      "turno_atendido",
      `Tu turno del ${formatearFechaHora(turno.fecha, turno.hora)} fue registrado como atendido.`
    );

    return respuestaOk(res, 200, { mensaje: "Turno marcado como atendido" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al atender el turno");
  }
}

export async function misTurnos(req, res) {
  try {
    const id_paciente = req.usuario.id;
    const [turnos] = await pool.query(
      `SELECT t.*, a.fecha AS agenda_fecha, a.id_medico, a.id_sede, a.id_especialidad
       FROM turno t JOIN agenda a ON t.id_agenda = a.id
       WHERE t.id_paciente = ?
       ORDER BY t.fecha ASC, t.hora ASC`,
      [id_paciente]
    );
    return respuestaOk(res, 200, turnos);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar turnos");
  }
}

export async function turnosPorMedico(req, res) {
  try {
    const usuario = req.usuario;
    const { fecha } = req.query;
    if (!fecha) return respuestaError(res, 400, "Se requiere el parámetro fecha");

    const id_medico = usuario.id;
    const [turnos] = await pool.query(
      `SELECT t.*, a.id_especialidad, a.id_sede
       FROM turno t JOIN agenda a ON t.id_agenda = a.id
       WHERE a.id_medico = ? AND t.fecha = ?
       ORDER BY t.hora ASC`,
      [id_medico, fecha]
    );
    return respuestaOk(res, 200, turnos);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar turnos del médico");
  }
}

export async function turnosPorSede(req, res) {
  try {
    const usuario = req.usuario;
    const { fecha } = req.query;
    if (!fecha) return respuestaError(res, 400, "Se requiere el parámetro fecha");

    const id_sede = usuario.id_sede;
    const [turnos] = await pool.query(
      `SELECT t.*, a.id_medico, a.id_especialidad
       FROM turno t JOIN agenda a ON t.id_agenda = a.id
       WHERE a.id_sede = ? AND t.fecha = ?
       ORDER BY t.hora ASC`,
      [id_sede, fecha]
    );
    return respuestaOk(res, 200, turnos);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar turnos de la sede");
  }
}