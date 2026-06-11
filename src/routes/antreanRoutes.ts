import { Router } from "express";
import {
  createAntrean,
  getAllAntrean,
  updateStatusAntrean,
} from "../controllers/antreanController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/antrean (Untuk mendaftar antrean)
router.post("/", authenticateToken, createAntrean);

// GET /api/antrean (Untuk SWR mengambil data tabel frontend)
router.get("/", authenticateToken, getAllAntrean);

// PUT /api/antrean/:nopen/status (Untuk update status SLA)
router.put("/:nopen/status", authenticateToken, updateStatusAntrean);

export default router;
