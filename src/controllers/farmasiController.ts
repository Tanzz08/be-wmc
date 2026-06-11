import { Response } from "express";
import prisma from "../utils/prisma";
import { decryptAES } from "../utils/aesCrypto";
import { AuthRequest } from "../middlewares/authMiddleware";

// 1. GET ANTREAN FARMASI (Hanya yang berstatus TUNGGU_FARMASI atau PROSES_FARMASI)
export const getAntreanFarmasi = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const antreanFarmasi = await prisma.antrean.findMany({
      where: {
        status_antrean: {
          in: [
            "TUNGGU_FARMASI",
            "PROSES_FARMASI",
            "OBAT_SIAP",
            "SELESAI_FARMASI",
          ],
        },
      },
      orderBy: { tgl_order_resep: "desc" },
      include: {
        pasien: {
          select: { nama: true, jenis_kelamin: true, tanggal_lahir: true },
        },
        dokter: {
          select: { username: true },
        },
        rekamMedis: {
          select: { terapi_pengobatan: true }, // KITA AMBIL RESEPNYA DARI SINI
        },
      },
    });

    // Dekripsi Resep Obat agar bisa dibaca Apoteker
    const dataDecrypted = antreanFarmasi.map((item: any) => {
      let resepPlaintext = null;
      if (item.rekamMedis?.terapi_pengobatan) {
        resepPlaintext = decryptAES(item.rekamMedis.terapi_pengobatan);
      }

      return {
        ...item,
        resep_obat: resepPlaintext, // Kita keluarkan resepnya sebagai variabel baru agar mudah dibaca frontend
      };
    });

    res.status(200).json({
      message: "Berhasil mengambil antrean farmasi beserta resep obat.",
      data: dataDecrypted,
    });
  } catch (error) {
    console.error("Error get antrean farmasi:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};
