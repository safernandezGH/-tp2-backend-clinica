import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

function puedeGestionar(usuarioLogueado, idMedicoObjetivo) {
  if (usuarioLogueado.rol === "operador") return true;
  if (usuarioLogueado.rol === "medico" && usuarioLogueado.id === Number(idMedicoObjetivo)) return true;
  return false;
}

export async function crearAgenda(req, res) {
  try {
    const { hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede } = req.body;
    if (!hora_entrada || !hora_salida || !fecha || !id_medico || !id_especialidad || !id_sede) {
      return respuestaError(res, 400, "Faltan datos obligatorios (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede)");
    }
    if (!puedeGestionar(req.usuario, id_medico)) {
      return respuestaError(res, 403, "No podés cargar agenda para otro médico");
    }
    const [medicos] = await pool.query(
      "SELECT id FROM usuario WHERE id = ? AND rol = 'medico'", [id_medico]
    );
    if (medicos.length === 0) {
      return respuestaError(res, 400, "El id_medico indicado no corresponde a un médico válido");
    }
    const [resultado] = await pool.query(
      `INSERT INTO agenda (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
    );
    return respuestaOk(res, 201, {
      id: resultado.insertId, hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede,
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear el turno de agenda");
  }
}

export async function listarAgenda(req, res) {
  try {
    const { id_medico, id_sede, fecha } = req.query;
    let condiciones = [];
    let valores = [];

    if (req.usuario.rol === "medico") {
      condiciones.push("id_medico = ?");
      valores.push(req.usuario.id);
    } else if (id_medico) {
      condiciones.push("id_medico = ?");
      valores.push(id_medico);
    }
    if (id_sede) {
      condiciones.push("id_sede = ?");
      valores.push(id_sede);
    }
    if (fecha) {
      condiciones.push("fecha = ?");
      valores.push(fecha);
    }

    let sql = "SELECT * FROM agenda";
    if (condiciones.length > 0) {
      sql += " WHERE " + condiciones.join(" AND ");
    }

    const [agenda] = await pool.query(sql, valores);
    return respuestaOk(res, 200, agenda);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar la agenda");
  }
}

export async function obtenerAgenda(req, res) {
  try {
    const { id } = req.params;
    const [registros] = await pool.query("SELECT * FROM agenda WHERE id = ?", [id]);
    if (registros.length === 0) {
      return respuestaError(res, 404, "Turno de agenda no encontrado");
    }
    const registro = registros[0];
    if (!puedeGestionar(req.usuario, registro.id_medico)) {
      return respuestaError(res, 403, "No podés ver la agenda de otro médico");
    }
    return respuestaOk(res, 200, registro);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener el turno de agenda");
  }
}

export async function actualizarAgenda(req, res) {
  try {
    const { id } = req.params;
    const { hora_entrada, hora_salida, fecha, id_especialidad, id_sede } = req.body;
    const [registros] = await pool.query("SELECT * FROM agenda WHERE id = ?", [id]);
    if (registros.length === 0) {
      return respuestaError(res, 404, "Turno de agenda no encontrado");
    }
    const registro = registros[0];
    if (!puedeGestionar(req.usuario, registro.id_medico)) {
      return respuestaError(res, 403, "No podés modificar la agenda de otro médico");
    }
    if (!hora_entrada || !hora_salida || !fecha || !id_especialidad || !id_sede) {
      return respuestaError(res, 400, "Faltan datos obligatorios (hora_entrada, hora_salida, fecha, id_especialidad, id_sede)");
    }
    await pool.query(
      `UPDATE agenda SET hora_entrada = ?, hora_salida = ?, fecha = ?, id_especialidad = ?, id_sede = ?
       WHERE id = ?`,
      [hora_entrada, hora_salida, fecha, id_especialidad, id_sede, id]
    );
    return respuestaOk(res, 200, {
      id: Number(id), hora_entrada, hora_salida, fecha, id_medico: registro.id_medico, id_especialidad, id_sede,
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al actualizar el turno de agenda");
  }
}

export async function eliminarAgenda(req, res) {
  try {
    const { id } = req.params;
    const [registros] = await pool.query("SELECT * FROM agenda WHERE id = ?", [id]);
    if (registros.length === 0) {
      return respuestaError(res, 404, "Turno de agenda no encontrado");
    }
    const registro = registros[0];
    if (!puedeGestionar(req.usuario, registro.id_medico)) {
      return respuestaError(res, 403, "No podés eliminar la agenda de otro médico");
    }
    const [turnosAsociados] = await pool.query(
      "SELECT id FROM turno WHERE id_agenda = ? LIMIT 1", [id]
    );
    if (turnosAsociados.length > 0) {
      return respuestaError(res, 409, "No se puede eliminar: hay turnos de pacientes asociados a esta agenda");
    }
    await pool.query("DELETE FROM agenda WHERE id = ?", [id]);
    return respuestaOk(res, 200, { mensaje: "Turno de agenda eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al eliminar el turno de agenda");
  }
}