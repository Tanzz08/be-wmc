-- CreateTable
CREATE TABLE "Antrean" (
    "id_antrean" SERIAL NOT NULL,
    "id_rm" TEXT NOT NULL,
    "id_dokter" INTEGER NOT NULL,
    "poliklinik" TEXT NOT NULL,
    "cara_bayar" TEXT NOT NULL,
    "keluhan_awal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Menunggu',
    "waktu_daftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Antrean_pkey" PRIMARY KEY ("id_antrean")
);

-- AddForeignKey
ALTER TABLE "Antrean" ADD CONSTRAINT "Antrean_id_rm_fkey" FOREIGN KEY ("id_rm") REFERENCES "Pasien"("id_rm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antrean" ADD CONSTRAINT "Antrean_id_dokter_fkey" FOREIGN KEY ("id_dokter") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
