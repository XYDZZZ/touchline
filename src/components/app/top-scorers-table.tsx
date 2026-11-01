import type { TopScorer } from "@/lib/types";
import { TeamLogo } from "@/components/team-logo";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  scorers: TopScorer[];
}

export function TopScorersTable({ scorers }: Props) {
  if (scorers.length === 0) {
    return (
      <div className="py-12 text-center">
        <Trophy className="mx-auto mb-2 h-7 w-7 text-muted-foreground/30" />
        <p className="text-sm font-medium">Belum ada data pencetak gol</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pencetak gol dapat dicatat saat memasukkan skor setiap pertandingan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground text-xs font-medium">
            <th className="py-2.5 pr-3 text-left w-10">#</th>
            <th className="py-2.5 pr-3 text-left">Pemain</th>
            <th className="py-2.5 text-right w-16">Gol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {scorers.map((s, i) => {
            const rank = i + 1;
            return (
              <tr key={s.id ?? `${s.playerName}-${s.teamName}-${i}`} className="group hover:bg-accent/20 transition-colors">
                <td className="py-2.5 pr-3 text-xs font-semibold tabular-nums">
                  {rank === 1 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                      1
                    </span>
                  ) : rank === 2 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400/20 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                      2
                    </span>
                  ) : rank === 3 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700/15 text-amber-700 dark:text-amber-500 text-[11px] font-bold">
                      3
                    </span>
                  ) : (
                    <span className="text-muted-foreground pl-1">{rank}</span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo name={s.teamName} size={22} />
                    <div className="min-w-0 leading-tight">
                      <p className={cn("truncate text-sm font-medium", rank === 1 && "font-semibold text-foreground")}>
                        {s.playerName}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{s.teamName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right font-bold tabular-nums text-primary text-sm">
                  {s.goals}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
