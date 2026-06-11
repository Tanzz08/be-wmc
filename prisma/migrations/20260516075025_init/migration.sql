-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'RESEPSIONIS', 'DOKTER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RESEPSIONIS',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasien" (
    "id_rm" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "jenis_kelamin" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "no_telepon" TEXT NOT NULL,
    "waktu_daftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pasien_pkey" PRIMARY KEY ("id_rm")
);

-- CreateTable
CREATE TABLE "RekamMedis" (
    "id_pemeriksaan" SERIAL NOT NULL,
    "id_rm" TEXT NOT NULL,
    "id_dokter" INTEGER NOT NULL,
    "waktu_periksa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keluhan_utama" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,

    CONSTRAINT "RekamMedis_pkey" PRIMARY KEY ("id_pemeriksaan")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Pasien_id_rm_key" ON "Pasien"("id_rm");

-- AddForeignKey
ALTER TABLE "RekamMedis" ADD CONSTRAINT "RekamMedis_id_rm_fkey" FOREIGN KEY ("id_rm") REFERENCES "Pasien"("id_rm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekamMedis" ADD CONSTRAINT "RekamMedis_id_dokter_fkey" FOREIGN KEY ("id_dokter") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
