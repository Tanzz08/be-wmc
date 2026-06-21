import { Response } from "express";
import prisma from "../utils/prisma";
import { encryptAES, decryptAES } from "../utils/aesCrypto";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Hapus nik dari req.body
    const { nama, tanggal_lahir, jenis_kelamin, alamat, no_telepon } = req.body;

    if (!nama || !tanggal_lahir || !jenis_kelamin || !alamat || !no_telepon) {
      res.status(400).json({ message: "Semua field biodata wajib diisi." });
      return;
    }

    const encryptedAlamat = encryptAES(alamat);
    const encryptedNoTelepon = encryptAES(no_telepon);
    const id_rm = `WM${Date.now().toString().slice(-6)}`;

    const pasienBaru = await prisma.pasien.create({
      data: {
        id_rm,
        nama,
        tanggal_lahir: new Date(tanggal_lahir),
        jenis_kelamin,
        alamat: encryptedAlamat,
        no_telepon: encryptedNoTelepon,
      },
    });

    res.status(201).json({
      message: "Data pasien berhasil didaftarkan.",
      nama: pasienBaru.nama,
      alamat: pasienBaru.alamat,
    });
  } catch (error) {
    console.error("Error saat membuat pasien:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

export const getAllPasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const pasiens = await prisma.pasien.findMany({
      where: { is_active: true },
      orderBy: { waktu_daftar: "desc" },
    });

    const decryptedPasiens = pasiens.map((pasien) => {
      return {
        ...pasien,
        // Hapus dekripsi nik
        alamat: decryptAES(pasien.alamat),
        no_telepon: decryptAES(pasien.no_telepon),
      };
    });

    res.status(200).json({
      message: "Data pasien berhasil diambil.",
      data: decryptedPasiens,
    });
  } catch (error) {
    console.error("Error saat mengambil data pasien:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

export const updatePasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id_rm = req.params.id_rm as string;
    // Hapus nik dari req.body
    const { nama, tanggal_lahir, jenis_kelamin, alamat, no_telepon } = req.body;

    const updateData: any = { nama, jenis_kelamin };
    if (tanggal_lahir) updateData.tanggal_lahir = new Date(tanggal_lahir);

    if (alamat) updateData.alamat = encryptAES(alamat);
    if (no_telepon) updateData.no_telepon = encryptAES(no_telepon);

    await prisma.pasien.update({
      where: { id_rm },
      data: updateData,
    });

    res.status(200).json({ message: "Data pasien berhasil diperbarui." });
  } catch (error) {
    console.error("Error saat memperbarui data pasien:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

export const deletePasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id_rm = req.params.id_rm as string;
    await prisma.pasien.update({
      where: { id_rm },
      data: { is_active: false },
    });
    res
      .status(200)
      .json({ message: "Data pasien berhasil dihapus (soft delete)." });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

export const getPasienById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id_rm = req.params.id_rm as string;

    const pasien = await prisma.pasien.findUnique({
      where: { id_rm },
      include: {
        rekamMedis: {
          orderBy: { waktu_periksa: "desc" },
          include: { dokter: { select: { username: true } } },
        },
      },
    });

    if (!pasien || !pasien.is_active) {
      res
        .status(404)
        .json({ message: "Data pasien tidak ditemukan atau sudah dihapus" });
      return;
    }

    const safeDecrypt = (text: string | null | undefined) =>
      text ? decryptAES(text) : null;

    const decryptedPasien = {
      ...pasien,
      // Hapus dekripsi nik
      alamat: decryptAES(pasien.alamat),
      no_telepon: decryptAES(pasien.no_telepon),
      rekamMedis: pasien.rekamMedis.map((rm) => ({
        ...rm,
        diagnosis_utama: safeDecrypt(rm.diagnosis_utama),
        terapi_pengobatan: safeDecrypt(rm.terapi_pengobatan),
      })),
    };

    res.status(200).json({
      message: "Detail pasien dan riwayat medis berhasil diambil",
      data: decryptedPasien,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengambil detail pasien" });
  }
};
