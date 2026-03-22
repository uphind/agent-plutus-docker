"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BudgetDonutProps {
  spent: number;
  budget: number;
  size?: number;
  label?: string;
}

export function BudgetDonut({ spent, budget, size = 160, label }: BudgetDonutProps) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = Math.max(100 - pct, 0);
  const overBudget = spent > budget;

  const data = [
    { name: "Spent", value: pct },
    { name: "Remaining", value: remaining },
  ];

  const fillColor = overBudget ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill={fillColor} />
              <Cell fill="#f3f4f6" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{Math.round(pct)}%</span>
          <span className="text-[10px] text-muted-foreground">used</span>
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}
