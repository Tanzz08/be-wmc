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

// Fungsi Otorisasi Role
export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Pastikan req.user sudah diisi oleh fungsi authenticateToken sebelumnya
    if (!req.user) {
      res
        .status(401)
        .json({ message: "Akses ditolak. User tidak teridentifikasi." });
      return;
    }

    // Cek apakah role user saat ini ada di dalam daftar role yang diizinkan
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.",
      });
      return;
    }

    next(); // Lanjut ke controller jika role sesuai
  };
};
