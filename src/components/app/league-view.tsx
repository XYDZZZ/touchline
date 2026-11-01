"use client";

import { useState } from "react";
import type { GoalEntry, Participant, TournamentMatch } from "@/lib/types";
import { TeamLogo } from "@/components/team-logo";
import { ScoreDialog } from "@/components/app/score-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d ?? ""} ${MONTHS[(m ?? 1) - 1] ?? ""}`;
};

interface Props {
  matches: TournamentMatch[];
  participantsById: Record<string, Participant>;
  onSaveScore: (match: TournamentMatch, score1: number, score2: number, matchDate?: string, goalScorers?: GoalEntry[]) => Promise<void>;
}

/** Round-robin schedule grouped by matchday — click a fixture to record its score. */
export function LeagueView({ matches, participantsById, onSaveScore }: Props) {
  const [active, setActive] = useState<TournamentMatch | null>(null);

  const byRound = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    const list = byRound.get(m.round) ?? [];
    list.push(m);
    byRound.set(m.round, list);
  }
  const matchdays = [...byRound.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-5">
      {matchdays.map(([round, fixtures]) => (
        <section key={round}>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Pekan {round}
          </h3>
          <Card className="border-border/70 py-1 shadow-none">
            <CardContent className="px-1">
              {[...fixtures]
                .sort((a, b) => a.slot - b.slot)
                .map((m, i, arr) => (
                  <FixtureRow
                    key={m.id}
                    match={m}
                    participantsById={participantsById}
                    first={i === 0}
                    onClick={() => setActive(m)}
                  />
                ))}
            </CardContent>
          </Card>
        </section>
      ))}

      <ScoreDialog
        match={active}
        participantsById={participantsById}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        allowDraw={true}
        onSave={(s1, s2, date, goalScorers) => onSaveScore(active!, s1, s2, date, goalScorers)}
      />
    </div>
  );
}

function FixtureRow({
  match,
  participantsById,
  first,
  onClick,
}: {
  match: TournamentMatch;
  participantsById: Record<string, Participant>;
  first: boolean;
  onClick: () => void;
}) {
  const p1 = match.player1Id ? participantsById[match.player1Id] : null;
  const p2 = match.player2Id ? participantsById[match.player2Id] : null;
  const editable = match.status === "ready" || match.status === "completed";
  const done = match.status === "completed";
  const w1 = !!match.winnerId && match.winnerId === match.player1Id;
  const w2 = !!match.winnerId && match.winnerId === match.player2Id;

  return (
    <button
      type="button"
      onClick={editable ? onClick : undefined}
      title={editable ? "Klik untuk isi skor" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        !first && "border-t border-border/60",
        editable ? "cursor-pointer hover:bg-accent/60" : "opacity-90"
      )}
    >
      <Side participant={p1} isWinner={w1} muted={done && !w1} align="right" />
      <div className="flex min-w-16 flex-col items-center justify-center shrink-0">
        <span
          className={cn(
            "text-center text-sm font-semibold tabular-nums",
            done ? "text-foreground" : "text-muted-foreground/60"
          )}
        >
          {done ? `${match.score1} – ${match.score2}` : "vs"}
        </span>
        {match.matchDate && (
          <span className="text-[10px] text-muted-foreground/75 tracking-tight">
            {fmtDate(match.matchDate)}
          </span>
        )}
      </div>
      <Side participant={p2} isWinner={w2} muted={done && !w2} align="left" />
    </button>
  );
}

function Side({
  participant,
  isWinner,
  muted,
  align,
}: {
  participant: Participant | null;
  isWinner: boolean;
  muted: boolean;
  align: "left" | "right";
}) {
  if (!participant)
    return <div className="flex-1 text-xs italic text-muted-foreground/70">—</div>;
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5",
        align === "right" && "flex-row-reverse text-right",
        muted && "opacity-55"
      )}
    >
      <TeamLogo name={participant.teamName} logoUrl={participant.teamLogoUrl} size={22} />
      <div className="min-w-0 leading-tight">
        <p className={cn("truncate text-[13px]", isWinner ? "font-semibold" : "font-medium")}>
          {participant.playerName}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{participant.teamName}</p>
      </div>
    </div>
  );
}
