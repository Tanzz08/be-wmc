import { Response } from "express";
import prisma from "../utils/prisma";
import { encryptAES, decryptAES } from "../utils/aesCrypto";
import { AuthRequest } from "../middlewares/authMiddleware";

// Helper fungsi untuk enkripsi/dekripsi aman (mengabaikan null/undefined/string kosong)
const safeEncrypt = (text: string | undefined | null) =>
  text ? encryptAES(text) : null;
const safeDecrypt = (text: string | undefined | null) =>
  text ? decryptAES(text) : null;

// 1. BUAT REKAM MEDIS BARU
export const createRekamMedis = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      nopen,
      id_rm,
      // 1. Data Administrasi & Vital Sign (Plaintext)
      tgl_masuk,
      tgl_keluar,
      ruang_rawat,
      keadaan_umum,
      kesadaran,
      tensi_darah,
      nadi,
      napas,
      suhu,
      skala_nyeri,
      kondisi_keluar,
      cara_keluar,
      // 2. Data Klinis Sensitif (Akan dienkripsi)
      riwayat_sekarang,
      riwayat_dahulu,
      alergi,
      pemeriksaan_fisis,
      laboratorium,
      radiologi,
      diagnosis_utama,
      icd10_utama,
      diagnosis_sekunder,
      icd10_sekunder,
      terapi_pengobatan,
      tindakan_prosedur,
      icd9_tindakan,
      rencana_diet,
      edukasi,
      instruksi_pulang,
    } = req.body;

    const id_dokter = req.user?.id;

    if (!nopen || !id_rm || !id_dokter) {
      res.status(400).json({
        message: "Parameter wajib (nopen, id_rm, id_dokter) tidak lengkap.",
      });
      return;
    }

    // PRISMA TRANSACTION: Simpan Rekam Medis & Update Status Antrean
    const result = await prisma.$transaction(async (tx) => {
      // A. Simpan Rekam Medis
      const rmBaru = await tx.rekamMedis.create({
        data: {
          nopen,
          id_rm,
          id_dokter: Number(id_dokter),
          // Plaintext (Tidak Dienkripsi)
          tgl_masuk: tgl_masuk ? new Date(tgl_masuk) : null,
          tgl_keluar: tgl_keluar ? new Date(tgl_keluar) : null,
          ruang_rawat,
          keadaan_umum,
          kesadaran,
          tensi_darah,
          nadi,
          napas,
          suhu,
          skala_nyeri,
          kondisi_keluar,
          cara_keluar,

          // Ciphertext AES-256-CBC (Dienkripsi)
          riwayat_sekarang: safeEncrypt(riwayat_sekarang),
          riwayat_dahulu: safeEncrypt(riwayat_dahulu),
          alergi: safeEncrypt(alergi),
          pemeriksaan_fisis: safeEncrypt(pemeriksaan_fisis),
          laboratorium: safeEncrypt(laboratorium),
          radiologi: safeEncrypt(radiologi),
          diagnosis_utama: safeEncrypt(diagnosis_utama),
          icd10_utama, // Kode ICD biasanya standar global, jadi kita biarkan plaintext agar bisa difilter/statistik
          diagnosis_sekunder: safeEncrypt(diagnosis_sekunder),
          icd10_sekunder,
          terapi_pengobatan: safeEncrypt(terapi_pengobatan),
          tindakan_prosedur: safeEncrypt(tindakan_prosedur),
          icd9_tindakan,
          rencana_diet: safeEncrypt(rencana_diet),
          edukasi: safeEncrypt(edukasi),
          instruksi_pulang: safeEncrypt(instruksi_pulang),
        },
      });

      // B. Selesaikan Antrean & Catat SLA
      await tx.antrean.update({
        where: { nopen },
        data: {
          // Jika ada resep/terapi, status jadi TUNGGU_FARMASI. Jika tidak, langsung SELESAI.
          status_antrean: terapi_pengobatan ? "TUNGGU_FARMASI" : "SELESAI",
          tgl_input_asesmen: new Date(), // Catat waktu asesmen
          tgl_input_tindakan: tindakan_prosedur ? new Date() : null, // Catat waktu tindakan jika ada
          tgl_final_poli: new Date(),
          tgl_order_resep: terapi_pengobatan ? new Date() : null, // Waktu resep dikirim ke apotek
        },
      });

      return rmBaru;
    });

    res.status(201).json({
      message:
        "Rekam medis Ringkasan Pulang berhasil disimpan dengan enkripsi AES.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error create rekam medis:", error);
    // Tangani error unique constraint Prisma jika nopen sudah dipakai
    if (error.code === "P2002") {
      res
        .status(400)
        .json({ message: "Rekam medis untuk kunjungan ini sudah ada." });
      return;
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// 2. GET DETAIL REKAM MEDIS (Beserta proses Dekripsi AES)
export const getRekamMedisByNopen = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // FIX: Penegasan tipe data "as string" agar Prisma dan TypeScript akur
    const nopen = req.params.nopen as string;

    const rm = await prisma.rekamMedis.findUnique({
      where: { nopen },
      include: {
        pasien: {
          select: { nama: true, tanggal_lahir: true, jenis_kelamin: true },
        },
        dokter: { select: { username: true } },
      },
    });

    if (!rm) {
      res.status(404).json({ message: "Rekam medis tidak ditemukan." });
      return;
    }

    // PROSES DEKRIPSI AES
    const decryptedRM = {
      ...rm,
      riwayat_sekarang: safeDecrypt(rm.riwayat_sekarang),
      riwayat_dahulu: safeDecrypt(rm.riwayat_dahulu),
      alergi: safeDecrypt(rm.alergi),
      pemeriksaan_fisis: safeDecrypt(rm.pemeriksaan_fisis),
      laboratorium: safeDecrypt(rm.laboratorium),
      radiologi: safeDecrypt(rm.radiologi),
      diagnosis_utama: safeDecrypt(rm.diagnosis_utama),
      diagnosis_sekunder: safeDecrypt(rm.diagnosis_sekunder),
      terapi_pengobatan: safeDecrypt(rm.terapi_pengobatan),
      tindakan_prosedur: safeDecrypt(rm.tindakan_prosedur),
      rencana_diet: safeDecrypt(rm.rencana_diet),
      edukasi: safeDecrypt(rm.edukasi),
      instruksi_pulang: safeDecrypt(rm.instruksi_pulang),
    };

    res.status(200).json({
      message: "Detail rekam medis berhasil diambil dan didekripsi.",
      data: decryptedRM,
    });
  } catch (error) {
    console.error("Error get rekam medis:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// 3. GET SEMUA REKAM MEDIS (Untuk Master Tabel & Pencarian Historis)
export const getAllRekamMedis = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rms = await prisma.rekamMedis.findMany({
      orderBy: { waktu_periksa: "desc" }, // Urutkan dari yang terbaru
      include: {
        pasien: { select: { nama: true } },
        dokter: { select: { username: true } },
      },
    });

    // Dekripsi hanya pada Diagnosis Utama untuk preview di tabel
    const decryptedRMs = rms.map((rm) => ({
      ...rm,
      diagnosis_utama: safeDecrypt(rm.diagnosis_utama),
    }));

    res.status(200).json({
      message: "Berhasil mengambil seluruh data rekam medis",
      data: decryptedRMs,
    });
  } catch (error) {
    console.error("Error get all RM:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};
