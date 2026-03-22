"use client";

import { Bell, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/dashboard-api";
import Link from "next/link";

interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
}

export function TopBar() {
  const [alerts, setAlerts] = useState<AlertSummary | null>(null);

  useEffect(() => {
    api.getAlerts()
      .then((d) => setAlerts(d.summary))
      .catch(() => {});
  }, []);

  const totalAlerts = alerts ? alerts.critical + alerts.warning : 0;

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div />
      <div className="flex items-center gap-3">
        {alerts && totalAlerts > 0 && (
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-semibold text-red-700">
              {alerts.critical > 0 && `${alerts.critical} critical`}
              {alerts.critical > 0 && alerts.warning > 0 && " · "}
              {alerts.warning > 0 && `${alerts.warning} warnings`}
            </span>
          </Link>
        )}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {totalAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
