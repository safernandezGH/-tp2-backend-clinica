import { Router } from "express";
import {
  turnosPorEspecialidad,
  turnosPorSede,
  rankingMedicos,
  tasaCancelacion,
} from "../controllers/reportes.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

// Solo admin puede acceder a los reportes
router.use(verificarToken, verificarRol("admin"));

router.get("/turnos-por-especialidad", turnosPorEspecialidad);
router.get("/turnos-por-sede", turnosPorSede);
router.get("/ranking-medicos", rankingMedicos);
router.get("/tasa-cancelacion", tasaCancelacion);

export default router;
