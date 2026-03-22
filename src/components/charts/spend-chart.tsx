"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpendChartProps {
  data: Array<{ date: string; total_cost: number; total_tokens: number }>;
}

export function SpendChart({ data }: SpendChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="total_cost"
          stroke="#6366f1"
          fillOpacity={1}
          fill="url(#costGrad)"
          strokeWidth={2}
          name="Cost ($)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
