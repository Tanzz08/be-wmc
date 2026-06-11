import { Router } from "express";
import { getAntreanFarmasi } from "../controllers/farmasiController";
import { updateStatusAntrean } from "../controllers/antreanController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Endpoint untuk mengambil daftar antrean khusus Apoteker (Bisa baca resep)
router.get("/antrean", authenticateToken, getAntreanFarmasi);

// Endpoint untuk Apoteker mengubah status (Proses Farmasi -> Obat Siap)
// Kita menggunakan fungsi dari antreanController karena logikanya sama
router.put("/antrean/:nopen/status", authenticateToken, updateStatusAntrean);

export default router;