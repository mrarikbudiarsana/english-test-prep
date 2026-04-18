export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ApiError {
  error: string;
  statusCode?: number;
}

export interface DashboardStats {
  totalAttempts: number;
  averageBand: number | null;
  bestBand: number | null;
  recentAttempts: Array<{
    id: string;
    testTitle: string;
    overallScore: number | null;
    status: string;
    completedAt: string | null;
  }>;
  sectionAverages: {
    listening: number | null;
    reading: number | null;
    structure: number | null;
  };
}

export interface ProgressData {
  dates: string[];
  overallScores: number[];
  listeningScores: number[];
  readingScores: number[];
  structureScores: number[];
}
