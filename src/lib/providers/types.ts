import { Provider } from "@/generated/prisma/client";

export interface NormalizedUsageRecord {
  provider: Provider;
  userRef: string | null;
  model: string | null;
  date: Date;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestsCount: number;
  costUsd: number;
  linesAccepted?: number;
  linesSuggested?: number;
  acceptRate?: number;
  metadata?: Record<string, unknown>;
}

export interface ProviderAdapter {
  provider: Provider;
  fetchUsage(apiKey: string, startDate: Date, endDate: Date): Promise<NormalizedUsageRecord[]>;
  testConnection(apiKey: string): Promise<boolean>;
}
