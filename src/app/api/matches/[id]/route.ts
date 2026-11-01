import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const goalScorerSchema = z.object({
  participantId: z.string(),
  playerName: z.string(),
  teamName: z.string(),
  goals: z.number().int().min(1).max(99),
});

const schema = z.object({
  score1: z.number().int().min(0).max(99),
  score2: z.number().int().min(0).max(99),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  goalScorers: z.array(goalScorerSchema).optional(),
});

/** Saves a match result. In cup tournaments the winner automatically
 *  advances to (round+1, slot/2) — that slot's player is replaced,
 *  matching the Supabase version of this app. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const match = await db.tournamentMatch.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!match || match.tournament.createdById !== user.id) {
    return NextResponse.json({ error: "Pertandingan tidak ditemukan." }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Skor harus angka bulat (0–99)." }, { status: 400 });
  }
  const { score1, score2, goalScorers } = parsed.data;
  const matchDate = parsed.data.matchDate ?? new Date().toLocaleDateString("en-CA");

  if (match.tournament.format === "cup" && score1 === score2) {
    return NextResponse.json(
      { error: "Sistem gugur butuh pemenang — catat skor setelah perpanjangan waktu / penalti." },
      { status: 400 }
    );
  }

  const winnerId =
    score1 === score2 ? null : score1 > score2 ? match.player1Id : match.player2Id;

  await db.$transaction(async (tx) => {
    await tx.tournamentMatch.update({
      where: { id },
      data: { score1, score2, winnerId, status: "completed", matchDate },
    });

    // Save goal scorers: delete old ones, insert new
    if (goalScorers !== undefined) {
      await tx.goalScorer.deleteMany({ where: { matchId: id } });
      if (goalScorers.length > 0) {
        await tx.goalScorer.createMany({
          data: goalScorers.map((g) => ({
            matchId: id,
            tournamentId: match.tournamentId,
            participantId: g.participantId,
            playerName: g.playerName,
            teamName: g.teamName,
            goals: g.goals,
          })),
        });
      }
    }

    // Cup: advance the winner into the next round's match
    if (match.tournament.format === "cup" && winnerId) {
      const next = await tx.tournamentMatch.findFirst({
        where: { tournamentId: match.tournamentId, round: match.round + 1, slot: match.slot >> 1 },
      });
      if (next) {
        const patch = match.slot % 2 === 0 ? { player1Id: winnerId } : { player2Id: winnerId };
        const p1 = "player1Id" in patch ? winnerId : next.player1Id;
        const p2 = "player2Id" in patch ? winnerId : next.player2Id;
        await tx.tournamentMatch.update({
          where: { id: next.id },
          data: { ...patch, status: p1 && p2 ? "ready" : "pending" },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });

}
