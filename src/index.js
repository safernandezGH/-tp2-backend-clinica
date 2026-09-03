import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database/db.js";
import authRoutes from "./routes/auth.routes.js";
import sedeRoutes from "./routes/sede.routes.js";
import especialidadRoutes from "./routes/especialidad.routes.js";
import coberturaRoutes from "./routes/cobertura.routes.js";
import agendaRoutes from "./routes/agenda.routes.js";
import turnoRoutes from "./routes/turno.routes.js";
import historialRoutes from "./routes/historial.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";
import auditoriaRoutes from "./routes/auditoria.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint simple para probar que el server y la conexión a la base andan
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      codigo: 200,
      estado: "ok",
      datos: { mensaje: "Servidor y base de datos funcionando correctamente" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      codigo: 500,
      estado: "Error de conexión a la base de datos",
      datos: null,
    });
  }
});

app.use("/sedes", sedeRoutes);
app.use("/especialidades", especialidadRoutes);
app.use("/coberturas", coberturaRoutes);
app.use("/agenda", agendaRoutes);
app.use("/turnos", turnoRoutes);
app.use("/historial", historialRoutes);
app.use("/notificaciones", notificacionRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/auditoria", auditoriaRoutes);
app.use("/reportes", reportesRoutes);

app.use("/auth", authRoutes);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({
    codigo: 404,
    estado: "Recurso no encontrado",
    datos: null,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
