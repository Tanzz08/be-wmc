import { Router } from "express";
import {
  getAntreanFarmasi,
  validasiResep,
} from "../controllers/farmasiController";
import { updateStatusAntrean } from "../controllers/antreanController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/antrean", authenticateToken, getAntreanFarmasi);

// PASTIKAN BARIS INI ADA DAN TEPAT PENULISANNYA:
router.put("/antrean/:nopen/validasi-resep", authenticateToken, validasiResep);

// Update status biasa
router.put("/antrean/:nopen/status", authenticateToken, updateStatusAntrean);

export default router;
