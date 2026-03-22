"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusDot } from "@/components/ui/status-dot";
import { SkeletonCard } from "@/components/ui/skeleton";
import { api } from "@/lib/dashboard-api";
import { formatCurrency, formatTokens, formatNumber } from "@/lib/utils";
import { Building2, Users, Layers } from "lucide-react";

interface DeptData {
  id: string;
  name: string;
  monthlyBudget: number | null;
  alertThreshold: number;
  teamCount: number;
  userCount: number;
  currentSpend: number;
  totalTokens: number;
  totalRequests: number;
  budgetUsedPct: number | null;
  status: "healthy" | "warning" | "over_budget" | "no_budget";
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DeptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments()
      .then((d) => setDepartments(d.departments ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div>
        <Header title="Departments" />
        <Card className="p-8 text-center">
          <p className="text-destructive">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Departments"
        description="Organizational departments with budget tracking"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No departments yet. Sync your user directory to create departments automatically.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Link key={dept.id} href={`/dashboard/departments/${dept.id}`}>
              <Card hoverable className="p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Building2 className="h-4.5 w-4.5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{dept.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusDot status={dept.status} />
                        <span className="text-[11px] text-muted-foreground">
                          {dept.status === "over_budget" ? "Over budget" : dept.status === "warning" ? "Approaching limit" : dept.status === "no_budget" ? "No budget set" : "On track"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {dept.status === "over_budget" && <Badge variant="critical">Over Budget</Badge>}
                  {dept.status === "warning" && <Badge variant="warning">Warning</Badge>}
                </div>

                {/* Budget bar */}
                {dept.monthlyBudget !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {formatCurrency(dept.currentSpend)} of {formatCurrency(dept.monthlyBudget)}
                      </span>
                    </div>
                    <ProgressBar
                      value={dept.currentSpend}
                      max={dept.monthlyBudget}
                      alertThreshold={dept.alertThreshold}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Layers className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wider">Teams</span>
                    </div>
                    <p className="text-sm font-semibold">{dept.teamCount}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Users className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wider">Users</span>
                    </div>
                    <p className="text-sm font-semibold">{dept.userCount}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens</span>
                    <p className="text-sm font-semibold">{formatTokens(dept.totalTokens)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
