import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getAllObat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const obat = await prisma.obat.findMany({
      orderBy: { nama_obat: "asc" },
    });
    res.status(200).json({ data: obat });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data obat." });
  }
};

export const createObat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { nama_obat, satuan, stok, harga } = req.body;
    const newObat = await prisma.obat.create({
      data: {
        nama_obat,
        satuan,
        stok: Number(stok),
        harga: harga ? Number(harga) : null,
      },
    });
    res
      .status(201)
      .json({ message: "Obat berhasil ditambahkan.", data: newObat });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan obat." });
  }
};

export const updateObat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { nama_obat, satuan, stok, harga } = req.body;
    const updatedObat = await prisma.obat.update({
      where: { id },
      data: {
        nama_obat,
        satuan,
        stok: Number(stok),
        harga: harga ? Number(harga) : null,
      },
    });
    res
      .status(200)
      .json({ message: "Data obat berhasil diperbarui.", data: updatedObat });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui obat." });
  }
};

export const deleteObat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.obat.delete({ where: { id } });
    res.status(200).json({ message: "Obat berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus obat." });
  }
};
