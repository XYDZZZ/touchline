"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchResult, PersonalMatchLog } from "@/lib/types";
import { MatchLogForm } from "@/components/app/match-log-form";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download, NotebookPen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d ?? ""} ${MONTHS[(m ?? 1) - 1] ?? ""}`;
};

const RESULT_CHIP: Record<MatchResult, string> = {
  win: "bg-emerald-500/15 text-emerald-700",
  draw: "bg-amber-500/15 text-amber-700",
  loss: "bg-rose-500/15 text-rose-700",
};
const RESULT_LETTER: Record<MatchResult, string> = { win: "W", draw: "D", loss: "L" };

type ResultFilter = MatchResult | "all";

export function MatchesView() {
  const [logs, setLogs] = useState<PersonalMatchLog[] | null>(null);
  const [editing, setEditing] = useState<PersonalMatchLog | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Filters
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [teamFilter, setTeamFilter] = useState("");
  const [opponentSearch, setOpponentSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const isToday = startDate === today && endDate === today;

  const fetchLogs = useCallback(async (): Promise<PersonalMatchLog[]> => {
    const res = await fetch("/api/match-logs");
    if (!res.ok) throw new Error("Request failed");
    return (await res.json()).logs;
  }, []);

  const refresh = useCallback(() => {
    fetchLogs()
      .then((l) => setLogs(l))
      .catch(() => undefined);
  }, [fetchLogs]);

  useEffect(() => {
    let alive = true;
    fetchLogs()
      .then((l) => {
        if (alive) setLogs(l);
      })
      .catch(() => {
        if (alive) setLogs([]);
      });
    return () => {
      alive = false;
    };
  }, [fetchLogs]);

  const record = useMemo(() => {
    const r = { win: 0, draw: 0, loss: 0 };
    (logs ?? []).forEach((l) => r[l.result]++);
    return r;
  }, [logs]);

  // Unique teams played as (for quick-filter chips)
  const myTeams = useMemo(() => {
    if (!logs) return [];
    const seen = new Map<string, string>();
    logs.forEach((l) => seen.set(l.myTeamId, l.myTeamName));
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!logs) return logs;
    return logs.filter((l) => {
      if (resultFilter !== "all" && l.result !== resultFilter) return false;
      if (teamFilter && l.myTeamId !== teamFilter) return false;
      if (opponentSearch && !l.opponentName.toLowerCase().includes(opponentSearch.toLowerCase())) return false;
      if (startDate && l.matchDate < startDate) return false;
      if (endDate && l.matchDate > endDate) return false;
      return true;
    });
  }, [logs, resultFilter, teamFilter, opponentSearch, startDate, endDate]);

  const hasActiveFilter =
    resultFilter !== "all" ||
    teamFilter !== "" ||
    opponentSearch !== "" ||
    startDate !== "" ||
    endDate !== "";

  function clearFilters() {
    setResultFilter("all");
    setTeamFilter("");
    setOpponentSearch("");
    setStartDate("");
    setEndDate("");
  }

  async function removeLog(id: string) {
    const res = await fetch(`/api/match-logs/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Catatan gagal dihapus.");
    toast.success("Laga dihapus.");
    refresh();
  }

  function exportForAI() {
    window.open("/api/match-logs/export", "_blank");
    toast.success("Riwayat diekspor sebagai JSON.");
  }

  const RESULT_FILTER_OPTS: { value: ResultFilter; label: string; cls: string; activeCls: string }[] = [
    { value: "all", label: "Semua", cls: "text-muted-foreground border-border/60", activeCls: "bg-foreground text-background border-foreground" },
    { value: "win", label: "Menang", cls: "text-emerald-700 border-emerald-200", activeCls: "bg-emerald-500 text-white border-emerald-500" },
    { value: "draw", label: "Imbang", cls: "text-amber-700 border-amber-200", activeCls: "bg-amber-500 text-white border-amber-500" },
    { value: "loss", label: "Kalah", cls: "text-rose-700 border-rose-200", activeCls: "bg-rose-500 text-white border-rose-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Catatan Laga</h1>
        <div className="flex items-center gap-2.5">
          <div className="mr-1 hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {record.win}W
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {record.draw}D
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {record.loss}L
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={exportForAI}
            aria-label="Ekspor JSON untuk AI"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Catat Laga
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {logs !== null && logs.length > 0 && (
        <div className="space-y-2.5">
          {/* Result filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {RESULT_FILTER_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResultFilter(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  resultFilter === opt.value ? opt.activeCls : opt.cls + " hover:opacity-80"
                )}
              >
                {opt.label}
                {opt.value !== "all" && (
                  <span className="ml-1 opacity-70">
                    ({record[opt.value as MatchResult]})
                  </span>
                )}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Team filter + opponent search */}
          <div className="flex flex-wrap gap-2">
            {/* Tim filter pills */}
            {myTeams.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {myTeams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTeamFilter(teamFilter === t.id ? "" : t.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-all",
                      teamFilter === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            {/* Date range filter with "Hari ini" quick preset */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                  title="Dari tanggal"
                />
                <span className="text-muted-foreground/60">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                  title="Sampai tanggal"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                    title="Hapus filter tanggal"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isToday) {
                    setStartDate("");
                    setEndDate("");
                  } else {
                    setStartDate(today);
                    setEndDate(today);
                  }
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                  isToday
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                )}
                title="Filter laga hari ini"
              >
                Hari ini
              </button>
            </div>

            {/* Opponent search */}
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama lawan…"
                value={opponentSearch}
                onChange={(e) => setOpponentSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
              {opponentSearch && (
                <button
                  type="button"
                  onClick={() => setOpponentSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {logs === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <NotebookPen className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Belum ada laga tercatat.</p>
            <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Catat laga pertama
            </Button>
          </CardContent>
        </Card>
      ) : filteredLogs !== null && filteredLogs.length === 0 ? (
        <Card className="border-dashed border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Search className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Tidak ada laga yang cocok dengan filter.</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Reset filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 py-1 shadow-none">
          <CardContent className="px-1">
            {(filteredLogs ?? []).map((l, i) => (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(l)}
                onKeyDown={(e) => e.key === "Enter" && setEditing(l)}
                title="Klik untuk mengubah"
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/60",
                  i > 0 && "border-t border-border/60"
                )}
              >
                <span className="w-9 shrink-0 text-[11px] leading-tight text-muted-foreground">
                  {fmtDate(l.matchDate)}
                </span>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <TeamLogo name={l.myTeamName} logoUrl={l.myTeamLogoUrl} size={20} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">{l.myTeamName}</span>
                    <span className="shrink-0 whitespace-nowrap px-0.5 font-semibold tabular-nums">
                      {l.myGoals}–{l.opponentGoals}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right font-medium">{l.opponentTeamName}</span>
                    <TeamLogo name={l.opponentTeamName} logoUrl={l.opponentTeamLogoUrl} size={20} className="shrink-0" />
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    vs {l.opponentName}
                    {l.formation ? ` · ${l.formation}` : ""}
                    {l.playstyle ? ` · ${l.playstyle}` : ""}
                  </p>
                </div>

                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    RESULT_CHIP[l.result]
                  )}
                >
                  {RESULT_LETTER[l.result]}
                </span>

                <div className="hidden shrink-0 gap-0.5 md:flex md:opacity-0 md:transition-opacity md:focus-within:opacity-100 md:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(l);
                    }}
                    aria-label="Ubah laga"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLog(l.id);
                    }}
                    aria-label="Hapus laga"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Log dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Catat Laga</DialogTitle>
          </DialogHeader>
          <MatchLogForm
            onSaved={() => {
              setLogOpen(false);
              refresh();
            }}
            onCancel={() => setLogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Ubah Laga</DialogTitle>
          </DialogHeader>
          {editing && (
            <MatchLogForm
              key={editing.id}
              initial={editing}
              onSaved={() => {
                setEditing(null);
                refresh();
              }}
              onCancel={() => setEditing(null)}
              onDelete={async () => {
                setEditing(null);
                await removeLog(editing.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


