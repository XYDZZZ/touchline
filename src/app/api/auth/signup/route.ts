import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email, kata sandi (min 6 karakter) atau nama tidak valid." }, { status: 400 });
  }
  const { email, password, displayName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const user = await db.user.create({
    data: { email, displayName, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);

  return NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
}
