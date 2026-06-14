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

// 2. VALIDASI RESEP & POTONG STOK OBAT
export const validasiResep = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const nopen = req.params.nopen as string;
    const { status_antrean, detail_obat } = req.body;
    // detail_obat adalah array dari frontend: [{ id_obat, jumlah, dosis }]

    // Gunakan Prisma Transaction: Agar jika stok habis di tengah proses, status antrean tidak jadi berubah
    const result = await prisma.$transaction(async (tx) => {
      // A. Update Status Antrean & Catat Waktu (SLA)
      const antreanUpdated = await tx.antrean.update({
        where: { nopen },
        data: {
          status_antrean: status_antrean, // Berubah menjadi "OBAT_SIAP"
          tgl_masuk_farmasi: new Date(), // Catat waktu apoteker mulai memproses resep
        },
      });

      // B. Logika Pemotongan Stok Obat Otomatis
      if (detail_obat && Array.isArray(detail_obat) && detail_obat.length > 0) {
        for (const item of detail_obat) {
          // Abaikan jika apoteker mengirim baris kosong
          if (!item.id_obat || !item.jumlah) continue;

          const obatId = Number(item.id_obat);
          const jumlahKeluar = Number(item.jumlah);

          // 1. Cek ketersediaan stok saat ini
          const obatDb = await tx.obat.findUnique({
            where: { id: obatId },
          });

          if (!obatDb) {
            throw new Error(
              `Obat dengan ID ${obatId} tidak ditemukan di database.`,
            );
          }

          if (obatDb.stok < jumlahKeluar) {
            throw new Error(
              `Stok "${obatDb.nama_obat}" tidak mencukupi! Sisa stok: ${obatDb.stok}`,
            );
          }

          // 2. Kurangi stok obat
          await tx.obat.update({
            where: { id: obatId },
            data: {
              stok: obatDb.stok - jumlahKeluar,
            },
          });

          // (Opsional) 3. Jika kamu punya tabel Riwayat/Detail Resep, kamu bisa menyimpannya di sini
          // await tx.detailResep.create({ data: { nopen, id_obat: obatId, jumlah: jumlahKeluar, dosis: item.dosis } });
        }
      }

      return antreanUpdated;
    });

    res.status(200).json({
      message: "Resep berhasil divalidasi dan stok obat otomatis dipotong.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error validasi resep farmasi:", error);
    // Tangkap error kustom jika stok tidak cukup dan kirim ke frontend
    res.status(400).json({
      message:
        error.message ||
        "Terjadi kesalahan saat memvalidasi resep dan memotong stok.",
    });
  }
};
