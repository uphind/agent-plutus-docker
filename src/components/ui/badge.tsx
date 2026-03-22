import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline" | "info" | "critical";
}

const variantStyles: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  outline: "border border-border text-foreground",
  info: "bg-sky-100 text-sky-800",
  critical: "bg-red-100 text-red-700 animate-pulse",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
