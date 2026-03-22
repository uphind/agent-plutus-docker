"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  severity: "critical" | "warning" | "info";
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

const config = {
  critical: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    descColor: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    descColor: "text-amber-700",
  },
  info: {
    icon: Info,
    bg: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-600",
    titleColor: "text-sky-800",
    descColor: "text-sky-700",
  },
};

export function AlertBanner({ severity, title, description, className, action }: AlertBannerProps) {
  const c = config[severity];
  const Icon = c.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3.5", c.bg, className)}>
      <Icon className={cn("h-4.5 w-4.5 mt-0.5 shrink-0", c.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", c.titleColor)}>{title}</p>
        {description && <p className={cn("text-xs mt-0.5", c.descColor)}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
