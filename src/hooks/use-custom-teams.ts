"use client";

import { useCallback, useEffect, useState } from "react";
import type { Team } from "@/lib/types";

const STORAGE_KEY = "touchline:custom-teams";

function load(): Team[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

function save(teams: Team[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {
    // ignore quota errors
  }
}

export function useCustomTeams() {
  const [customTeams, setCustomTeams] = useState<Team[]>([]);

  useEffect(() => {
    setCustomTeams(load());
  }, []);

  const addCustomTeam = useCallback((name: string, logoUrl?: string): Team => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const team: Team = {
      id,
      name: name.trim(),
      short: name.trim().slice(0, 3).toUpperCase(),
      logo_url: logoUrl?.trim() ?? "",
    };
    setCustomTeams((prev) => {
      const next = [...prev, team];
      save(next);
      return next;
    });
    return team;
  }, []);

  const removeCustomTeam = useCallback((id: string) => {
    setCustomTeams((prev) => {
      const next = prev.filter((t) => t.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { customTeams, addCustomTeam, removeCustomTeam };
}
