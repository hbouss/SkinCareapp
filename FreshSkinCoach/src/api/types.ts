// src/api/types.ts

export interface LabelStat {
  label: string;
  count: number;
  percent: number;
}

export interface StatsResponse {
  total_sessions: number;
  by_label: LabelStat[];
}

// On accepte un champ month ou week
export interface TrendPoint {
  month: string;               // ex. "Mar 2025"
  week: string;                // ex. "S14 2025"
  averages: Record<string, number>;
}

export interface TrendResponse {
  trend: TrendPoint[];
}
