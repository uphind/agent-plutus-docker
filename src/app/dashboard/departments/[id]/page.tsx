"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusDot } from "@/components/ui/status-dot";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { BudgetDonut } from "@/components/charts/budget-donut";
import { SpendChart } from "@/components/charts/spend-chart";
import { SkeletonCard } from "@/components/ui/skeleton";
import { api } from "@/lib/dashboard-api";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { Settings2, Users, Layers } from "lucide-react";

interface TeamData {
  id: string; name: string; monthlyBudget: number | null; alertThreshold: number;
  userCount: number; currentSpend: number; totalTokens: number; totalRequests: number;
  budgetUsedPct: number | null; status: string;
}

interface UserData {
  user_id: string; name: string; email: string; team: string | null; total_cost: number; total_tokens: number;
}

interface DeptDetail {
  department: {
    id: string; name: string; monthlyBudget: number | null; alertThreshold: number;
    currentSpend: number; budgetUsedPct: number | null; status: string;
  };
  teams: TeamData[];
  users: UserData[];
  dailySpend: Array<{ date: string; total_cost: number }>;
}

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DeptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("80");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getDepartment(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      const budget = budgetInput.trim() ? parseFloat(budgetInput) : null;
      const threshold = parseInt(thresholdInput) || 80;
      await api.updateDepartmentBudget(id, budget, threshold);
      setBudgetModal(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (error && !data) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Departments", href: "/dashboard/departments" }, { label: "Error" }]} />
        <Card className="p-8 text-center"><p className="text-destructive">{error}</p></Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Departments", href: "/dashboard/departments" }, { label: "Loading..." }]} />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  const dept = data.department;

  return (
    <div>
      <Breadcrumb items={[{ label: "Departments", href: "/dashboard/departments" }, { label: dept.name }]} />

      <Header
        title={dept.name}
        description={`${data.teams.length} teams · ${data.users.length} users`}
        action={
          <Button variant="secondary" size="sm" onClick={() => {
            setBudgetInput(dept.monthlyBudget?.toString() ?? "");
            setThresholdInput(dept.alertThreshold?.toString() ?? "80");
            setBudgetModal(true);
          }}>
            <Settings2 className="h-3.5 w-3.5" />
            Configure Budget
          </Button>
        }
      />

      {/* Budget overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {dept.monthlyBudget !== null && (
          <Card className="p-5 flex items-center justify-center">
            <BudgetDonut spent={dept.currentSpend} budget={dept.monthlyBudget} size={140} label="Monthly Budget" />
          </Card>
        )}
        <Card className="p-5 col-span-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Current Spend</p>
          <p className="text-2xl font-bold">{formatCurrency(dept.currentSpend)}</p>
          {dept.monthlyBudget !== null && (
            <p className="text-xs text-muted-foreground mt-1">of {formatCurrency(dept.monthlyBudget)} budget</p>
          )}
          {dept.monthlyBudget !== null && (
            <ProgressBar value={dept.currentSpend} max={dept.monthlyBudget} alertThreshold={dept.alertThreshold} size="sm" className="mt-3" />
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Teams</p>
          <p className="text-2xl font-bold">{data.teams.length}</p>
          <div className="flex items-center gap-1 mt-1">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{data.teams.filter((t) => t.status === "over_budget").length} over budget</span>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Active Users</p>
          <p className="text-2xl font-bold">{data.users.length}</p>
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">in this department</span>
          </div>
        </Card>
      </div>

      {/* Spend trend */}
      {data.dailySpend.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Spend Trend (This Month)</CardTitle></CardHeader>
          <CardContent>
            <SpendChart data={data.dailySpend.map((d) => ({ ...d, total_tokens: 0 }))} />
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Team</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Users</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spend</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-48">Budget</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/teams/${t.id}`} className="text-sm font-medium hover:text-indigo-600 transition-colors">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-muted-foreground">{t.userCount}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(t.currentSpend)}</td>
                  <td className="px-6 py-3">
                    {t.monthlyBudget !== null ? (
                      <ProgressBar value={t.currentSpend} max={t.monthlyBudget} alertThreshold={t.alertThreshold} size="sm" showLabel />
                    ) : (
                      <span className="text-xs text-muted-foreground">No budget</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <StatusDot status={t.status as "healthy" | "warning" | "over_budget" | "no_budget"} withLabel />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Team</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spend</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/users/${u.user_id}`} className="flex items-center gap-3 hover:text-indigo-600 transition-colors">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{u.team ?? "—"}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(u.total_cost)}</td>
                  <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(u.total_tokens)}</td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">No users in this department</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Budget Modal */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Configure Department Budget">
        <div className="space-y-4">
          <Input
            label="Monthly Budget ($)"
            type="number"
            min={0}
            step={100}
            placeholder="e.g. 5000"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <Input
            label="Alert Threshold (%)"
            type="number"
            min={1}
            max={200}
            placeholder="80"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            You&apos;ll see a warning when spend reaches this percentage of the budget.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setBudgetModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveBudget} disabled={saving}>{saving ? "Saving..." : "Save Budget"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
