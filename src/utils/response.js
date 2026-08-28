// Estructura uniforme de respuesta pedida en el enunciado general:
// { codigo, estado, datos }

export function respuestaOk(res, codigo, datos = null) {
  return res.status(codigo).json({
    codigo,
    estado: "ok",
    datos,
  });
}

export function respuestaError(res, codigo, mensaje) {
  return res.status(codigo).json({
    codigo,
    estado: mensaje,
    datos: null,
  });
}
