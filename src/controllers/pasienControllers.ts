import { Response } from "express";
import prisma from "../utils/prisma";
import { encryptAES, decryptAES } from "../utils/aesCrypto";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { nama, nik, tanggal_lahir, jenis_kelamin, alamat, no_telepon } =
      req.body;

    // validasi input dasar
    if (
      !nama ||
      !nik ||
      !tanggal_lahir ||
      !jenis_kelamin ||
      !alamat ||
      !no_telepon
    ) {
      res.status(400).json({
        message: "Semua field biodata wajib diisi.",
      });
      return;
    }

    // Enkripsi data sensitif menggunakan AES
    const encryptedNik = encryptAES(nik);
    const encryptedAlamat = encryptAES(alamat);
    const encryptedNoTelepon = encryptAES(no_telepon);

    // Generate Nomor Rekam Medis (Format: WM + ^ angka acak/waktu)
    const id_rm = `WM${Date.now().toString().slice(-6)}`;

    // simpan ke database menggunakan Prisma
    const pasienBaru = await prisma.pasien.create({
      data: {
        id_rm,
        nama, // Nama tidak dienkripsi agar mudah dicari
        nik: encryptedNik,
        tanggal_lahir: new Date(tanggal_lahir),
        jenis_kelamin,
        alamat: encryptedAlamat,
        no_telepon: encryptedNoTelepon,
      },
    });

    res.status(201).json({
      message: "Data pasien berhasil didaftarkan.",
      nama: pasienBaru.nama,
      nik: pasienBaru.nik,
      alamat: pasienBaru.alamat,
    });
  } catch (error) {
    console.error("Error saat membuat pasien:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const getAllPasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // ambil semua data dari database
    const pasiens = await prisma.pasien.findMany({
      where: { is_active: true },
      orderBy: {
        waktu_daftar: "desc",
      },
    });

    // prosses dekripsi AES
    // mapping array hasil database
    const decryptedPasiens = pasiens.map((pasien) => {
      return {
        ...pasien,
        // mengembalikan chipertext ke plaintext
        nik: decryptAES(pasien.nik),
        alamat: decryptAES(pasien.alamat),
        no_telepon: decryptAES(pasien.no_telepon),
      };
    });

    // Kirim response
    res.status(200).json({
      message: "Data pasien berhasil diambil.",
      data: decryptedPasiens,
    });
  } catch (error) {
    console.error("Error saat mengambil data pasien:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const updatePasien = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id_rm = req.params.id_rm as string;
    const { nama, nik, tanggal_lahir, jenis_kelamin, alamat, no_telepon } =
      req.body;

    // Siapkan objek data yang akan diupdate
    const updateData: any = { nama, jenis_kelamin };
    if (tanggal_lahir) updateData.tanggal_lahir = new Date(tanggal_lahir);

    // Proses Enkripsi Ulang jika data sensitif diubah
    if (nik) updateData.nik = encryptAES(nik);
    if (alamat) updateData.alamat = encryptAES(alamat);
    if (no_telepon) updateData.no_telepon = encryptAES(no_telepon);

    const pasienUpdate = await prisma.pasien.update({
      where: { id_rm },
      data: updateData,
    });

    res.status(200).json({
      message: "Data pasien berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error saat memperbarui data pasien:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
};

// Fungsi Soft Delete Pasien
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

    res.status(200).json({
      message: "Data pasien berhasil dihapus (soft delete).",
    });
  } catch (error) {
    console.error("Error saat menghapus data pasien:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }
};

// Fungsi Mengambil Detail Satu Pasien & Riwayat Medis (Untuk Form Edit & Detail Frontend)
export const getPasienById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id_rm = req.params.id_rm as string;

    // 1. Ambil pasien beserta relasi Rekam Medis-nya
    const pasien = await prisma.pasien.findUnique({
      where: { id_rm },
      include: {
        // Tarik semua riwayat rekam medis, urutkan dari yang paling baru
        rekamMedis: {
          orderBy: { waktu_periksa: "desc" },
          include: {
            dokter: { select: { username: true } }, // Ambil nama dokter pemeriksa
          },
        },
      },
    });

    // Validasi jika pasien tidak ditemukan atau sudah di-soft delete
    if (!pasien || !pasien.is_active) {
      res
        .status(404)
        .json({ message: "Data pasien tidak ditemukan atau sudah dihapus" });
      return;
    }

    // Helper Dekripsi aman untuk field rekam medis yang mungkin kosong (null)
    const safeDecrypt = (text: string | null | undefined) =>
      text ? decryptAES(text) : null;

    // 2. DEKRIPSI AES GANDA (Biodata + Riwayat Medis) SEBELUM DIKIRIM KE FRONTEND
    const decryptedPasien = {
      ...pasien,
      nik: decryptAES(pasien.nik),
      alamat: decryptAES(pasien.alamat),
      no_telepon: decryptAES(pasien.no_telepon),

      // Map dan dekripsi array rekam medis
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
    console.error("Error saat mengambil detail pasien:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengambil detail pasien" });
  }
};
