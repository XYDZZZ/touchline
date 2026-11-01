import type { Participant } from "./types";

export interface PlannedMatch {
  round: number;
  slot: number;
  player1Id: string | null;
  player2Id: string | null;
  status: "pending" | "ready" | "bye";
  winnerId: string | null;
}

export const nextPow2 = (n: number): number => {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
};

/** Standard seeding order, e.g. size 8 → [1,8,4,5,2,7,3,6] */
export function seedingOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const total = order.length * 2 + 1;
    const next: number[] = [];
    for (const s of order) next.push(s, total - s);
    order = next;
  }
  return order;
}

/**
 * Builds a full single-elimination bracket.
 * Participants array order = seeding (1, 2, 3…).
 * Bracket is padded to the next power of two; BYE matches auto-advance.
 * Winner of (round, slot) always flows to (round+1, slot/2).
 */
export function buildCupBracket(participants: Participant[]): PlannedMatch[] {
  if (participants.length < 2) return [];
  const size = nextPow2(participants.length);
  const totalRounds = Math.log2(size);
  const order = seedingOrder(size);
  const seedToId = (seed: number) =>
    seed <= participants.length ? participants[seed - 1].id : null;

  const matches: PlannedMatch[] = [];

  // Round 1
  for (let slot = 0; slot < size / 2; slot++) {
    const p1 = seedToId(order[slot * 2]);
    const p2 = seedToId(order[slot * 2 + 1]);
    matches.push(
      p1 && p2
        ? { round: 1, slot, player1Id: p1, player2Id: p2, status: "ready", winnerId: null }
        : { round: 1, slot, player1Id: p1, player2Id: p2, status: "bye", winnerId: p1 ?? p2 }
    );
  }

  // Later rounds — winners of BYE matches flow up immediately
  for (let round = 2; round <= totalRounds; round++) {
    const prev = matches.filter((m) => m.round === round - 1);
    const count = size / 2 ** round;
    for (let slot = 0; slot < count; slot++) {
      const p1 = prev.find((m) => m.slot === slot * 2)?.winnerId ?? null;
      const p2 = prev.find((m) => m.slot === slot * 2 + 1)?.winnerId ?? null;
      matches.push({
        round,
        slot,
        player1Id: p1,
        player2Id: p2,
        status: p1 && p2 ? "ready" : "pending",
        winnerId: null,
      });
    }
  }
  return matches;
}

export function roundLabel(round: number, totalRounds: number, size: number): string {
  if (round === totalRounds) return "Final";
  if (totalRounds - round === 1) return "Semifinal";
  if (totalRounds - round === 2) return "Perempat Final";
  return `${size / 2 ** (round - 1)} Besar`;
}
