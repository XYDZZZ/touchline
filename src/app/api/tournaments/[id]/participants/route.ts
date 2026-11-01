import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getTeam } from "@/data/teams";

const schema = z.object({
  playerName: z.string().trim().min(1).max(40),
  teamId: z.string().min(1),
  teamName: z.string().trim().max(60).optional(),
  teamLogoUrl: z.string().max(500).optional(),
});

function resolveTeam(
  id: string,
  nameOverride?: string,
  logoOverride?: string,
): { id: string; name: string; logo_url: string } | null {
  if (id.startsWith("custom_")) {
    if (!nameOverride) return null;
    return { id, name: nameOverride, logo_url: logoOverride ?? "" };
  }
  const team = getTeam(id);
  return team ? { id: team.id, name: team.name, logo_url: team.logo_url } : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });
  const { id } = await params;

  const tournament = await db.tournament.findFirst({ where: { id, createdById: user.id } });
  if (!tournament) return NextResponse.json({ error: "Turnamen tidak ditemukan." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nama pemain dan tim wajib diisi." }, { status: 400 });
  }

  // Resolves preset teams or custom teams with client-provided name/logo
  const team = resolveTeam(parsed.data.teamId, parsed.data.teamName, parsed.data.teamLogoUrl);
  if (!team) return NextResponse.json({ error: "Tim tidak dikenal." }, { status: 400 });

  const duplicate = await db.participant.findFirst({
    where: { tournamentId: id, playerName: parsed.data.playerName },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Nama pemain sudah ada di turnamen ini." }, { status: 409 });
  }

  const p = await db.participant.create({
    data: {
      tournamentId: id,
      playerName: parsed.data.playerName,
      teamId: team.id,
      teamName: team.name,
      teamLogoUrl: team.logo_url,
    },
  });

  return NextResponse.json({
    participant: {
      id: p.id,
      tournamentId: p.tournamentId,
      playerName: p.playerName,
      teamId: p.teamId,
      teamName: p.teamName,
      teamLogoUrl: p.teamLogoUrl,
    },
  });
}
