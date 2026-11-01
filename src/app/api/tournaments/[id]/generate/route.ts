import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildCupBracket } from "@/lib/bracket";
import { generateFixtures } from "@/lib/league";

const schema = z.object({
  /** Optional custom ordering of participant IDs (for cup brackets).
   *  If omitted, participants are ordered by createdAt (original seeding). */
  participantOrder: z.array(z.string()).optional(),
  /** If true, randomly shuffles participants before generating schedule/bracket. */
  shuffle: z.boolean().optional(),
});

/** (Re)generates the full match schedule for a tournament.
 *  Cup → single-elimination bracket with BYEs.
 *  League → double round-robin fixtures.
 *  Existing matches and scores are deleted first. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const customOrder: string[] | undefined = parsed.success ? parsed.data.participantOrder : undefined;
  const shouldShuffle: boolean = parsed.success ? Boolean(parsed.data.shuffle) : false;

  const tournament = await db.tournament.findFirst({
    where: { id, createdById: user.id },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!tournament) return NextResponse.json({ error: "Turnamen tidak ditemukan." }, { status: 404 });
  if (tournament.participants.length < 2) {
    return NextResponse.json({ error: "Tambahkan minimal 2 pemain dulu." }, { status: 400 });
  }

  // Determine participant ordering
  let orderedParticipants = [...tournament.participants];
  if (shouldShuffle) {
    // Random Fisher-Yates shuffle
    for (let i = orderedParticipants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedParticipants[i], orderedParticipants[j]] = [orderedParticipants[j], orderedParticipants[i]];
    }
  } else if (customOrder && customOrder.length === tournament.participants.length) {
    const byId = Object.fromEntries(tournament.participants.map((p) => [p.id, p]));
    const reordered = customOrder.map((pid) => byId[pid]).filter(Boolean);
    if (reordered.length === tournament.participants.length) {
      orderedParticipants = reordered;
    }
  }

  await db.tournamentMatch.deleteMany({ where: { tournamentId: id } });

  if (tournament.format === "cup") {
    const planned = buildCupBracket(
      orderedParticipants.map((p) => ({
        id: p.id,
        tournamentId: p.tournamentId,
        playerName: p.playerName,
        teamId: p.teamId,
        teamName: p.teamName,
        teamLogoUrl: p.teamLogoUrl,
      }))
    );
    await db.tournamentMatch.createMany({
      data: planned.map((m) => ({
        tournamentId: id,
        round: m.round,
        slot: m.slot,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        status: m.status,
        winnerId: m.winnerId,
      })),
    });
  } else {
    const matchdays = generateFixtures(orderedParticipants.map((p) => p.id));
    await db.tournamentMatch.createMany({
      data: matchdays.flatMap((fixtures, i) =>
        fixtures.map(([a, b], slot) => ({
          tournamentId: id,
          round: i + 1,
          slot,
          player1Id: a,
          player2Id: b,
          status: "ready",
        }))
      ),
    });
  }

  await db.tournament.update({ where: { id }, data: { status: "active" } });
  return NextResponse.json({ ok: true });
}
