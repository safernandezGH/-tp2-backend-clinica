import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

export async function crearCobertura(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return respuestaError(res, 400, "Falta el dato obligatorio: nombre");
    }
    const [resultado] = await pool.query(
      "INSERT INTO cobertura (nombre) VALUES (?)", [nombre]
    );
    return respuestaOk(res, 201, { id: resultado.insertId, nombre });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al crear la cobertura");
  }
}

export async function listarCoberturas(req, res) {
  try {
    const [coberturas] = await pool.query("SELECT * FROM cobertura");
    return respuestaOk(res, 200, coberturas);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar las coberturas");
  }
}

export async function obtenerCobertura(req, res) {
  try {
    const { id } = req.params;
    const [coberturas] = await pool.query("SELECT * FROM cobertura WHERE id = ?", [id]);
    if (coberturas.length === 0) {
      return respuestaError(res, 404, "Cobertura no encontrada");
    }
    return respuestaOk(res, 200, coberturas[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener la cobertura");
  }
}

export async function actualizarCobertura(req, res) {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const [coberturas] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [id]);
    if (coberturas.length === 0) {
      return respuestaError(res, 404, "Cobertura no encontrada");
    }
    if (!nombre) {
      return respuestaError(res, 400, "Falta el dato obligatorio: nombre");
    }
    await pool.query("UPDATE cobertura SET nombre = ? WHERE id = ?", [nombre, id]);
    return respuestaOk(res, 200, { id: Number(id), nombre });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al actualizar la cobertura");
  }
}

export async function eliminarCobertura(req, res) {
  try {
    const { id } = req.params;
    const [coberturas] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [id]);
    if (coberturas.length === 0) {
      return respuestaError(res, 404, "Cobertura no encontrada");
    }
    const [usuariosAsociados] = await pool.query(
      "SELECT id FROM usuario WHERE id_cobertura = ? LIMIT 1", [id]
    );
    if (usuariosAsociados.length > 0) {
      return respuestaError(res, 409, "No se puede eliminar la cobertura: tiene usuarios asociados");
    }
    await pool.query("DELETE FROM cobertura WHERE id = ?", [id]);
    return respuestaOk(res, 200, { mensaje: "Cobertura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al eliminar la cobertura");
  }
}

export async function listarCoberturasPublico(req, res) {
  try {
    const [coberturas] = await pool.query("SELECT id, nombre FROM cobertura");
    return respuestaOk(res, 200, coberturas);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al obtener las coberturas");
  }
}