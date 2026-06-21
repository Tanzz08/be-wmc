import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
// 1. PASTIKAN BARIS INI ADA
import authRoutes from "./routes/authRoutes";
import pasienRoutes from "./routes/pasienRoutes";
import antreanRoutes from "./routes/antreanRoutes";
import rekamMedisRoutes from "./routes/rekamMedisRoutes";
import obatRoutes from "./routes/obatRoutes"; // <--- Impor obatRoutes
import userRoutes from "./routes/userRoutes"; // <--- Impor userRoutes

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json());
// --- AKTIFKAN CORS SEBELUM ROUTES ---
app.use(
  cors({
    // Masukkan kedua URL: localhost untuk development, dan domain vercel untuk production
    origin: [
      "http://localhost:3001",
      "https://fe-wmc.vercel.app", // <-- PASTIKAN TIDAK ADA GARIS MIRING (/) DI AKHIR URL
    ],
    credentials: true, // Wajib diatur true agar NextAuth dan token bisa lewat dengan aman
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

app.use("/api/obat", obatRoutes); // <--- Gunakan obatRoutes untuk jalur /api/obat

app.use("/api/users", userRoutes);

// Endpoint dasar untuk tes
app.get("/api", (req: Request, res: Response) => {
  res.json({ message: "Selamat datang di API Klinik WMC" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
  console.log(`🔒 Sistem Keamanan AES-256-CBC siap digunakan.`);
});
