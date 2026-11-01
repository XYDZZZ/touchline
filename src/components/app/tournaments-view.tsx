"use client";

import { useCallback, useEffect, useState } from "react";
import type { Tournament, TournamentFormat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ListOrdered, Plus, Swords, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpen: (id: string) => void;
}

const FORMAT_META: Record<TournamentFormat, { label: string; hint: string; Icon: typeof Trophy }> = {
  cup: { label: "Cup", hint: "Sistem gugur", Icon: Swords },
  league: { label: "Liga", hint: "Kompetisi penuh", Icon: ListOrdered },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "baru saja" : `${mins} menit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan yang lalu`;
  return `${Math.floor(months / 12)} tahun yang lalu`;
}

export function TournamentsView({ onOpen }: Props) {
  const [items, setItems] = useState<Tournament[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("cup");
  const [busy, setBusy] = useState(false);

  const fetchItems = useCallback(async (): Promise<Tournament[]> => {
    const res = await fetch("/api/tournaments");
    if (!res.ok) throw new Error("Request failed");
    return (await res.json()).tournaments;
  }, []);

  const refresh = useCallback(() => {
    fetchItems()
      .then((t) => setItems(t))
      .catch(() => undefined);
  }, [fetchItems]);

  useEffect(() => {
    let alive = true;
    fetchItems()
      .then((t) => {
        if (alive) setItems(t);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [fetchItems]);

  async function createTournament() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), format }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Turnamen gagal dibuat.");

    toast.success(`"${data.tournament.name}" dibuat.`);
    setOpen(false);
    setName("");
    refresh();
    onOpen(data.tournament.id);
  }

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Turnamen gagal dihapus.");
    toast.success("Turnamen dihapus.");
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Turnamen</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Turnamen Baru
        </Button>
      </div>

      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Trophy className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Belum ada turnamen.</p>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Buat turnamen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const meta = FORMAT_META[t.format];
            return (
              <Card
                key={t.id}
                className="group relative cursor-pointer border-border/70 shadow-none transition-colors hover:border-primary/40"
                onClick={() => onOpen(t.id)}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <meta.Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta.label} · {t.participantCount ?? 0} pemain
                    </p>
                    {t.createdAt && (
                      <p className="mt-1 text-[10px] text-muted-foreground/60" title={fmtDate(t.createdAt)}>
                        {fmtDate(t.createdAt)} · {timeAgo(t.createdAt)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                </CardContent>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground md:opacity-0 md:transition-opacity md:focus-visible:opacity-100 md:group-hover:opacity-100"
                  onClick={(e) => remove(t.id, e)}
                  aria-label="Hapus turnamen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Turnamen Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="t-name" className="text-xs text-muted-foreground">
                Nama
              </Label>
              <Input
                id="t-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mis. Jumat Malam Cup"
                onKeyDown={(e) => e.key === "Enter" && createTournament()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FORMAT_META) as TournamentFormat[]).map((f) => {
                  const meta = FORMAT_META[f];
                  const selected = format === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border/80 hover:border-border"
                      )}
                    >
                      <meta.Icon
                        className={cn("h-4.5 w-4.5", selected ? "text-primary" : "text-muted-foreground")}
                        strokeWidth={1.75}
                      />
                      <span className="leading-tight">
                        <span className="block text-sm font-medium">{meta.label}</span>
                        <span className="block text-xs text-muted-foreground">{meta.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button disabled={!name.trim() || busy} onClick={createTournament}>
              {busy ? "Membuat…" : "Buat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
