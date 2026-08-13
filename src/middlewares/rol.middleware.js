import { respuestaError } from "../utils/response.js";

// Valida que el rol del usuario autenticado esté entre los permitidos.
// Uso: verificarRol("admin", "operador")
// Requiere que verificarToken (auth.middleware.js) ya haya corrido antes
// y haya dejado req.usuario cargado.
export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return respuestaError(res, 401, "No autenticado");
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return respuestaError(res, 403, "No tenés permisos para acceder a este recurso");
    }

    next();
  };
}
