import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";
import { registrarHistorial, consultarHistorial } from "../controllers/historial.controller.js";

const router = Router();

router.post("/", verificarToken, verificarRol("medico"), registrarHistorial);
router.get("/", verificarToken, verificarRol("paciente", "medico"), consultarHistorial);

export default router;