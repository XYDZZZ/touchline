import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const participant = await db.participant.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!participant || participant.tournament.createdById !== user.id) {
    return NextResponse.json({ error: "Pemain tidak ditemukan." }, { status: 404 });
  }

  await db.participant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
