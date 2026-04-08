import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

async function validateClaudeKey(apiKey: string): Promise<"ok" | "invalid" | "no_balance"> {
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    });
    return "ok";
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) return "invalid";
    if (status === 429) return "no_balance";
    // Other errors (500, etc.) — treat as ok to avoid blocking registration
    return "ok";
  }
}

async function validateGPTKey(apiKey: string): Promise<"ok" | "invalid" | "no_balance"> {
  try {
    const client = new OpenAI({ apiKey });
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    });
    return "ok";
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) return "invalid";
    if (status === 429) return "no_balance";
    return "ok";
  }
}

async function appendToHistorico(entry: {
  email: string;
  empresa: string;
  provider: string;
  createdAt: string;
}) {
  const filePath = path.join(process.cwd(), "historico-de-registros", "registros.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const list = JSON.parse(raw) as typeof entry[];
    list.push(entry);
    await fs.writeFile(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // If file doesn't exist or is corrupted, start fresh
    await fs.writeFile(filePath, JSON.stringify([entry], null, 2), "utf-8");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, empresa, apiKey, provider } = await req.json();

    // Basic validation
    if (!email || !password || !empresa || !apiKey || !provider) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
    }
    if (!["claude", "gpt"].includes(provider)) {
      return NextResponse.json({ error: "Proveedor inválido." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    // Validate API key
    const keyStatus = provider === "claude"
      ? await validateClaudeKey(apiKey)
      : await validateGPTKey(apiKey);

    if (keyStatus === "invalid") {
      return NextResponse.json({ error: "invalid_api_key" }, { status: 422 });
    }
    if (keyStatus === "no_balance") {
      return NextResponse.json({ error: "no_balance" }, { status: 422 });
    }

    // Hash password + encrypt API key
    const hashedPassword = await bcrypt.hash(password, 12);
    const encryptedKey = encrypt(apiKey);

    // Create user + API key in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          empresa,
        },
      });
      await tx.apiKey.create({
        data: {
          userId: newUser.id,
          provider,
          encryptedKey,
        },
      });
      return newUser;
    });

    // Log to historico
    await appendToHistorico({
      email: user.email,
      empresa: user.empresa,
      provider,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, email: user.email, empresa: user.empresa });
  } catch (err: unknown) {
    console.error("[register] Error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
