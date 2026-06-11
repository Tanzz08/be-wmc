import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Secret Key harus 32 karakter (256 bit). Simpan di file .env!
const SECRET_KEY =
  process.env.AES_SECRET_KEY || "KunciRahasiaKlinikWMC2026!@#$123";
const ALGORITHM = "aes-256-cbc";

/**
 * Fungsi Enkripsi AES-256-CBC
 * @param text Plaintext (teks asli)
 * @returns Ciphertext dengan format "iv:encryptedData"
 */
export const encryptAES = (text: string): string => {
  if (!text) return text;

  // Membuat IV (Initialization Vector) acak sepanjang 16 byte
  const iv = crypto.randomBytes(16);

  // Membuat instance cipher
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

  // Proses enkripsi
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Gabungkan IV dan Ciphertext agar bisa didekripsi nanti
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * Fungsi Dekripsi AES-256-CBC
 * @param encryptedText Ciphertext format "iv:encryptedData"
 * @returns Plaintext (teks asli)
 */
export const decryptAES = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;

  // Memisahkan IV dan Ciphertext dari string yang tersimpan di database
  const textParts = encryptedText.split(":");
  const iv = Buffer.from(textParts.shift() as string, "hex");
  const encryptedData = Buffer.from(textParts.join(":"), "hex");

  // Membuat instance decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    iv,
  );

  // Proses dekripsi
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
