import { Response } from "express";
import prisma from "../utils/prisma";
import { decryptAES } from "../utils/aesCrypto";
import { AuthRequest } from "../middlewares/authMiddleware";

// 1. CREATE ANTREAN (Oleh Resepsionis)
// 1. CREATE ANTREAN (Oleh Resepsionis)
export const createAntrean = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // =========================================================
    // CCTV DEBUGGING START
    // =========================================================
    console.log("\n=== MEMPROSES PENDAFTARAN ANTREAN ===");
    console.log("1. Data dari Frontend (req.body):", req.body);
    console.log("2. Data User dari Token (req.user):", req.user);
    // =========================================================

    const { id_rm, status_pasien, instalasi, unit_pelayanan, cara_bayar } =
      req.body;

    // Mengambil ID Resepsionis yang sedang login dari token JWT
    const id_user_daftar = req.user?.id;

    // Validasi Kelengkapan Data
    if (
      !id_rm ||
      !status_pasien ||
      !instalasi ||
      !unit_pelayanan ||
      !cara_bayar
    ) {
      console.log("❌ ERROR: Ada field req.body yang kosong/undefined!");
      res
        .status(400)
        .json({ message: "Semua field pendaftaran antrean wajib diisi." });
      return;
    }

    // Validasi Token/User
    if (!id_user_daftar) {
      console.log("❌ ERROR: ID User Resepsionis tidak terbaca dari token!");
      res.status(401).json({
        message: "Sesi tidak valid, gagal mengidentifikasi resepsionis.",
      });
      return;
    }

    // Generate NOPEN (Nomor Pendaftaran) - Format: REG-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const nopen = `REG-${dateStr}-${randomStr}`;

    const antreanBaru = await prisma.antrean.create({
      data: {
        nopen,
        id_rm,
        status_pasien,
        instalasi,
        unit_pelayanan,
        cara_bayar,
        id_user_daftar: Number(id_user_daftar),
        status_antrean: "TUNGGU_POLI",
        tgl_registrasi: new Date(),
      },
    });

    console.log(
      "✅ SUKSES: Antrean didaftarkan dengan NOPEN:",
      antreanBaru.nopen,
    );

    res.status(201).json({
      message: "Antrean berhasil didaftarkan.",
      data: antreanBaru,
    });
  } catch (error) {
    console.error("❌ ERROR PRISMA/SERVER:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// 2. GET ALL ANTREAN (Dengan Filter Cerdas Berdasarkan Role)
export const getAllAntrean = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    // 1. Cari tahu siapa user yang sedang login dan apa poli tugasnya
    const currentUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    // 2. Siapkan wadah filter
    let queryFilter: any = {};

    // 3. LOGIKA FILTER: Jika dia DOKTER, kunci datanya hanya untuk polinya saja
    if (currentUser?.role === "DOKTER" && currentUser.poli_tugas) {
      queryFilter.unit_pelayanan = currentUser.poli_tugas;
    }
    // Jika dia RESEPSIONIS, queryFilter tetap kosong (artinya ambil semua data poli)

    const antreans = await prisma.antrean.findMany({
      where: queryFilter, // Terapkan filter di sini
      orderBy: { tgl_registrasi: "desc" },
      include: {
        pasien: true,
        dokter: { select: { username: true } },
        user_daftar: { select: { username: true } },
      },
    });

    // Melakukan dekripsi AES pada data pasien yang terhubung
    // Melakukan dekripsi AES pada data pasien yang terhubung
    const decryptedAntreans = antreans.map((antrean) => ({
      ...antrean,
      pasien: {
        ...antrean.pasien,
        alamat: decryptAES(antrean.pasien.alamat),
        no_telepon: decryptAES(antrean.pasien.no_telepon),
      },
    }));

    res.status(200).json({
      message: "Data antrean berhasil diambil sesuai hak akses.",
      data: decryptedAntreans,
    });
  } catch (error) {
    console.error("Error get all antrean:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// 3. UPDATE STATUS ANTREAN (Untuk Dokter / Farmasi mengupdate Timestamp SLA)
export const updateStatusAntrean = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Gunakan "as string" untuk menegaskan tipe data kepada TypeScript
    const nopen = req.params.nopen as string;
    const { status_antrean, id_dokter } = req.body;

    // Objek untuk menampung data yang akan diupdate secara dinamis
    const updateData: any = { status_antrean };

    // =========================================================
    // SINKRONISASI STATUS FRONTEND & BACKEND (PENANGKAP WAKTU)
    // =========================================================

    // Saat Dokter menekan tombol "Panggil & Periksa"
    if (status_antrean === "PROSES_POLI" || status_antrean === "PEMERIKSAAN") {
      updateData.tgl_terima_poli = new Date();
    }

    // Saat Dokter menyelesaikan poli tanpa obat
    if (status_antrean === "SELESAI_POLI" || status_antrean === "SELESAI") {
      updateData.tgl_final_poli = new Date();
    }

    // (Opsional) Jika Apoteker menggunakan tombol "Proses Resep" manual
    if (status_antrean === "FARMASI") {
      updateData.tgl_masuk_farmasi = new Date();
    }

    // Saat Apoteker menekan tombol "Serahkan Pasien"
    if (status_antrean === "SELESAI_FARMASI") {
      updateData.tgl_selesai_farmasi = new Date();
    }

    // Jika dokter yang menerima poli, masukkan ID dokternya
    if (id_dokter) updateData.id_dokter = Number(id_dokter);

    const antreanUpdate = await prisma.antrean.update({
      where: { nopen },
      data: updateData,
    });

    res.status(200).json({
      message: `Status antrean berhasil diubah menjadi ${status_antrean}`,
      data: antreanUpdate,
    });
  } catch (error) {
    console.error("Error update status antrean:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};
