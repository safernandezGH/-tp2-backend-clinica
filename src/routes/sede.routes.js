import { Router } from "express";
import {
  crearSede, listarSedes, obtenerSede, actualizarSede, eliminarSede,
} from "../controllers/sede.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();
router.use(verificarToken, verificarRol("admin"));

router.post("/", crearSede);
router.get("/", listarSedes);
router.get("/:id", obtenerSede);
router.put("/:id", actualizarSede);
router.delete("/:id", eliminarSede);

export default router;