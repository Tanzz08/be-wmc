import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
// 1. PASTIKAN BARIS INI ADA
import authRoutes from "./routes/authRoutes";
import pasienRoutes from "./routes/pasienRoutes";
import antreanRoutes from "./routes/antreanRoutes";
import rekamMedisRoutes from "./routes/rekamMedisRoutes";
import farmasiRoutes from "./routes/farmasiRoutes"; // <--- Impor farmasiRoutes

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json());
// --- AKTIFKAN CORS SEBELUM ROUTES ---
app.use(
  cors({
    origin: "http://localhost:3001", // Izinkan frontend Next.js
    credentials: true,
  }),
);

// 2. PASTIKAN BARIS INI ADA (Menyambungkan rute)
app.use("/api/auth", authRoutes);

// apie pasien
app.use("/api/pasien", pasienRoutes);

// api antrean
app.use("/api/antrean", antreanRoutes);

// api rekam medis
app.use("/api/rekam-medis", rekamMedisRoutes);

// 3. PASTIKAN BARIS INI ADA (Menyambungkan farmasiRoutes)
app.use("/api/farmasi", farmasiRoutes); // <--- Gunakan farmasiRoutes untuk jalur /api/farmasi



// Endpoint dasar untuk tes
app.get("/api", (req: Request, res: Response) => {
  res.json({ message: "Selamat datang di API Klinik WMC" });
});



app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
  console.log(`🔒 Sistem Keamanan AES-256-CBC siap digunakan.`);
});
