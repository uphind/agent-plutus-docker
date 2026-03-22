"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/utils";

interface ProviderChartProps {
  data: Array<{
    provider: string;
    _sum: {
      costUsd: number | null;
      inputTokens: number | null;
      outputTokens: number | null;
    };
  }>;
}

export function ProviderChart({ data }: ProviderChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No provider data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: PROVIDER_LABELS[d.provider] ?? d.provider,
    provider: d.provider,
    cost: Number(d._sum.costUsd ?? 0),
    tokens: (d._sum.inputTokens ?? 0) + (d._sum.outputTokens ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
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
        <Bar dataKey="cost" radius={[4, 4, 0, 0]} name="Cost ($)">
          {chartData.map((entry) => (
            <Cell
              key={entry.provider}
              fill={PROVIDER_COLORS[entry.provider] ?? "#6b7280"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
