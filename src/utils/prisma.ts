import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

// 1. Membuat Pool Koneksi ke PostgreSQL
const pool = new Pool({ connectionString });

// 2. Membungkus Pool dengan Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Memasukkan Adapter ke Prisma Client (Ini yang diminta oleh error tadi!)
const prisma = new PrismaClient({ adapter });

export default prisma;
