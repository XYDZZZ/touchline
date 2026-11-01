import type { Participant, TournamentMatch } from "./types";

/** Circle-method round-robin. Returns matchdays, each an array of [p1Id, p2Id]. */
export function generateFixtures(participantIds: string[], doubleRoundRobin = true): [string, string][][] {
  const ids = [...participantIds];
  if (ids.length < 2) return [];
  if (ids.length % 2 === 1) ids.push("BYE");

  const n = ids.length;
  const rotation = [...ids];
  const matchdays: [string, string][][] = [];

  for (let round = 0; round < n - 1; round++) {
    const fixtures: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        fixtures.push(round % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    matchdays.push(fixtures);

    // rotate everyone except the first entry
    const [fixed, ...rest] = rotation;
    rest.unshift(rest.pop()!);
    rotation.length = 0;
    rotation.push(fixed, ...rest);
  }

  if (doubleRoundRobin) {
    matchdays.push(...matchdays.map((md) => md.map(([a, b]) => [b, a] as [string, string])));
  }
  return matchdays;
}

export interface StandingRow {
  participant: Participant;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export function computeStandings(participants: Participant[], matches: TournamentMatch[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    participants.map((p) => [
      p.id,
      { participant: p, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
    ])
  );

  for (const m of matches) {
    if (m.status !== "completed" || !m.player1Id || !m.player2Id) continue;
    const home = rows.get(m.player1Id);
    const away = rows.get(m.player2Id);
    if (!home || !away) continue;

    const s1 = m.score1 ?? 0;
    const s2 = m.score2 ?? 0;
    home.played++;
    away.played++;
    home.goalsFor += s1;
    home.goalsAgainst += s2;
    away.goalsFor += s2;
    away.goalsAgainst += s1;

    if (s1 > s2) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (s1 < s2) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.participant.playerName.localeCompare(b.participant.playerName)
    );
}
