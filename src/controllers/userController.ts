import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { encryptAES, decryptAES } from "../utils/aesCrypto";
import bcrypt from "bcrypt";

// 1. Ambil Semua User
export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      // Tambahkan nama_lengkap di sini
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        role: true,
        poli_tugas: true,
      },
      orderBy: { id: "asc" },
    });
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data pegawai." });
  }
};

// 2. Tambah User Baru
export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Tangkap nama_lengkap dari req.body
    const { nama_lengkap, username, password, role, poli_tugas } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: "Username sudah digunakan." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama_lengkap, // Simpan ke database
        username,
        password_hash: hashedPassword,
        role,
        poli_tugas: role === "DOKTER" ? poli_tugas : null,
      },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        role: true,
        poli_tugas: true,
      },
    });

    res
      .status(201)
      .json({ message: "Pegawai berhasil ditambahkan.", data: newUser });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan pegawai." });
  }
};

// 3. Update User
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { nama_lengkap, username, password, role, poli_tugas } = req.body;

    const updateData: any = {
      nama_lengkap, // Update nama lengkap
      username,
      role,
      poli_tugas: role === "DOKTER" ? poli_tugas : null,
    };

    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        role: true,
        poli_tugas: true,
      },
    });

    res.status(200).json({
      message: "Data pegawai berhasil diperbarui.",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui data pegawai." });
  }
};

// 4. Hapus User
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "Pegawai berhasil dihapus." });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menghapus pegawai. Pastikan tidak ada data yang terikat.",
    });
  }
};
