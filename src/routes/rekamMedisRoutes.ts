import { Router } from "express";
import {
  createRekamMedis,
  getRekamMedisByNopen,
  getAllRekamMedis, // <-- Tambahkan import ini
} from "../controllers/rekamMedisController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Endpoint untuk menyimpan rekam medis
router.post("/", authenticateToken, createRekamMedis);

// Endpoint untuk mengambil SEMUA rekam medis (Untuk Tabel Master)
router.get("/", authenticateToken, getAllRekamMedis); // <-- Tambahkan baris ini

// Endpoint untuk mengambil detail 1 rekam medis
router.get("/:nopen", authenticateToken, getRekamMedisByNopen);

export default router;
