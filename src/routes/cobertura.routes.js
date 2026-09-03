import { Router } from "express";
import {
  crearCobertura, listarCoberturas, obtenerCobertura,
  actualizarCobertura, eliminarCobertura, listarCoberturasPublico,
} from "../controllers/cobertura.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

router.get("/publicas", listarCoberturasPublico);

router.use(verificarToken, verificarRol("admin"));

router.post("/", crearCobertura);
router.get("/", listarCoberturas);
router.get("/:id", obtenerCobertura);
router.put("/:id", actualizarCobertura);
router.delete("/:id", eliminarCobertura);

export default router;