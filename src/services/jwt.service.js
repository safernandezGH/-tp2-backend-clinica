import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRA_EN = process.env.JWT_EXPIRES_IN || "8h";

// Arma y firma un token nuevo a partir de un payload (id, rol, id_sede, etc.)
export function generarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRA_EN });
}

// Verifica la firma y el vencimiento. Si es válido, devuelve el payload.
// Si no, jwt.verify() lanza una excepción (la maneja quien lo llame).
export function verificarTokenJWT(token) {
  return jwt.verify(token, SECRET);
}

// Lee el payload SIN comprobar la firma. Útil solo para casos puntuales
// (ej. loguear el "id" de un token vencido); no reemplaza a verificarTokenJWT.
export function decodificarSinVerificar(token) {
  return jwt.decode(token);
}
