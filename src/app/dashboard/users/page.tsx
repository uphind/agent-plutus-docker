"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonTable } from "@/components/ui/skeleton";
import { api } from "@/lib/dashboard-api";
import { formatCurrency, formatTokens, formatNumber } from "@/lib/utils";
import { Search, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";

interface UserRow {
  user_id: string; name: string; email: string;
  department: string | null; team: string | null;
  total_cost: number; total_tokens: number; total_requests: number;
}

type SortField = "name" | "total_cost" | "total_tokens" | "department";
type SortDir = "asc" | "desc";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_cost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const perPage = 15;

  useEffect(() => {
    setLoading(true);
    api.getByUser(days)
      .then((d) => setUsers(d.users ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q) || (u.team ?? "").toLowerCase().includes(q);
  });

  // Anomaly detection: users spending >2x average
  const avgCost = filtered.length > 0 ? filtered.reduce((s, u) => s + u.total_cost, 0) / filtered.length : 0;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") cmp = a.name.localeCompare(b.name);
    else if (sortField === "department") cmp = (a.department ?? "").localeCompare(b.department ?? "");
    else if (sortField === "total_cost") cmp = a.total_cost - b.total_cost;
    else cmp = a.total_tokens - b.total_tokens;
    return sortDir === "desc" ? -cmp : cmp;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  if (error) {
    return (
      <div>
        <Header title="Users" />
        <Card className="p-8 text-center"><p className="text-destructive">{error}</p></Card>
      </div>
    );
  }

  return (
    <div>
      <Header title="Users" description={`${filtered.length} users with AI usage data`} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, departments, teams..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value))}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {([
                    ["name", "User"],
                    ["department", "Department / Team"],
                    ["total_cost", "Spend"],
                    ["total_tokens", "Tokens"],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors ${field === "total_cost" || field === "total_tokens" ? "text-right" : "text-left"}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label} <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requests</th>
                  <th className="px-6 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => {
                  const isAnomaly = avgCost > 0 && user.total_cost > avgCost * 2;
                  return (
                    <tr key={user.user_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/users/${user.user_id}`} className="flex items-center gap-3 hover:text-indigo-600 transition-colors">
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {user.department && <Badge variant="outline">{user.department}</Badge>}
                          {user.team && <span className="text-xs text-muted-foreground">{user.team}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium">{formatCurrency(user.total_cost)}</td>
                      <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatTokens(user.total_tokens)}</td>
                      <td className="px-6 py-3 text-right text-sm text-muted-foreground">{formatNumber(user.total_requests)}</td>
                      <td className="px-6 py-3 text-center">
                        {isAnomaly && (
                          <span title={`${(user.total_cost / avgCost).toFixed(1)}x average spend`}>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-7 w-7 rounded text-xs font-medium transition-colors ${page === i ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
