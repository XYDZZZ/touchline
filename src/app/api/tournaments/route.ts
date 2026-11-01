import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });

  const tournaments = await db.tournament.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });

  return NextResponse.json({
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      participantCount: t._count.participants,
    })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  format: z.enum(["cup", "league"]),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nama dan format turnamen wajib diisi." }, { status: 400 });
  }

  const t = await db.tournament.create({
    data: { name: parsed.data.name, format: parsed.data.format, createdById: user.id },
  });
  return NextResponse.json({
    tournament: {
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      participantCount: 0,
    },
  });
}
