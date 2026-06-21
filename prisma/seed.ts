import bcrypt from "bcrypt";
// KITA IMPORT PRISMA DARI UTILS AGAR TIDAK BIKIN KONEKSI DUA KALI
import prisma from "../src/utils/prisma";

async function main() {
  console.log("⏳ Memulai seeding database...");

  // =========================================================================
  // 1. SEEDING PENGGUNA (ADMIN, RESEPSIONIS, DOKTER)
  // =========================================================================
  console.log("Memeriksa data akun pengguna...");

  // Hash password 'rahasia123' untuk akun pegawai umum
  const hashedPassword = await bcrypt.hash("rahasia123", 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    // Hash password default untuk admin
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        username: "admin",
        password_hash: hashedAdminPassword,
        role: "SUPER_ADMIN",
      },
    });
    console.log("✅ Akun Super Admin berhasil dibuat!");
    console.log("   Username : admin");
    console.log("   Password : admin123");
  } else {
    console.log("ℹ️ Akun Super Admin sudah tersedia di database.");
  }

  // Upsert: Buat jika belum ada, abaikan jika sudah ada
  await prisma.user.upsert({
    where: { username: "resepsionis1" },
    update: {},
    create: {
      username: "resepsionis1",
      password_hash: hashedPassword,
      role: "RESEPSIONIS",
    },
  });

  await prisma.user.upsert({
    where: { username: "dokter1" },
    update: {},
    create: {
      username: "dokter1",
      password_hash: hashedPassword,
      role: "DOKTER",
    },
  });
  console.log("✅ Data Pengguna (User) berhasil disemai!");

  // =========================================================================
  // 2. SEEDING OBAT (FARMASI)
  // =========================================================================
  console.log("\n⏳ Menyiapkan data obat-obatan medis...");

  // Hapus data lama agar stok/harga tidak terganda (duplikat) saat di-seed ulang
  await prisma.obat.deleteMany();

  const obatList = [
    // Analgesik & Antipiretik (Demam & Nyeri)
    {
      nama_obat: "Paracetamol 500mg",
      satuan: "Tablet",
      stok: 1000,
      harga: 500,
    },
    { nama_obat: "Ibuprofen 400mg", satuan: "Tablet", stok: 500, harga: 800 },
    {
      nama_obat: "Asam Mefenamat 500mg",
      satuan: "Tablet",
      stok: 500,
      harga: 700,
    },

    // Antibiotik (Infeksi)
    {
      nama_obat: "Amoxicillin 500mg",
      satuan: "Tablet",
      stok: 800,
      harga: 1000,
    },
    { nama_obat: "Cefadroxil 500mg", satuan: "Kapsul", stok: 400, harga: 1500 },
    {
      nama_obat: "Azithromycin 500mg",
      satuan: "Tablet",
      stok: 300,
      harga: 2000,
    },

    // Saluran Cerna / Lambung (Dispepsia/Maag)
    {
      nama_obat: "Antasida Doen",
      satuan: "Tablet Kunyah",
      stok: 1000,
      harga: 300,
    },
    { nama_obat: "Omeprazole 20mg", satuan: "Kapsul", stok: 600, harga: 1200 },
    {
      nama_obat: "Lansoprazole 30mg",
      satuan: "Kapsul",
      stok: 500,
      harga: 1500,
    },
    { nama_obat: "Ondansetron 4mg", satuan: "Tablet", stok: 300, harga: 2500 },

    // Anti Alergi & Asma
    { nama_obat: "Cetirizine 10mg", satuan: "Tablet", stok: 600, harga: 600 },
    {
      nama_obat: "Chlorpheniramine (CTM) 4mg",
      satuan: "Tablet",
      stok: 1000,
      harga: 200,
    },
    { nama_obat: "Salbutamol 2mg", satuan: "Tablet", stok: 400, harga: 500 },
    {
      nama_obat: "Dexamethasone 0.5mg",
      satuan: "Tablet",
      stok: 500,
      harga: 300,
    },

    // Penyakit Kronis (Hipertensi & Diabetes)
    { nama_obat: "Amlodipine 5mg", satuan: "Tablet", stok: 800, harga: 1000 },
    { nama_obat: "Amlodipine 10mg", satuan: "Tablet", stok: 800, harga: 1500 },
    { nama_obat: "Captopril 25mg", satuan: "Tablet", stok: 500, harga: 800 },
    { nama_obat: "Metformin 500mg", satuan: "Tablet", stok: 1000, harga: 700 },
    { nama_obat: "Glimepiride 2mg", satuan: "Tablet", stok: 500, harga: 1000 },

    // Suplemen & Vitamin
    {
      nama_obat: "Vitamin B Complex",
      satuan: "Tablet",
      stok: 1000,
      harga: 400,
    },
    { nama_obat: "Vitamin C 500mg", satuan: "Tablet", stok: 1000, harga: 500 },
    { nama_obat: "Neurobion Forte", satuan: "Tablet", stok: 500, harga: 2000 },

    // Obat Sirup (Untuk Anak)
    {
      nama_obat: "Paracetamol Sirup 120mg/5ml",
      satuan: "Botol",
      stok: 100,
      harga: 12000,
    },
    {
      nama_obat: "Amoxicillin Sirup Kering",
      satuan: "Botol",
      stok: 50,
      harga: 15000,
    },
    {
      nama_obat: "Obat Batuk Hitam (OBH) Sirup",
      satuan: "Botol",
      stok: 100,
      harga: 10000,
    },
  ];

  await prisma.obat.createMany({
    data: obatList,
  });

  console.log("✅ Data Obat-obatan (Farmasi) berhasil disemai!");

  console.log("\n🎉 SELURUH SEEDING DATABASE SELESAI!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
