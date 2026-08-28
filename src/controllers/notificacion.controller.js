import pool from "../database/db.js";
import { respuestaOk, respuestaError } from "../utils/response.js";

export async function listarNotificaciones(req, res) {
  try {
    const [notificaciones] = await pool.query(
      "SELECT * FROM notificacion WHERE id_usuario = ? ORDER BY fecha DESC",
      [req.usuario.id]
    );
    return respuestaOk(res, 200, notificaciones);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al listar notificaciones");
  }
}

export async function marcarLeida(req, res) {
  try {
    const { id } = req.params;
    const [[notif]] = await pool.query("SELECT * FROM notificacion WHERE id = ?", [id]);
    if (!notif) return respuestaError(res, 404, "Notificación no encontrada");
    if (notif.id_usuario !== req.usuario.id) {
      return respuestaError(res, 403, "No podés modificar notificaciones de otro usuario");
    }
    await pool.query("UPDATE notificacion SET leida = 1 WHERE id = ?", [id]);
    return respuestaOk(res, 200, { mensaje: "Notificación marcada como leída" });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, "Error interno al marcar notificación");
  }
}