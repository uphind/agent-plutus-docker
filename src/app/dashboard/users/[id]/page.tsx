"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { SpendChart } from "@/components/charts/spend-chart";
import { SkeletonCard } from "@/components/ui/skeleton";
import { api } from "@/lib/dashboard-api";
import { formatCurrency, formatTokens, PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/utils";
import { DollarSign, Zap, Hash } from "lucide-react";

interface UserDetail {
  user: {
    id: string; name: string; email: string;
    department: string | null; team: string | null;
    jobTitle: string | null; employeeId: string | null; status: string;
  };
  usage: Array<{
    provider: string; model: string | null;
    _sum: { inputTokens: number | null; outputTokens: number | null; cachedTokens: number | null; requestsCount: number | null; costUsd: number | null };
  }>;
  dailyUsage: Array<{ date: string; provider: string; total_cost: number; total_tokens: number }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api.getByUser(30, { userId })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Users", href: "/dashboard/users" }, { label: "Loading..." }]} />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Users", href: "/dashboard/users" }, { label: "Error" }]} />
        <Card className="p-8 text-center"><p className="text-destructive">{error ?? "User not found"}</p></Card>
      </div>
    );
  }

  const { user, usage, dailyUsage } = data;
  const totalCost = usage.reduce((s, u) => s + Number(u._sum.costUsd ?? 0), 0);
  const totalTokens = usage.reduce((s, u) => s + (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0), 0);
  const totalRequests = usage.reduce((s, u) => s + (u._sum.requestsCount ?? 0), 0);

  const dailyAgg = dailyUsage.reduce((acc, d) => {
    const existing = acc.find((a) => a.date === d.date);
    if (existing) { existing.total_cost += d.total_cost; existing.total_tokens += d.total_tokens; }
    else acc.push({ ...d });
    return acc;
  }, [] as Array<{ date: string; total_cost: number; total_tokens: number }>);

  // Group by provider
  const byProvider = new Map<string, { cost: number; tokens: number; requests: number }>();
  for (const u of usage) {
    const key = u.provider;
    const entry = byProvider.get(key) ?? { cost: 0, tokens: 0, requests: 0 };
    entry.cost += Number(u._sum.costUsd ?? 0);
    entry.tokens += (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0);
    entry.requests += u._sum.requestsCount ?? 0;
    byProvider.set(key, entry);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Users", href: "/dashboard/users" }, { label: user.name }]} />

      {/* User header */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar name={user.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <Badge variant={user.status === "active" ? "success" : "warning"}>{user.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {user.jobTitle && <span className="text-xs text-muted-foreground">{user.jobTitle}</span>}
            {user.department && <Badge variant="outline">{user.department}</Badge>}
            {user.team && <Badge variant="outline">{user.team}</Badge>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Spend" value={formatCurrency(totalCost)} subtitle="Last 30 days" icon={DollarSign} />
        <StatCard title="Total Tokens" value={formatTokens(totalTokens)} icon={Zap} />
        <StatCard title="Requests" value={totalRequests.toLocaleString()} icon={Hash} />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "providers", label: "By Provider", count: byProvider.size },
          { id: "models", label: "By Model", count: usage.length },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === "overview" && (
        <Card>
          <CardHeader><CardTitle>Spend Over Time</CardTitle></CardHeader>
          <CardContent><SpendChart data={dailyAgg} /></CardContent>
        </Card>
      )}

      {tab === "providers" && (
        <Card>
          <CardHeader><CardTitle>Usage by Provider</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...byProvider.entries()].sort(([, a], [, b]) => b.cost - a.cost).map(([provider, stats]) => {
                const maxCost = Math.max(...[...byProvider.values()].map((v) => v.cost));
                const pct = maxCost > 0 ? (stats.cost / maxCost) * 100 : 0;
                return (
                  <div key={provider}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{PROVIDER_LABELS[provider] ?? provider}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-medium">{formatCurrency(stats.cost)}</span>
                        <span className="text-muted-foreground">{formatTokens(stats.tokens)} tokens</span>
                        <span className="text-muted-foreground">{stats.requests.toLocaleString()} reqs</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PROVIDER_COLORS[provider] ?? "#6b7280" }}
                      />
                    </div>
                  </div>
                );
              })}
              {byProvider.size === 0 && <p className="text-sm text-muted-foreground text-center py-4">No provider data</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "models" && (
        <Card>
          <CardHeader><CardTitle>Usage by Model</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Provider</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Model</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Input</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Output</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requests</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 text-sm">{PROVIDER_LABELS[u.provider] ?? u.provider}</td>
                    <td className="px-6 py-3 text-sm font-mono text-muted-foreground">{u.model ?? "—"}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(Number(u._sum.costUsd ?? 0))}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(u._sum.inputTokens ?? 0)}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(u._sum.outputTokens ?? 0)}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{(u._sum.requestsCount ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
                {usage.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">No usage data</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
