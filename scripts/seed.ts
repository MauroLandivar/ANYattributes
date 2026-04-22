import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createCipheriv, createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

function encryptKey(text: string, rawKey: string): string {
  // SHA-256 always yields exactly 32 bytes regardless of input format/length
  const key = createHash("sha256").update(rawKey).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

async function main() {
  const email = "mauro@landivarparada.com";
  const password = "ANYattributes2026";
  const empresa = "ANYMARKET";
  const provider = "claude";

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!anthropicKey) {
    console.error("❌  ANTHROPIC_API_KEY no configurado en .env.local");
    process.exit(1);
  }
  if (!encryptionKey) {
    console.error("❌  ENCRYPTION_KEY no configurado en .env.local");
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅  Usuario admin ya existe: ${email}`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const encryptedKey = encryptKey(anthropicKey, encryptionKey);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        empresa,
      },
    });
    await tx.apiKey.create({
      data: {
        userId: user.id,
        provider,
        encryptedKey,
      },
    });
  });

  console.log(`\n✅  Usuario admin creado exitosamente:`);
  console.log(`    Email:    ${email}`);
  console.log(`    Empresa:  ${empresa}`);
  console.log(`    Provider: ${provider}`);
  console.log(`    API Key:  sk-ant-...${anthropicKey.slice(-4)} (encriptada con AES-256-GCM)\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
