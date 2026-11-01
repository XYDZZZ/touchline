"use client";

import { useMemo, useState } from "react";
import { TeamCombobox } from "@/components/team-combobox";
import type { MatchResult, PersonalMatchLog, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const FORMATIONS = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "3-5-2",
  "3-4-3",
  "4-1-4-1",
  "5-3-2",
  "4-2-2-2",
  "4-3-2-1",
  "3-4-2-1",
];

const resultOf = (a: number, b: number): MatchResult =>
  a > b ? "win" : a < b ? "loss" : "draw";

const RESULT_BADGE: Record<MatchResult, string> = {
  win: "bg-emerald-500/15 text-emerald-700",
  draw: "bg-amber-500/15 text-amber-700",
  loss: "bg-rose-500/15 text-rose-700",
};
const RESULT_TEXT: Record<MatchResult, string> = { win: "Menang", draw: "Imbang", loss: "Kalah" };

interface Props {
  initial?: PersonalMatchLog | null;
  onSaved: () => void | Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void | Promise<void>;
}

const teamFromLog = (log: PersonalMatchLog, mine: boolean): Team =>
  mine
    ? { id: log.myTeamId, name: log.myTeamName, logo_url: log.myTeamLogoUrl }
    : { id: log.opponentTeamId, name: log.opponentTeamName, logo_url: log.opponentTeamLogoUrl };

/** Compact match & strategy logger — result is derived from the score automatically. */
export function MatchLogForm({ initial, onSaved, onCancel, onDelete }: Props) {
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const [matchDate, setMatchDate] = useState(initial?.matchDate ?? today);
  const [opponentName, setOpponentName] = useState(initial?.opponentName ?? "");
  const [myTeam, setMyTeam] = useState<Team | null>(initial ? teamFromLog(initial, true) : null);
  const [oppTeam, setOppTeam] = useState<Team | null>(initial ? teamFromLog(initial, false) : null);
  const [formation, setFormation] = useState(initial?.formation ?? "");
  const [playstyle, setPlaystyle] = useState(initial?.playstyle ?? "");
  const [myGoals, setMyGoals] = useState(initial ? String(initial.myGoals) : "");
  const [oppGoals, setOppGoals] = useState(initial ? String(initial.opponentGoals) : "");
  const [evaluation, setEvaluation] = useState(initial?.evaluation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const a = Number(myGoals);
  const b = Number(oppGoals);
  const result = myGoals === "" || oppGoals === "" ? null : resultOf(a, b);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!opponentName.trim()) return setError("Siapa lawanmu?");
    if (!myTeam || !oppTeam) return setError("Pilih kedua tim.");
    if (!result) return setError("Isi skor akhirnya.");

    setBusy(true);
    setError(null);
    const payload = {
      matchDate,
      opponentName: opponentName.trim(),
      myTeamId: myTeam.id,
      myTeamName: myTeam.name,
      myTeamLogoUrl: myTeam.logo_url,
      opponentTeamId: oppTeam.id,
      opponentTeamName: oppTeam.name,
      opponentTeamLogoUrl: oppTeam.logo_url,
      formation: formation || null,
      playstyle: playstyle.trim() || null,
      result,
      myGoals: a,
      opponentGoals: b,
      evaluation: evaluation.trim() || null,
    };

    const res = await fetch(initial ? `/api/match-logs/${initial.id}` : "/api/match-logs", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "Gagal menyimpan laga. Coba lagi.");
    }
    await onSaved();
  }

  const field = "grid gap-1.5";
  const labelCls = "text-xs text-muted-foreground";

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className={field}>
        <Label className={labelCls}>Timku</Label>
        <TeamCombobox value={myTeam} onChange={setMyTeam} />
      </div>
      <div className={field}>
        <Label className={labelCls}>Tim lawan</Label>
        <TeamCombobox value={oppTeam} onChange={setOppTeam} />
      </div>

      <div className={field}>
        <Label htmlFor="opponent" className={labelCls}>
          Nama lawan
        </Label>
        <Input
          id="opponent"
          value={opponentName}
          onChange={(e) => setOpponentName(e.target.value)}
          placeholder="Mis. Mateo"
        />
      </div>
      <div className={field}>
        <div className="flex items-center justify-between">
          <Label htmlFor="match-date" className={labelCls}>
            Tanggal
          </Label>
          <button
            type="button"
            onClick={() => setMatchDate(today)}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Sesuaikan hari ini
          </button>
        </div>
        <Input
          id="match-date"
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
        />
      </div>

      <div className={field}>
        <Label className={labelCls}>Formasi</Label>
        <Select value={formation} onValueChange={setFormation}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih formasi" />
          </SelectTrigger>
          <SelectContent>
            {FORMATIONS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={field}>
        <Label className={labelCls}>Skor</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={myGoals}
            onChange={(e) => setMyGoals(e.target.value)}
            className="h-11 w-16 text-center text-base font-semibold"
            aria-label="Gol timku"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            value={oppGoals}
            onChange={(e) => setOppGoals(e.target.value)}
            className="h-11 w-16 text-center text-base font-semibold"
            aria-label="Gol lawan"
          />
          {result && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                RESULT_BADGE[result]
              )}
            >
              {RESULT_TEXT[result]}
            </span>
          )}
        </div>
      </div>

      <div className={cn(field, "sm:col-span-2")}>
        <Label htmlFor="playstyle" className={labelCls}>
          Taktik
        </Label>
        <Input
          id="playstyle"
          value={playstyle}
          onChange={(e) => setPlaystyle(e.target.value)}
          placeholder="Mis. High press, serang lewat sayap"
        />
      </div>
      <div className={cn(field, "sm:col-span-2")}>
        <Label htmlFor="evaluation" className={labelCls}>
          Evaluasi
        </Label>
        <Textarea
          id="evaluation"
          rows={2}
          value={evaluation}
          onChange={(e) => setEvaluation(e.target.value)}
          placeholder="Pelajaran dari laga ini…"
        />
      </div>

      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex items-center justify-end gap-2 sm:col-span-2">
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            Hapus
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
