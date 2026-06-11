import { Request, Response } from "express";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // validasi input
    if (!username || !password) {
      res.status(400).json({
        message: "Username dan password wajib diisi",
      });
      return;
    }

    // cari user di database
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      res.status(401).json({
        message: "Username tidak ditemukan",
      });
      return;
    }

    // Cek kesesuaian password (bcrypt compare)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Password salah",
      });
      return;
    }

    // generate JWT Token (berlaku 8 jam)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // kirim response sukses
    res.status(200).json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

// FUNGSI REGISTER BARU
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role, poli_tugas } = req.body;

    // 1. Validasi Input Dasar
    if (!username || !password || !role) {
      res
        .status(400)
        .json({ message: "Username, password, dan role wajib diisi." });
      return;
    }

    // 2. Cek apakah username sudah ada di database
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res
        .status(400)
        .json({ message: "Username sudah terdaftar. Gunakan yang lain." });
      return;
    }

    // 3. Enkripsi (Hash) Password demi keamanan
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Simpan ke Database
    const newUser = await prisma.user.create({
      data: {
        username,
        password_hash,
        role,
        // poli_tugas hanya diisi jika role-nya DOKTER
        poli_tugas: role === "DOKTER" ? poli_tugas : null,
      },
      // Jangan kembalikan password_hash ke frontend!
      select: {
        id: true,
        username: true,
        role: true,
        poli_tugas: true,
      },
    });

    res.status(201).json({
      message: "Pembuatan akun berhasil!",
      data: newUser,
    });
  } catch (error) {
    console.error("Error saat register:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};
