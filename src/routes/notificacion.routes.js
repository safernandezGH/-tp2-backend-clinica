import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { listarNotificaciones, marcarLeida } from "../controllers/notificacion.controller.js";

const router = Router();

router.get("/", verificarToken, listarNotificaciones);
router.patch("/:id/leer", verificarToken, marcarLeida);

export default router;