import { Router } from "express";
import { login, register } from "../controllers/authController"; // Impor register

const router = Router();

router.post("/login", login);
router.post("/register", register); // <--- Tambahkan jalur ini

export default router;