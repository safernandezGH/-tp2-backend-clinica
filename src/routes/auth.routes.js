import { Router } from "express";
import {
  registro,
  login,
  perfil,
  listarCoberturas,
} from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

router.post("/registro", registro);
router.post("/login", login);
router.get("/coberturas", listarCoberturas);

// Endpoint protegido solo por verificarToken
router.get("/perfil", verificarToken, perfil);

// Endpoint de ejemplo protegido además por rol, para probar verificarRol
router.get("/admin-test", verificarToken, verificarRol("admin"), (req, res) => {
  res.status(200).json({
    codigo: 200,
    estado: "ok",
    datos: { mensaje: "Acceso concedido, sos admin", usuario: req.usuario },
  });
});

export default router;
