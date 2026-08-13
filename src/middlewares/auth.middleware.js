import { verificarTokenJWT } from "../services/jwt.service.js";
import { respuestaError } from "../utils/response.js";

// Valida que venga un JWT válido en el header Authorization: Bearer <token>
export function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return respuestaError(res, 401, "Token no proporcionado");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verificarTokenJWT(token);
    req.usuario = payload; // { id, rol, id_sede }
    next();
  } catch (error) {
    return respuestaError(res, 401, "Token inválido o vencido");
  }
}
