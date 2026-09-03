import { Router } from "express";
import { obtenerLogsAuditoria } from "../controllers/auditoria.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

// Solo admin puede acceder a los logs de auditoría
router.use(verificarToken, verificarRol("admin"));

router.get("/", obtenerLogsAuditoria);

export default router;
