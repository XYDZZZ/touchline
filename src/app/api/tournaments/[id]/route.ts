import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const t = await db.tournament.findFirst({
    where: { id, createdById: user.id },
    include: {
      participants: { orderBy: { createdAt: "asc" } },
      matches: {
        orderBy: [{ round: "asc" }, { slot: "asc" }],
        include: { goalScorers: true },
      },
    },
  });
  if (!t) return NextResponse.json({ error: "Turnamen tidak ditemukan." }, { status: 404 });

  // Aggregate top scorers by football player name and team
  const scorerMap = new Map<string, { playerName: string; teamName: string; goals: number }>();
  for (const m of t.matches) {
    for (const g of m.goalScorers) {
      const key = `${g.playerName.trim().toLowerCase()}:::${g.teamName.trim().toLowerCase()}`;
      const prev = scorerMap.get(key);
      if (prev) {
        prev.goals += g.goals;
      } else {
        scorerMap.set(key, {
          playerName: g.playerName.trim(),
          teamName: g.teamName.trim(),
          goals: g.goals,
        });
      }
    }
  }
  const topScorers = [...scorerMap.entries()]
    .map(([key, v]) => ({ id: key, ...v }))
    .sort((a, b) => b.goals - a.goals);

  return NextResponse.json({
    tournament: {
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    },
    participants: t.participants.map((p) => ({
      id: p.id,
      tournamentId: p.tournamentId,
      playerName: p.playerName,
      teamId: p.teamId,
      teamName: p.teamName,
      teamLogoUrl: p.teamLogoUrl,
    })),
    matches: t.matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      round: m.round,
      slot: m.slot,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      score1: m.score1,
      score2: m.score2,
      winnerId: m.winnerId,
      status: m.status,
      matchDate: m.matchDate,
      goalScorers: m.goalScorers.map((g) => ({
        participantId: g.participantId,
        playerName: g.playerName,
        teamName: g.teamName,
        goals: g.goals,
      })),
    })),
    topScorers,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const deleted = await db.tournament.deleteMany({ where: { id, createdById: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Turnamen tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
