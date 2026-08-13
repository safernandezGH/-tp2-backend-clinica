import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database/db.js";
import authRoutes from "./routes/auth.routes.js";

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
