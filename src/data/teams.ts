import raw from "./teams.json";
import type { Team } from "@/lib/types";

export const teams = raw as Team[];
export const getTeam = (id: string) => teams.find((t) => t.id === id);
