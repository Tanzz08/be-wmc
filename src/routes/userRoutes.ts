import { Router } from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";

const router = Router();

// Hanya SUPER_ADMIN yang boleh mengakses route ini
router.use(authenticateToken, authorizeRole(["SUPER_ADMIN"]));

router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
