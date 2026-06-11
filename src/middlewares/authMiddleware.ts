import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Mengambil token dari header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      message: "Akses ditolak. Token tidak ditemukan.",
    });
    return;
  }

  try {
    // Verifikasi token
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // simpan data user ke dalam request
    next(); // lanjut ke controller berikutnya
  } catch (error) {
    res.status(403).json({
      message: "Token tidak valid atau sudah kadaluarsa.",
    });
  }
};
