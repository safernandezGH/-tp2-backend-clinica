import { Router } from "express";
import {
  crearAgenda, listarAgenda, obtenerAgenda, actualizarAgenda, eliminarAgenda,
} from "../controllers/agenda.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();
router.use(verificarToken, verificarRol("medico", "operador"));

router.post("/", crearAgenda);
router.get("/", listarAgenda);
router.get("/:id", obtenerAgenda);
router.put("/:id", actualizarAgenda);
router.delete("/:id", eliminarAgenda);

export default router;