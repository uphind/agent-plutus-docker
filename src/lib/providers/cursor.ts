import { Provider } from "@/generated/prisma/client";
import { ProviderAdapter, NormalizedUsageRecord } from "./types";

const API_BASE = "https://api.cursor.com/analytics/team";

interface CursorAgentEditsDay {
  event_date: string;
  total_suggested_diffs: number;
  total_accepted_diffs: number;
  total_rejected_diffs: number;
  total_green_lines_accepted: number;
  total_red_lines_accepted: number;
  total_lines_suggested: number;
  total_lines_accepted: number;
}

interface CursorModelDay {
  date: string;
  model_breakdown: Record<string, { messages: number; users: number }>;
}

async function cursorFetch(url: string, apiKey: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Cursor API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const cursorAdapter: ProviderAdapter = {
  provider: Provider.cursor,

  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await cursorFetch(`${API_BASE}/dau?startDate=7d&endDate=today`, apiKey);
      return true;
    } catch {
      return false;
    }
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    const records: NormalizedUsageRecord[] = [];
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Fetch agent edits
    try {
      const editsData = await cursorFetch(
        `${API_BASE}/agent-edits?startDate=${start}&endDate=${end}`,
        apiKey
      );

      for (const day of (editsData.data ?? []) as CursorAgentEditsDay[]) {
        records.push({
          provider: Provider.cursor,
          userRef: null,
          model: "cursor-agent",
          date: new Date(day.event_date),
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          requestsCount: day.total_suggested_diffs,
          costUsd: 0,
          linesAccepted: day.total_lines_accepted,
          linesSuggested: day.total_lines_suggested,
          acceptRate:
            day.total_lines_suggested > 0
              ? day.total_lines_accepted / day.total_lines_suggested
              : 0,
          metadata: {
            accepted_diffs: day.total_accepted_diffs,
            rejected_diffs: day.total_rejected_diffs,
          },
        });
      }
    } catch {
      // Agent edits endpoint may not be available
    }

    // Fetch model usage
    try {
      const modelsData = await cursorFetch(
        `${API_BASE}/models?startDate=${start}&endDate=${end}`,
        apiKey
      );

      for (const day of (modelsData.data ?? []) as CursorModelDay[]) {
        for (const [modelName, stats] of Object.entries(day.model_breakdown)) {
          const existing = records.find(
            (r) =>
              r.date.getTime() === new Date(day.date).getTime() &&
              r.model === modelName
          );
          if (existing) {
            existing.requestsCount += stats.messages;
            existing.metadata = {
              ...(existing.metadata as Record<string, unknown>),
              unique_users: stats.users,
            };
          } else {
            records.push({
              provider: Provider.cursor,
              userRef: null,
              model: modelName,
              date: new Date(day.date),
              inputTokens: 0,
              outputTokens: 0,
              cachedTokens: 0,
              requestsCount: stats.messages,
              costUsd: 0,
              metadata: { unique_users: stats.users },
            });
          }
        }
      }
    } catch {
      // Model usage endpoint may not be available
    }

    return records;
  },
};
