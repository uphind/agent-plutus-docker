import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "healthy" | "warning" | "over_budget" | "no_budget";
  className?: string;
  withLabel?: boolean;
}

const STATUS_CONFIG = {
  healthy: { color: "bg-emerald-500", label: "Healthy" },
  warning: { color: "bg-amber-500", label: "Warning" },
  over_budget: { color: "bg-red-500", label: "Over Budget" },
  no_budget: { color: "bg-gray-300", label: "No Budget" },
};

export function StatusDot({ status, className, withLabel }: StatusDotProps) {
  const conf = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", conf.color, status === "over_budget" && "animate-pulse")} />
      {withLabel && <span className="text-xs text-muted-foreground">{conf.label}</span>}
    </span>
  );
}
