-- AlterTable
ALTER TABLE "Pasien" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RekamMedis" ADD COLUMN     "berat_badan" TEXT,
ADD COLUMN     "suhu" TEXT,
ADD COLUMN     "tensi_darah" TEXT,
ADD COLUMN     "tindakan_resep" TEXT NOT NULL DEFAULT '';
