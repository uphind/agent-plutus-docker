const API_BASE = "/api/v1";

let cachedApiKey: string | null = null;

export function setApiKey(key: string) {
  cachedApiKey = key;
  if (typeof window !== "undefined") {
    localStorage.setItem("tokenear_api_key", key);
  }
}

export function getApiKey(): string | null {
  if (cachedApiKey) return cachedApiKey;
  if (typeof window !== "undefined") {
    cachedApiKey = localStorage.getItem("tokenear_api_key");
  }
  return cachedApiKey;
}

export function clearApiKey() {
  cachedApiKey = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("tokenear_api_key");
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const key = getApiKey();
  if (!key) throw new Error("No API key configured");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.hint
      ? `${body.error}\n\n${body.hint}`
      : body.error ?? `API error: ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}

async function apiRaw(path: string) {
  const key = getApiKey();
  if (!key) throw new Error("No API key configured");
  return fetch(`${API_BASE}${path}`, {
    headers: { "X-API-Key": key },
  });
}

export const api = {
  // Analytics
  getOverview: (days = 30) => apiFetch(`/analytics/overview?days=${days}`),
  getByUser: (days = 30, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ days: String(days), ...params });
    return apiFetch(`/analytics/by-user?${qs}`);
  },
  getByProvider: (days = 30) => apiFetch(`/analytics/by-provider?days=${days}`),
  getByModel: (days = 30, provider?: string) => {
    const qs = new URLSearchParams({ days: String(days) });
    if (provider) qs.set("provider", provider);
    return apiFetch(`/analytics/by-model?${qs}`);
  },
  getTrends: (days = 30, granularity = "daily", provider?: string) => {
    const qs = new URLSearchParams({ days: String(days), granularity });
    if (provider) qs.set("provider", provider);
    return apiFetch(`/analytics/trends?${qs}`);
  },

  // Users
  getUsers: (params?: Record<string, string>) => {
    const qs = new URLSearchParams(params ?? {});
    return apiFetch(`/users?${qs}`);
  },

  // Departments
  getDepartments: () => apiFetch("/departments"),
  getDepartment: (id: string) => apiFetch(`/departments/${id}`),
  updateDepartmentBudget: (id: string, budget: number | null, alertThreshold?: number) =>
    apiFetch(`/departments/${id}/budget`, {
      method: "PUT",
      body: JSON.stringify({ monthly_budget: budget, alert_threshold: alertThreshold }),
    }),

  // Teams
  getTeams: (departmentId?: string) => {
    const qs = departmentId ? `?departmentId=${departmentId}` : "";
    return apiFetch(`/teams${qs}`);
  },
  getTeam: (id: string) => apiFetch(`/teams/${id}`),
  updateTeamBudget: (id: string, budget: number | null, alertThreshold?: number) =>
    apiFetch(`/teams/${id}/budget`, {
      method: "PUT",
      body: JSON.stringify({ monthly_budget: budget, alert_threshold: alertThreshold }),
    }),

  // Alerts
  getAlerts: () => apiFetch("/alerts"),

  // Reports
  getCostSummary: () => apiFetch("/reports/cost-summary"),
  exportCsv: async (days = 30) => {
    const res = await apiRaw(`/reports/export?days=${days}`);
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokenear-usage-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Providers
  getProviders: () => apiFetch("/providers"),
  addProvider: (provider: string, apiKeyValue: string, label?: string) =>
    apiFetch("/providers", {
      method: "POST",
      body: JSON.stringify({ provider, api_key: apiKeyValue, label }),
    }),
  deleteProvider: (provider: string) =>
    apiFetch(`/providers?provider=${provider}`, { method: "DELETE" }),

  // Sync
  triggerSync: (provider?: string) =>
    apiFetch("/sync", {
      method: "POST",
      body: JSON.stringify(provider ? { provider } : {}),
    }),
  getSyncLogs: () => apiFetch("/sync"),
};
