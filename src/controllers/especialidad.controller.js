import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

export async function crearEspecialidad(req, res) {
  try {
    const { descripcion } = req.body;
    if (!descripcion) {
      return respuestaError(res, 400, "Falta el dato obligatorio: descripcion");
    }
    const [resultado] = await pool.query(
      "INSERT INTO especialidad (descripcion) VALUES (?)", [descripcion]
    );
    return respuestaOk(res, 201, { id: resultado.insertId, descripcion });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear la especialidad");
  }
}

export async function listarEspecialidades(req, res) {
  try {
    const [especialidades] = await pool.query("SELECT * FROM especialidad");
    return respuestaOk(res, 200, especialidades);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar las especialidades");
  }
}

export async function obtenerEspecialidad(req, res) {
  try {
    const { id } = req.params;
    const [especialidades] = await pool.query("SELECT * FROM especialidad WHERE id = ?", [id]);
    if (especialidades.length === 0) {
      return respuestaError(res, 404, "Especialidad no encontrada");
    }
    return respuestaOk(res, 200, especialidades[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener la especialidad");
  }
}

export async function actualizarEspecialidad(req, res) {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    const [especialidades] = await pool.query("SELECT id FROM especialidad WHERE id = ?", [id]);
    if (especialidades.length === 0) {
      return respuestaError(res, 404, "Especialidad no encontrada");
    }
    if (!descripcion) {
      return respuestaError(res, 400, "Falta el dato obligatorio: descripcion");
    }
    await pool.query("UPDATE especialidad SET descripcion = ? WHERE id = ?", [descripcion, id]);
    return respuestaOk(res, 200, { id: Number(id), descripcion });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al actualizar la especialidad");
  }
}

export async function eliminarEspecialidad(req, res) {
  try {
    const { id } = req.params;
    const [especialidades] = await pool.query("SELECT id FROM especialidad WHERE id = ?", [id]);
    if (especialidades.length === 0) {
      return respuestaError(res, 404, "Especialidad no encontrada");
    }
    const [medicosAsociados] = await pool.query(
      "SELECT id FROM medico_especialidad WHERE id_especialidad = ? LIMIT 1", [id]
    );
    if (medicosAsociados.length > 0) {
      return respuestaError(res, 409, "No se puede eliminar la especialidad: tiene médicos asociados");
    }
    await pool.query("DELETE FROM especialidad WHERE id = ?", [id]);
    return respuestaOk(res, 200, { mensaje: "Especialidad eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al eliminar la especialidad");
  }
}