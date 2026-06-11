import { Router } from "express";
import {
  createPasien,
  deletePasien,
  getAllPasien,
  getPasienById,
  updatePasien,
} from "../controllers/pasienControllers";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Endpoint: POST /api/pasien
router.post("/", authenticateToken, createPasien);
router.get("/", authenticateToken, getAllPasien);
router.get('/:id_rm', authenticateToken, getPasienById);
router.put("/:id_rm", authenticateToken, updatePasien);
router.delete("/:id_rm", authenticateToken, deletePasien);

export default router;
