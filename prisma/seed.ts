import bcrypt from "bcrypt";
// KITA IMPORT PRISMA DARI UTILS AGAR TIDAK BIKIN KONEKSI DUA KALI
import prisma from "../src/utils/prisma";

async function main() {
  console.log("⏳ Memulai seeding database...");

  // Hash password 'rahasia123'
  const hashedPassword = await bcrypt.hash("rahasia123", 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    // Hash password default (misal: "admin123")
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        username: "admin",
        password_hash: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });
    console.log("✅ Akun Super Admin berhasil dibuat!");
    console.log("Username : admin");
    console.log("Password : admin123");
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

  console.log("✅ Seeding database berhasil! Akun default telah dibuat.");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
