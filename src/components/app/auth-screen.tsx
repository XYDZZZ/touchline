"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAuthed: (user: SessionUser) => void;
}

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "signin" ? { email, password } : { email, password, displayName };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) return setError(data.error ?? "Terjadi kesalahan. Coba lagi.");
    onAuthed(data.user as SessionUser);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Touchline</h1>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            {/* Segmented mode switch */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
              {(
                [
                  ["signin", "Masuk"],
                  ["signup", "Daftar"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => {
                    setMode(value);
                    setError(null);
                  }}
                  className={cn(
                    "h-8 rounded-md text-sm transition-colors",
                    mode === value
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="displayName" className="text-xs text-muted-foreground">
                    Nama tampilan
                  </Label>
                  <Input
                    id="displayName"
                    required
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Mis. Coach Dika"
                  />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@contoh.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Kata sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Mohon tunggu…" : mode === "signin" ? "Masuk" : "Mulai"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
