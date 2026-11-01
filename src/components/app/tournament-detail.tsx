"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GoalEntry, Participant, Team, TopScorer, TournamentDetail } from "@/lib/types";
import { TeamCombobox } from "@/components/team-combobox";
import { TeamLogo } from "@/components/team-logo";
import { BracketView } from "@/components/app/bracket-view";
import { LeagueView } from "@/components/app/league-view";
import { StandingsTable } from "@/components/app/standings-table";
import { TopScorersTable } from "@/components/app/top-scorers-table";
import { computeStandings } from "@/lib/league";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  ChevronLeft,
  Flame,
  GripVertical,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Trophy,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  tournamentId: string;
  onBack: () => void;
}

export function TournamentDetail({ tournamentId, onBack }: Props) {
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchDetail = useCallback(async (): Promise<TournamentDetail | null> => {
    const res = await fetch(`/api/tournaments/${tournamentId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Request failed");
    return (await res.json()) as TournamentDetail;
  }, [tournamentId]);

  const refresh = useCallback(() => {
    fetchDetail()
      .then((d) => {
        if (d === null) setNotFound(true);
        else setDetail(d);
      })
      .catch(() => undefined);
  }, [fetchDetail]);

  useEffect(() => {
    let alive = true;
    fetchDetail()
      .then((d) => {
        if (!alive) return;
        if (d === null) setNotFound(true);
        else setDetail(d);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });
    return () => {
      alive = false;
    };
  }, [fetchDetail]);

  const participantsById = useMemo(
    () => Object.fromEntries((detail?.participants ?? []).map((p) => [p.id, p] as const)),
    [detail?.participants]
  );

  // ---- Add participant ----
  const [addOpen, setAddOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);

  async function addParticipant() {
    if (!playerName.trim() || !team) return;
    setSaving(true);
    const res = await fetch(`/api/tournaments/${tournamentId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: playerName.trim(),
        teamId: team.id,
        teamName: team.name,
        teamLogoUrl: team.logo_url,
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Pemain gagal ditambahkan.");

    toast.success(`${data.participant.playerName} bergabung.`);
    setPlayerName("");
    setTeam(null);
    setAddOpen(false);
    refresh();
  }

  async function removeParticipant(id: string) {
    const res = await fetch(`/api/participants/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Pemain gagal dihapus.");
    toast.success("Pemain dihapus.");
    refresh();
  }

  // ---- DO (Dropout) participant ----
  const [doConfirm, setDoConfirm] = useState<Participant | null>(null);

  async function dropoutParticipant(participant: Participant) {
    const res = await fetch(`/api/participants/${participant.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal me-DO pemain.");
    toast.success(`${participant.playerName} di-DO dari turnamen.`);
    setDoConfirm(null);

    // If tournament has active matches, re-generate schedule with remaining participants
    if (detail && detail.matches.length > 0 && detail.participants.length > 2) {
      await generate({}, "Bagan diperbarui tanpa pemain yang di-DO.");
    } else {
      refresh();
    }
  }

  // ---- Custom bracket ordering ----
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [customOrder, setCustomOrder] = useState<Participant[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  function openCustomOrder() {
    if (!detail) return;
    setCustomOrder([...detail.participants]);
    setCustomOrderOpen(true);
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setCustomOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  function shuffleOrder() {
    setCustomOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  // ---- Generate / reset / shuffle ----
  const [confirmReset, setConfirmReset] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generate(
    options?: { participantOrder?: string[]; shuffle?: boolean },
    successMsg = "Jadwal siap."
  ) {
    setGenerating(true);
    const res = await fetch(`/api/tournaments/${tournamentId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options ?? {}),
    });
    setGenerating(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Jadwal gagal dibuat.");
    toast.success(successMsg);
    setConfirmReset(false);
    setCustomOrderOpen(false);
    setPendingOrder(null);
    refresh();
  }

  /** Direct shuffle trigger from the "Acak" button */
  function handleAcakClick() {
    if (!detail || detail.participants.length < 2) return;
    const isCup = detail.tournament.format === "cup";

    // If matches have completed scores, confirm first before clearing scores
    const hasScores = detail.matches.some(
      (m) => m.status === "completed" || (m.score1 !== null && m.score1 !== undefined)
    );
    if (hasScores) {
      setPendingOrder(null);
      setConfirmReset(true);
      return;
    }

    // No scores recorded yet -> direct shuffle with instant update!
    generate(
      { shuffle: true },
      isCup ? "Bagan bracket berhasil diacak!" : "Jadwal liga berhasil diacak!"
    );
  }

  // ---- Save score ----
  async function saveScore(
    matchId: string,
    score1: number,
    score2: number,
    matchDate?: string,
    goalScorers?: GoalEntry[]
  ) {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score1, score2, matchDate, goalScorers }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Skor gagal disimpan.");
      return;
    }
    toast.success("Skor tersimpan.");
    await refresh();
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 h-8" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />Kembali
        </Button>
        <p className="text-sm text-muted-foreground">Turnamen tidak ditemukan.</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const { tournament, participants, matches, topScorers } = detail;
  const isCup = tournament.format === "cup";
  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0;
  const cupSize = 2 ** totalRounds;

  const finalMatch = isCup && totalRounds ? matches.find((m) => m.round === totalRounds) : null;
  const champion =
    finalMatch?.status === "completed" && finalMatch.winnerId
      ? participantsById[finalMatch.winnerId]
      : null;

  // Participant list component reusable in tabs or initial screen
  const participantsListCard = (
    <Card className="border-border/70 shadow-none">
      <CardContent className="pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Pemain <span className="font-normal text-muted-foreground">({participants.length})</span>
          </h2>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />Tambah
          </Button>
        </div>

        {participants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Tambah minimal 2 pemain.</p>
        ) : (
          <div className="scroll-slim max-h-[420px] divide-y divide-border/70 overflow-y-auto">
            {participants.map((p, i) => (
              <div key={p.id} className="group flex items-center gap-2.5 py-2">
                <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <TeamLogo name={p.teamName} logoUrl={p.teamLogoUrl} size={26} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{p.playerName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{p.teamName}</p>
                </div>
                {matches.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-amber-500 md:opacity-0 md:transition-opacity md:focus-visible:opacity-100 md:group-hover:opacity-100"
                    onClick={() => setDoConfirm(p)}
                    aria-label="DO pemain"
                    title="Dropout (DO) pemain"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground md:opacity-0 md:transition-opacity md:focus-visible:opacity-100 md:group-hover:opacity-100"
                  onClick={() => removeParticipant(p.id)}
                  aria-label="Hapus pemain"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-2 mb-0.5 h-7 text-muted-foreground" onClick={onBack}>
            <ChevronLeft className="mr-0.5 h-4 w-4" />Turnamen
          </Button>
          <h1 className="truncate text-lg font-semibold tracking-tight">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground">
            {isCup ? "Cup (Sistem Gugur)" : "Liga"} · {participants.length} pemain
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {matches.length > 0 && (
            <>
              <Button
                size="sm"
                onClick={handleAcakClick}
                disabled={generating}
                className="gap-1.5 font-medium shadow-sm"
              >
                <Shuffle className="h-3.5 w-3.5" />
                {generating ? "Mengacak…" : `Acak ${isCup ? "Bracket" : "Jadwal"}`}
              </Button>
              {isCup && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCustomOrder}
                  className="gap-1.5"
                >
                  Atur Urutan
                </Button>
              )}
            </>
          )}

          {matches.length === 0 && participants.length >= 2 && (
            <>
              {isCup && (
                <Button size="sm" variant="outline" onClick={openCustomOrder} className="gap-1.5">
                  <Shuffle className="h-3.5 w-3.5" />
                  Atur Urutan
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  generate(
                    { shuffle: true },
                    isCup ? "Bracket berhasil diacak!" : "Jadwal liga berhasil diacak!"
                  )
                }
                disabled={generating}
                className="gap-1.5"
              >
                <Shuffle className="h-3.5 w-3.5 text-primary" />
                Acak &amp; Buat
              </Button>
              <Button
                size="sm"
                onClick={() => generate({}, "Jadwal siap.")}
                disabled={generating}
              >
                {isCup ? "Buat Bracket" : "Buat Jadwal"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
          <TeamLogo name={champion.teamName} logoUrl={champion.teamLogoUrl} size={26} />
          <p className="text-sm font-medium">
            Selamat kepada <span className="font-semibold text-amber-600 dark:text-amber-400">{champion.playerName}</span> ({champion.teamName}) sebagai Juara!
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {matches.length === 0 ? (
        /* Setup mode: side-by-side player adding & generation prompt */
        <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
          {participantsListCard}
          <Card className="border-dashed border-border/80 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="mb-3 h-8 w-8 text-muted-foreground/30" />
              {participants.length < 2 ? (
                <>
                  <p className="text-sm font-medium">Belum cukup pemain</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Tambahkan minimal 2 pemain untuk mulai membuat {isCup ? "bracket sistem gugur" : "jadwal liga"}.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Tambah Pemain
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Pemain siap ({participants.length} pemain)</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    {isCup
                      ? "Buat bracket sesuai urutan seeding atau klik Acak untuk mengundi posisi pemain secara acak."
                      : "Buat jadwal pertandingan liga dengan sistem round-robin."}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        generate(
                          { shuffle: true },
                          isCup ? "Bracket berhasil diacak!" : "Jadwal liga berhasil diacak!"
                        )
                      }
                      disabled={generating}
                      className="gap-1.5"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Acak &amp; Buat {isCup ? "Bracket" : "Jadwal"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generate({}, "Jadwal siap.")}
                      disabled={generating}
                    >
                      Buat Sesuai Urutan
                    </Button>
                    {isCup && (
                      <Button size="sm" variant="ghost" onClick={openCustomOrder}>
                        Atur Urutan Dulu
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : isCup ? (
        /* Cup mode with matches: Full-width tabs for spacious bracket viewing */
        <Tabs defaultValue="bracket" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="bracket" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Bagan Bracket
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Pemain ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="topscorers" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Top Skor
            </TabsTrigger>
          </TabsList>

          {/* Bracket tab: FULL WIDTH */}
          <TabsContent value="bracket" className="mt-0">
            <Card className="border-border/70 shadow-none">
              <CardContent className="p-4 sm:p-6 overflow-x-auto scroll-slim">
                <BracketView
                  matches={matches}
                  participantsById={participantsById}
                  totalRounds={totalRounds}
                  size={cupSize}
                  onSaveScore={(m, s1, s2, date, goalScorers) =>
                    saveScore(m.id, s1, s2, date, goalScorers)
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players tab */}
          <TabsContent value="players" className="mt-0">
            <div className="max-w-md">
              {participantsListCard}
            </div>
          </TabsContent>

          {/* Top scorers tab */}
          <TabsContent value="topscorers" className="mt-0">
            <Card className="border-border/70 shadow-none max-w-xl">
              <CardContent className="pt-4">
                <h2 className="mb-3 text-sm font-semibold">Klasemen Top Skor</h2>
                <TopScorersTable scorers={topScorers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* League mode: Tabs for Standings, Fixtures, Players, Top Scorers */
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="standings" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Klasemen
            </TabsTrigger>
            <TabsTrigger value="fixtures" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Jadwal
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Pemain ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="topscorers" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Top Skor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="mt-0">
            <Card className="border-border/70 shadow-none">
              <CardContent className="pt-2">
                <StandingsTable rows={computeStandings(participants, matches)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixtures" className="mt-0">
            <LeagueView
              matches={matches}
              participantsById={participantsById}
              onSaveScore={(m, s1, s2, date, goalScorers) =>
                saveScore(m.id, s1, s2, date, goalScorers)
              }
            />
          </TabsContent>

          <TabsContent value="players" className="mt-0">
            <div className="max-w-md">
              {participantsListCard}
            </div>
          </TabsContent>

          <TabsContent value="topscorers" className="mt-0">
            <Card className="border-border/70 shadow-none max-w-xl">
              <CardContent className="pt-4">
                <h2 className="mb-3 text-sm font-semibold">Klasemen Top Skor</h2>
                <TopScorersTable scorers={topScorers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Participant Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Tambah Pemain</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="player" className="text-xs text-muted-foreground">
                Nama pemain
              </Label>
              <Input
                id="player"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Mis. Xander"
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Tim</Label>
              <TeamCombobox value={team} onChange={setTeam} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Selesai
              </Button>
              <Button disabled={!playerName.trim() || !team || saving} onClick={addParticipant}>
                {saving ? "Menambah…" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset / Reshuffle confirmation dialog */}
      <Dialog open={confirmReset} onOpenChange={(open) => { setConfirmReset(open); if (!open) setPendingOrder(null); }}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Acak Ulang {isCup ? "Bracket" : "Jadwal"}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingOrder
              ? "Urutan baru akan diterapkan. Semua skor pertandingan yang sudah ada akan dihapus."
              : "Pertandingan sudah memiliki catatan skor. Mengacak ulang akan menghapus semua skor dan menyusun bagan pertandingan baru."}
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => { setConfirmReset(false); setPendingOrder(null); }}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingOrder) {
                  generate({ participantOrder: pendingOrder }, "Bagan kustom berhasil diterapkan!");
                } else {
                  generate(
                    { shuffle: true },
                    isCup ? "Bagan bracket berhasil diacak ulang!" : "Jadwal liga berhasil diacak ulang!"
                  );
                }
              }}
              disabled={generating}
              className="gap-1.5"
            >
              <Shuffle className="h-3.5 w-3.5" />
              {generating ? "Mengacak…" : "Ya, Acak Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DO confirmation dialog */}
      <Dialog open={!!doConfirm} onOpenChange={(o) => !o && setDoConfirm(null)}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>DO Pemain?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{doConfirm?.playerName}</span> akan dikeluarkan dari turnamen.
            {matches.length > 0 && " Bagan / jadwal akan diperbarui secara otomatis."}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDoConfirm(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => doConfirm && dropoutParticipant(doConfirm)}>
              <UserMinus className="mr-1.5 h-3.5 w-3.5" />
              DO Pemain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom bracket order dialog */}
      <Dialog open={customOrderOpen} onOpenChange={setCustomOrderOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Atur Urutan Bracket</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">
            Geser (drag) untuk mengubah urutan seeding atau klik Acak untuk mengundi urutan.
          </p>
          <div className="flex gap-2 mb-3">
            <Button size="sm" variant="outline" onClick={shuffleOrder} className="flex-1 gap-1.5">
              <Shuffle className="h-3.5 w-3.5 text-primary" />
              Acak Urutan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCustomOrder(detail?.participants ?? [])}
              className="flex-1 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto scroll-slim">
            {customOrder.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-colors",
                  dragIdx === i && "border-primary/50 bg-primary/5"
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <TeamLogo name={p.teamName} logoUrl={p.teamLogoUrl} size={24} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">{p.playerName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{p.teamName}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-3 gap-2">
            <Button variant="ghost" onClick={() => setCustomOrderOpen(false)}>Batal</Button>
            <Button
              onClick={() => {
                const order = customOrder.map((p) => p.id);
                setCustomOrderOpen(false);
                const hasScores = matches.some((m) => m.status === "completed" || m.score1 !== null);
                if (hasScores) {
                  setPendingOrder(order);
                  setConfirmReset(true);
                } else {
                  generate({ participantOrder: order }, "Bagan kustom berhasil diterapkan!");
                }
              }}
              disabled={generating}
            >
              {generating ? "Membuat…" : "Terapkan ke Bracket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
