"use client";

import { useState } from "react";
import type { GoalEntry, Participant, TournamentMatch } from "@/lib/types";
import { TeamLogo } from "@/components/team-logo";
import { ScoreDialog } from "@/components/app/score-dialog";
import { roundLabel } from "@/lib/bracket";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d ?? ""} ${MONTHS[(m ?? 1) - 1] ?? ""}`;
};

interface Props {
  matches: TournamentMatch[];
  participantsById: Record<string, Participant>;
  totalRounds: number;
  size: number; // bracket size (power of two)
  onSaveScore: (match: TournamentMatch, score1: number, score2: number, matchDate?: string, goalScorers?: GoalEntry[]) => Promise<void>;
}

/** Visual knockout bracket: rounds as columns, click a tie to record its score. */
export function BracketView({ matches, participantsById, totalRounds, size, onSaveScore }: Props) {
  const [active, setActive] = useState<TournamentMatch | null>(null);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div>
      <div className="scroll-slim flex gap-4 sm:gap-6 overflow-x-auto pb-3">
        {rounds.map((r) => (
          <section key={r} className="flex w-52 shrink-0 flex-col sm:w-56">
            <h3 className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {roundLabel(r, totalRounds, size)}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {matches
                .filter((m) => m.round === r)
                .sort((a, b) => a.slot - b.slot)
                .map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    participantsById={participantsById}
                    onClick={() => (m.status === "ready" || m.status === "completed") && setActive(m)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>

      <ScoreDialog
        match={active}
        participantsById={participantsById}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        allowDraw={false}
        onSave={(s1, s2, date, goalScorers) => onSaveScore(active!, s1, s2, date, goalScorers)}
      />
    </div>
  );
}

function MatchCard({
  match,
  participantsById,
  onClick,
}: {
  match: TournamentMatch;
  participantsById: Record<string, Participant>;
  onClick: () => void;
}) {
  const p1 = match.player1Id ? participantsById[match.player1Id] : null;
  const p2 = match.player2Id ? participantsById[match.player2Id] : null;
  const editable = match.status === "ready" || match.status === "completed";
  const isBye = match.status === "bye";

  return (
    <div
      role={editable ? "button" : undefined}
      onClick={editable ? onClick : undefined}
      title={editable ? "Klik untuk isi skor" : isBye ? "Lolos otomatis (BYE)" : undefined}
      className={cn(
        "rounded-xl border border-border/70 bg-card transition-colors",
        editable && "cursor-pointer hover:border-primary/50"
      )}
    >
      <Side
        participant={p1}
        score={match.score1}
        isWinner={!!match.winnerId && match.winnerId === match.player1Id}
        muted={match.status === "completed" && !!match.winnerId && match.winnerId !== match.player1Id}
        isBye={isBye}
        isByeTarget={isBye && !p1}
      />
      <div className="mx-3 border-t border-border/60" />
      <Side
        participant={p2}
        score={match.score2}
        isWinner={!!match.winnerId && match.winnerId === match.player2Id}
        muted={match.status === "completed" && !!match.winnerId && match.winnerId !== match.player2Id}
        isBye={isBye}
        isByeTarget={isBye && !p2}
      />
      {match.matchDate && match.status === "completed" && (
        <div className="border-t border-border/40 px-3 py-1 text-right">
          <span className="text-[9px] text-muted-foreground/75 tracking-tight">
            {fmtDate(match.matchDate)}
          </span>
        </div>
      )}
    </div>
  );
}

function Side({
  participant,
  score,
  isWinner,
  muted,
  isBye,
  isByeTarget,
}: {
  participant: Participant | null;
  score: number | null;
  isWinner: boolean;
  muted: boolean;
  isBye?: boolean;
  isByeTarget?: boolean;
}) {
  if (!participant) {
    return (
      <div className="flex h-11 items-center px-3 text-xs italic text-muted-foreground/50">
        {isByeTarget ? "— (BYE)" : "—"}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-xl px-3 transition-colors",
        isWinner && !isBye && "bg-primary/5",
        muted && "opacity-55"
      )}
    >
      <TeamLogo name={participant.teamName} logoUrl={participant.teamLogoUrl} size={22} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className={cn("truncate text-[13px]", isWinner && !isBye ? "font-semibold" : "font-medium")}>
          {participant.playerName}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{participant.teamName}</p>
      </div>
      {isBye ? (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          BYE
        </span>
      ) : (
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isWinner ? "text-primary" : "text-muted-foreground"
          )}
        >
          {score ?? "–"}
        </span>
      )}
    </div>
  );
}
