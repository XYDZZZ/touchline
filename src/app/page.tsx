"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { AuthScreen } from "@/components/app/auth-screen";
import { TournamentsView } from "@/components/app/tournaments-view";
import { TournamentDetail } from "@/components/app/tournament-detail";
import { MatchesView } from "@/components/app/matches-view";
import { LogOut, NotebookPen, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "tournaments" | "matches";

const NAV: { value: Tab; label: string; Icon: typeof Trophy }[] = [
  { value: "tournaments", label: "Turnamen", Icon: Trophy },
  { value: "matches", label: "Catatan Laga", Icon: NotebookPen },
];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
        <Trophy className="h-4 w-4" />
      </span>
      {!compact && <span className="text-[15px]">Touchline</span>}
    </span>
  );
}

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>("tournaments");
  const [openTournament, setOpenTournament] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setOpenTournament(null);
    setTab("tournaments");
  }

  const go = (value: Tab) => {
    setTab(value);
    setOpenTournament(null);
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthed={(u) => setUser(u)} />;
  }

  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col px-3 py-5 md:flex">
        <button
          type="button"
          className="mb-6 px-2 text-left"
          onClick={() => go("tournaments")}
          aria-label="Touchline"
        >
          <Wordmark />
        </button>

        <nav className="space-y-1" aria-label="Navigasi utama">
          {NAV.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => go(value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                tab === value
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initial}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium">{user.displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <button
            type="button"
            onClick={signOut}
            aria-label="Keluar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur md:hidden">
        <div className="flex h-14 items-center px-4">
          <button type="button" onClick={() => go("tournaments")} aria-label="Touchline">
            <Wordmark />
          </button>
          <button
            type="button"
            onClick={signOut}
            aria-label="Keluar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="md:ml-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-8">
          {tab === "tournaments" ? (
            openTournament ? (
              <TournamentDetail
                key={openTournament}
                tournamentId={openTournament}
                onBack={() => setOpenTournament(null)}
              />
            ) : (
              <TournamentsView onOpen={(id) => setOpenTournament(id)} />
            )
          ) : (
            <MatchesView />
          )}
        </div>
      </main>

      {/* Bottom nav — mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navigasi utama"
      >
        {NAV.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => go(value)}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              tab === value ? "font-medium text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
