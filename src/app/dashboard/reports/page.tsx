"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { api } from "@/lib/dashboard-api";
import { formatCurrency, formatTokens, formatNumber, PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/utils";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar, Target } from "lucide-react";

interface CostSummary {
  period: { month: number; year: number; dayOfMonth: number; daysInMonth: number };
  byDepartment: Array<{
    departmentId: string; department: string; currentSpend: number; previousSpend: number;
    change: number | null; budget: number | null; totalTokens: number; totalRequests: number;
  }>;
  byProvider: Array<{
    provider: string; currentSpend: number; previousSpend: number; change: number | null;
    totalTokens: number; totalRequests: number; costPerRequest: number;
  }>;
  forecast: { currentSpend: number; dailyRate: number; projectedMonthEnd: number; daysRemaining: number };
}

interface AlertData {
  type: string; severity: "critical" | "warning" | "info";
  title: string; description: string; entityType: string; entityId: string; entityName: string;
}

export default function ReportsPage() {
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("cost");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCostSummary(),
      api.getAlerts().catch(() => ({ alerts: [], summary: {} })),
    ])
      .then(([cost, alertsData]) => {
        setCostData(cost);
        setAlerts(alertsData.alerts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (days: number) => {
    setExporting(true);
    try {
      await api.exportCsv(days);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (error && !costData) {
    return (
      <div>
        <Header title="Reports" />
        <Card className="p-8 text-center"><p className="text-destructive">{error}</p></Card>
      </div>
    );
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div>
      <Header
        title="Reports"
        description="Cost analysis, budget variance, and usage insights"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleExport(30)} disabled={exporting}>
              <Download className="h-3.5 w-3.5" />
              Export 30d CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport(90)} disabled={exporting}>
              <Download className="h-3.5 w-3.5" />
              Export 90d CSV
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: "cost", label: "Cost Summary" },
          { id: "providers", label: "Provider Comparison" },
          { id: "alerts", label: "Alerts", count: alerts.length },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          <SkeletonTable />
        </div>
      ) : costData && tab === "cost" ? (
        <>
          {/* Forecast KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Current Month Spend"
              value={formatCurrency(costData.forecast.currentSpend)}
              subtitle={`${monthNames[costData.period.month - 1]} ${costData.period.year}`}
              icon={DollarSign}
            />
            <StatCard
              title="Daily Burn Rate"
              value={formatCurrency(costData.forecast.dailyRate)}
              subtitle="per day average"
              icon={TrendingUp}
            />
            <StatCard
              title="Projected Month-End"
              value={formatCurrency(costData.forecast.projectedMonthEnd)}
              subtitle={`${costData.forecast.daysRemaining} days remaining`}
              icon={Target}
            />
            <StatCard
              title="Day of Month"
              value={`${costData.period.dayOfMonth} / ${costData.period.daysInMonth}`}
              subtitle={`${Math.round((costData.period.dayOfMonth / costData.period.daysInMonth) * 100)}% through`}
              icon={Calendar}
            />
          </div>

          {/* Cost by department */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cost by Department (This Month)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Previous</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Change</th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-48">Budget</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.byDepartment.map((d) => {
                    const budgetPct = d.budget && d.budget > 0 ? (d.currentSpend / d.budget) * 100 : null;
                    return (
                      <tr key={d.department} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium">{d.department}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(d.currentSpend)}</td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatCurrency(d.previousSpend)}</td>
                        <td className="px-6 py-3 text-right">
                          {d.change !== null ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.change > 0 ? "text-red-600" : d.change < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                              {d.change > 0 ? <TrendingUp className="h-3 w-3" /> : d.change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                              {d.change > 0 ? "+" : ""}{d.change.toFixed(0)}%
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          {d.budget !== null ? (
                            <ProgressBar value={d.currentSpend} max={d.budget} size="sm" showLabel />
                          ) : (
                            <span className="text-xs text-muted-foreground">No budget</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(d.totalTokens)}</td>
                      </tr>
                    );
                  })}
                  {costData.byDepartment.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">No department data</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}

      {costData && tab === "providers" && (
        <Card>
          <CardHeader><CardTitle>Provider Comparison (This Month vs Previous)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Provider</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Previous</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Change</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tokens</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requests</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">$/Request</th>
                </tr>
              </thead>
              <tbody>
                {costData.byProvider.map((p) => (
                  <tr key={p.provider} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.provider] ?? "#6b7280" }} />
                        <span className="text-sm font-medium">{PROVIDER_LABELS[p.provider] ?? p.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(p.currentSpend)}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatCurrency(p.previousSpend)}</td>
                    <td className="px-6 py-3 text-right">
                      {p.change !== null ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.change > 0 ? "text-red-600" : p.change < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {p.change > 0 ? "+" : ""}{p.change.toFixed(0)}%
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(p.totalTokens)}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatNumber(p.totalRequests)}</td>
                    <td className="px-6 py-3 text-right text-sm text-muted-foreground">{p.costPerRequest > 0 ? `$${p.costPerRequest.toFixed(4)}` : "—"}</td>
                  </tr>
                ))}
                {costData.byProvider.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">No provider data</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No alerts. Everything looks good!</p>
            </Card>
          ) : (
            alerts.map((alert, i) => (
              <AlertBanner key={i} severity={alert.severity} title={alert.title} description={alert.description} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
