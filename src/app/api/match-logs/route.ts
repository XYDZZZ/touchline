import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getTeam } from "@/data/teams";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });

  const logs = await db.personalMatchLog.findMany({
    where: { userId: user.id },
    orderBy: [{ matchDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ logs });
}

const schema = z.object({
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opponentName: z.string().trim().min(1).max(40),
  myTeamId: z.string().min(1),
  myTeamName: z.string().trim().max(60).optional(),
  myTeamLogoUrl: z.string().max(500).optional(),
  opponentTeamId: z.string().min(1),
  opponentTeamName: z.string().trim().max(60).optional(),
  opponentTeamLogoUrl: z.string().max(500).optional(),
  formation: z.string().trim().max(20).optional().nullable(),
  playstyle: z.string().trim().max(500).optional().nullable(),
  result: z.enum(["win", "draw", "loss"]),
  myGoals: z.number().int().min(0).max(99),
  opponentGoals: z.number().int().min(0).max(99),
  evaluation: z.string().trim().max(1000).optional().nullable(),
  gameTitle: z.string().trim().max(30).optional(),
});

function resolveTeam(
  id: string,
  nameOverride?: string,
  logoOverride?: string,
): { id: string; name: string; logo_url: string } | null {
  // Custom teams carry their data in the payload (id starts with "custom_")
  if (id.startsWith("custom_")) {
    if (!nameOverride) return null;
    return { id, name: nameOverride, logo_url: logoOverride ?? "" };
  }
  const team = getTeam(id);
  return team ? { id: team.id, name: team.name, logo_url: team.logo_url } : null;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Lengkapi kolom yang wajib." }, { status: 400 });
  }
  const d = parsed.data;

  // Consistency: the stored result must match the stored score
  const derived = d.myGoals > d.opponentGoals ? "win" : d.myGoals < d.opponentGoals ? "loss" : "draw";
  if (derived !== d.result) {
    return NextResponse.json({ error: "Hasil tidak sesuai skor." }, { status: 400 });
  }

  const myTeam = resolveTeam(d.myTeamId, d.myTeamName, d.myTeamLogoUrl);
  const oppTeam = resolveTeam(d.opponentTeamId, d.opponentTeamName, d.opponentTeamLogoUrl);
  if (!myTeam || !oppTeam) {
    return NextResponse.json({ error: "Tim tidak dikenal." }, { status: 400 });
  }

  const log = await db.personalMatchLog.create({
    data: {
      userId: user.id,
      matchDate: d.matchDate,
      opponentName: d.opponentName,
      myTeamId: myTeam.id,
      myTeamName: myTeam.name,
      myTeamLogoUrl: myTeam.logo_url,
      opponentTeamId: oppTeam.id,
      opponentTeamName: oppTeam.name,
      opponentTeamLogoUrl: oppTeam.logo_url,
      formation: d.formation || null,
      playstyle: d.playstyle || null,
      result: d.result,
      myGoals: d.myGoals,
      opponentGoals: d.opponentGoals,
      evaluation: d.evaluation || null,
      gameTitle: d.gameTitle || "eFootball",
    },
  });

  return NextResponse.json({ log });
}

