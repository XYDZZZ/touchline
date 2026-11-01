"use client";

import type { StandingRow } from "@/lib/league";
import { TeamLogo } from "@/components/team-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Automated league table: P, W, D, L, GD, Pts — sorted by points, GD, goals for. */
export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-8 text-xs" />
          <TableHead className="text-xs">Pemain</TableHead>
          <TableHead className="text-center text-xs">P</TableHead>
          <TableHead className="text-center text-xs">W</TableHead>
          <TableHead className="text-center text-xs">D</TableHead>
          <TableHead className="text-center text-xs">L</TableHead>
          <TableHead className="text-center text-xs">GD</TableHead>
          <TableHead className="text-center text-xs font-semibold">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.participant.id} className={cn(i === 0 && "bg-primary/[0.04] hover:bg-primary/[0.06]")}>
            <TableCell className="text-xs tabular-nums text-muted-foreground">{i + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <TeamLogo name={r.participant.teamName} logoUrl={r.participant.teamLogoUrl} size={24} />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-medium">{r.participant.playerName}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{r.participant.teamName}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center text-sm tabular-nums text-muted-foreground">{r.played}</TableCell>
            <TableCell className="text-center text-sm tabular-nums text-muted-foreground">{r.won}</TableCell>
            <TableCell className="text-center text-sm tabular-nums text-muted-foreground">{r.drawn}</TableCell>
            <TableCell className="text-center text-sm tabular-nums text-muted-foreground">{r.lost}</TableCell>
            <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
              {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
            </TableCell>
            <TableCell className="text-center text-sm font-semibold tabular-nums">{r.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
