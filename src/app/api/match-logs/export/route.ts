import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/** AI-ready export: the signed-in user's full match history as a clean
 *  JSON array — feed it straight into an LLM prompt as coaching data. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Kamu belum masuk." }, { status: 401 });

  const logs = await db.personalMatchLog.findMany({
    where: { userId: user.id },
    orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
    select: {
      matchDate: true,
      gameTitle: true,
      myTeamName: true,
      opponentName: true,
      opponentTeamName: true,
      formation: true,
      playstyle: true,
      result: true,
      myGoals: true,
      opponentGoals: true,
      evaluation: true,
    },
  });

  const payload = {
    player: user.displayName,
    game: "eFootball / FIFA style football eSports",
    matchesLogged: logs.length,
    record: {
      win: logs.filter((l) => l.result === "win").length,
      draw: logs.filter((l) => l.result === "draw").length,
      loss: logs.filter((l) => l.result === "loss").length,
    },
    matches: logs,
    exportedAt: new Date().toISOString(),
    intendedUse: "Personalized AI coaching analysis",
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="match-history-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
