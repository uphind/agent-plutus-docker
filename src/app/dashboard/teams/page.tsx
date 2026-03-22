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
import { formatCurrency, formatTokens } from "@/lib/utils";
import { UsersRound, Users } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  department: { id: string; name: string };
  monthlyBudget: number | null;
  alertThreshold: number;
  userCount: number;
  currentSpend: number;
  totalTokens: number;
  budgetUsedPct: number | null;
  status: "healthy" | "warning" | "over_budget" | "no_budget";
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTeams()
      .then((d) => setTeams(d.teams ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div>
        <Header title="Teams" />
        <Card className="p-8 text-center"><p className="text-destructive">{error}</p></Card>
      </div>
    );
  }

  return (
    <div>
      <Header title="Teams" description="All teams across departments with budget tracking" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : teams.length === 0 ? (
        <Card className="p-12 text-center">
          <UsersRound className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No teams yet. Sync your user directory to create teams automatically.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card hoverable className="p-5 h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
                      <UsersRound className="h-4.5 w-4.5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{team.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{team.department.name}</p>
                    </div>
                  </div>
                  <StatusDot status={team.status} />
                </div>

                {team.monthlyBudget !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {formatCurrency(team.currentSpend)} / {formatCurrency(team.monthlyBudget)}
                      </span>
                    </div>
                    <ProgressBar value={team.currentSpend} max={team.monthlyBudget} alertThreshold={team.alertThreshold} size="sm" showLabel={false} />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{team.userCount} users</span>
                  </div>
                  <span className="text-xs font-medium">{formatCurrency(team.currentSpend)}</span>
                  <span className="text-xs text-muted-foreground">{formatTokens(team.totalTokens)} tokens</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
