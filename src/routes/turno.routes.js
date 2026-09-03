import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";
import {
  altaTurno, cancelarTurno, atenderTurno,
  misTurnos, turnosPorMedico, turnosPorSede
} from "../controllers/turno.controller.js";

const router = Router();

router.post("/", verificarToken, verificarRol("paciente", "operador"), altaTurno);
router.patch("/:id/cancelar", verificarToken, verificarRol("paciente", "operador", "medico"), cancelarTurno);
router.patch("/:id/atender", verificarToken, verificarRol("medico"), atenderTurno);
router.get("/mis-turnos", verificarToken, verificarRol("paciente"), misTurnos);
router.get("/por-medico", verificarToken, verificarRol("medico"), turnosPorMedico);
router.get("/por-sede", verificarToken, verificarRol("operador"), turnosPorSede);

export default router;