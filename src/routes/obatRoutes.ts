import { Router } from "express";
import {
  getAllObat,
  createObat,
  updateObat,
  deleteObat,
} from "../controllers/obatController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getAllObat);
router.post("/", authenticateToken, createObat);
router.put("/:id", authenticateToken, updateObat);
router.delete("/:id", authenticateToken, deleteObat);

export default router;
