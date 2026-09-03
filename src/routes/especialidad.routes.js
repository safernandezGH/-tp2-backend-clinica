import { Router } from "express";
import {
  crearEspecialidad, listarEspecialidades, obtenerEspecialidad,
  actualizarEspecialidad, eliminarEspecialidad,
} from "../controllers/especialidad.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();
router.use(verificarToken, verificarRol("admin"));

router.post("/", crearEspecialidad);
router.get("/", listarEspecialidades);
router.get("/:id", obtenerEspecialidad);
router.put("/:id", actualizarEspecialidad);
router.delete("/:id", eliminarEspecialidad);

export default router;