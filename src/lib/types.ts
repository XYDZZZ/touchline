export interface Team {
  id: string;
  name: string;
  short?: string;
  logo_url: string;
}

export type TournamentFormat = "cup" | "league";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  status: "draft" | "active" | "completed";
  createdAt: string;
  participantCount?: number;
}

export interface Participant {
  id: string;
  tournamentId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamLogoUrl: string;
}

export type MatchStatus = "pending" | "ready" | "completed" | "bye";

export interface GoalEntry {
  participantId: string;
  playerName: string;
  teamName: string;
  goals: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  slot: number;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: MatchStatus;
  matchDate?: string | null;
  goalScorers?: GoalEntry[];
}

export interface TopScorer {
  id?: string;
  participantId?: string;
  playerName: string;
  teamName: string;
  goals: number;
}

export interface TournamentDetail {
  tournament: Tournament;
  participants: Participant[];
  matches: TournamentMatch[];
  topScorers: TopScorer[];
}

export type MatchResult = "win" | "draw" | "loss";

export interface PersonalMatchLog {
  id: string;
  matchDate: string;
  opponentName: string;
  myTeamId: string;
  myTeamName: string;
  myTeamLogoUrl: string;
  opponentTeamId: string;
  opponentTeamName: string;
  opponentTeamLogoUrl: string;
  formation: string | null;
  playstyle: string | null;
  result: MatchResult;
  myGoals: number;
  opponentGoals: number;
  evaluation: string | null;
  gameTitle: string;
  createdAt: string;
}
