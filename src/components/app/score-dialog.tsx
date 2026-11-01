"use client";

import { useEffect, useMemo, useState } from "react";
import type { GoalEntry, Participant, TournamentMatch } from "@/lib/types";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X } from "lucide-react";
import { getTeamSquad } from "@/data/squads";
import { cn } from "@/lib/utils";

interface ScoreDialogProps {
  match: TournamentMatch | null;
  participantsById: Record<string, Participant>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowDraw: boolean; // league: true, cup: false
  onSave: (score1: number, score2: number, matchDate?: string, goalScorers?: GoalEntry[]) => Promise<void>;
}

export function ScoreDialog({
  match,
  participantsById,
  open,
  onOpenChange,
  allowDraw,
  onSave,
}: ScoreDialogProps) {
  const [s1, setS1] = useState("0");
  const [s2, setS2] = useState("0");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Goal scorers: list of { participantId, playerName, teamName, goals }
  const [scorers, setScorers] = useState<GoalEntry[]>([]);

  const [prevMatch, setPrevMatch] = useState(match);
  if (match !== prevMatch) {
    setPrevMatch(match);
    setS1(String(match?.score1 ?? 0));
    setS2(String(match?.score2 ?? 0));
    setDate(match?.matchDate ?? new Date().toLocaleDateString("en-CA"));
    setError(null);
    setScorers(match?.goalScorers ?? []);
  }

  if (!match) return null;
  const p1 = match.player1Id ? participantsById[match.player1Id] : null;
  const p2 = match.player2Id ? participantsById[match.player2Id] : null;

  function addScorer(name: string, participant: Participant) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setScorers((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.playerName.toLowerCase() === trimmed.toLowerCase() &&
          s.teamName.toLowerCase() === participant.teamName.toLowerCase()
      );
      if (idx >= 0) {
        return prev.map((s, i) => (i === idx ? { ...s, goals: s.goals + 1 } : s));
      }
      return [
        ...prev,
        {
          participantId: participant.id,
          playerName: trimmed,
          teamName: participant.teamName,
          goals: 1,
        },
      ];
    });
  }

  function removeScorer(name: string, teamName: string) {
    setScorers((prev) =>
      prev
        .map((s) =>
          s.playerName.toLowerCase() === name.toLowerCase() &&
          s.teamName.toLowerCase() === teamName.toLowerCase()
            ? { ...s, goals: s.goals - 1 }
            : s
        )
        .filter((s) => s.goals > 0)
    );
  }

  function clearScorer(name: string, teamName: string) {
    setScorers((prev) =>
      prev.filter(
        (s) =>
          !(
            s.playerName.toLowerCase() === name.toLowerCase() &&
            s.teamName.toLowerCase() === teamName.toLowerCase()
          )
      )
    );
  }

  async function handleSave() {
    const a = Number(s1);
    const b = Number(s2);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      return setError("Masukkan angka bulat 0 atau lebih.");
    }
    if (!allowDraw && a === b) {
      return setError("Sistem gugur tidak boleh seri — catat skor setelah perpanjangan waktu / penalti.");
    }
    setSaving(true);
    try {
      await onSave(a, b, date, scorers);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const scoreRow = (p: Participant | null, value: string, set: (v: string) => void, label: string) => (
    <div className="flex items-center gap-3">
      {p && <TeamLogo name={p.teamName} logoUrl={p.teamLogoUrl} size={30} />}
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{p?.teamName ?? label}</p>
        <p className="truncate text-xs text-muted-foreground">Pemain: {p?.playerName ?? "—"}</p>
      </div>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="h-11 w-16 text-center text-base font-bold"
        aria-label={`Gol ${label}`}
      />
    </div>
  );

  const num1 = Math.max(0, parseInt(s1, 10) || 0);
  const num2 = Math.max(0, parseInt(s2, 10) || 0);
  const totalExpectedGoals = num1 + num2;
  const totalScorerGoals = scorers.reduce((sum, s) => sum + s.goals, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle>Catat Skor Pertandingan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Score inputs */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5">
            {scoreRow(p1, s1, setS1, p1?.teamName ?? "Tim 1")}
            <div className="mx-4 border-t border-border/60" />
            {scoreRow(p2, s2, setS2, p2?.teamName ?? "Tim 2")}
          </div>

          {/* Match date */}
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="match-date" className="text-xs font-medium text-muted-foreground shrink-0">
              Tanggal Main:
            </label>
            <Input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs max-w-[170px]"
            />
          </div>

          {/* Goal Scorers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pencetak Gol (Pemain Tim)
              </h3>
              {totalScorerGoals > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {totalScorerGoals} dari {totalExpectedGoals} gol dicatat
                </span>
              )}
            </div>

            {p1 && (num1 > 0 || totalExpectedGoals === 0) && (
              <TeamScorersSection
                participant={p1}
                expectedGoals={num1}
                scorers={scorers}
                onAddScorer={addScorer}
                onRemoveScorer={removeScorer}
                onClearScorer={clearScorer}
              />
            )}

            {p2 && (num2 > 0 || totalExpectedGoals === 0) && (
              <TeamScorersSection
                participant={p2}
                expectedGoals={num2}
                scorers={scorers}
                onAddScorer={addScorer}
                onRemoveScorer={removeScorer}
                onClearScorer={clearScorer}
              />
            )}
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Skor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamScorersSection({
  participant,
  expectedGoals,
  scorers,
  onAddScorer,
  onRemoveScorer,
  onClearScorer,
}: {
  participant: Participant;
  expectedGoals: number;
  scorers: GoalEntry[];
  onAddScorer: (name: string, participant: Participant) => void;
  onRemoveScorer: (name: string, teamName: string) => void;
  onClearScorer: (name: string, teamName: string) => void;
}) {
  const [customName, setCustomName] = useState("");
  const squad = useMemo(
    () => getTeamSquad(participant.teamId, participant.teamName),
    [participant.teamId, participant.teamName]
  );

  const teamScorers = scorers.filter(
    (s) => s.teamName.toLowerCase() === participant.teamName.toLowerCase()
  );
  const totalRecorded = teamScorers.reduce((sum, s) => sum + s.goals, 0);

  function handleAddCustom() {
    const trimmed = customName.trim();
    if (!trimmed) return;
    onAddScorer(trimmed, participant);
    setCustomName("");
  }

  return (
    <div className="rounded-xl border border-border/70 bg-accent/20 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamLogo name={participant.teamName} logoUrl={participant.teamLogoUrl} size={20} />
          <span className="text-xs font-semibold">{participant.teamName}</span>
        </div>
        <span
          className={cn(
            "text-[11px] font-medium tabular-nums",
            totalRecorded === expectedGoals && expectedGoals > 0
              ? "text-primary font-semibold"
              : totalRecorded > expectedGoals
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {totalRecorded} / {expectedGoals} gol tercatat
        </span>
      </div>

      {/* Quick suggest chips */}
      {squad.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Pilih pemain {participant.teamName}:</p>
          <div className="flex flex-wrap gap-1">
            {squad.map((playerName) => {
              const already = teamScorers.find(
                (s) => s.playerName.toLowerCase() === playerName.toLowerCase()
              );
              return (
                <button
                  key={playerName}
                  type="button"
                  onClick={() => onAddScorer(playerName, participant)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    already
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/70 bg-card hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  <span>{playerName}</span>
                  {already ? (
                    <span className="ml-0.5 rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {already.goals}
                    </span>
                  ) : (
                    <Plus className="h-2.5 w-2.5 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom player text input */}
      <div className="flex gap-1.5 pt-0.5">
        <Input
          placeholder={`Ketik nama pencetak gol ${participant.teamName}...`}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
          className="h-8 text-xs bg-card"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs shrink-0"
          onClick={handleAddCustom}
          disabled={!customName.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Recorded list for this team */}
      {teamScorers.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          {teamScorers.map((s) => (
            <div
              key={`${s.playerName}-${s.teamName}`}
              className="flex items-center justify-between rounded-lg bg-card px-2.5 py-1 text-xs border border-border/50"
            >
              <span className="font-medium truncate max-w-[180px]">{s.playerName}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRemoveScorer(s.playerName, s.teamName)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-border/70 hover:bg-destructive/10 transition-colors"
                  aria-label="Kurangi gol"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="w-5 text-center font-bold tabular-nums text-primary text-xs">
                  {s.goals}
                </span>
                <button
                  type="button"
                  onClick={() => onAddScorer(s.playerName, participant)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-border/70 hover:bg-primary/10 transition-colors"
                  aria-label="Tambah gol"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onClearScorer(s.playerName, s.teamName)}
                  className="ml-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Hapus"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
