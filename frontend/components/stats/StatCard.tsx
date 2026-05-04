import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  trendColor?: "success" | "warning" | "danger" | "muted";
  Icon: LucideIcon;
  accent?: string;
}

const trendColorClasses = {
  success: "text-bc-success",
  warning: "text-bc-warning",
  danger: "text-bc-danger",
  muted: "text-bc-subtext",
};

export function StatCard({
  label,
  value,
  trend,
  trendColor = "muted",
  Icon,
  accent = "var(--bc-primary)",
}: StatCardProps) {
  return (
    <div className="bc-card bc-card-hover relative overflow-hidden p-5 sm:p-6">
      {/* accent corner blur */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-bc-subtext">
          {label}
        </div>
        <div className="grid place-items-center w-8 h-8 rounded-[10px] bg-bc-primary-soft text-bc-primary">
          <Icon size={15} strokeWidth={2.2} />
        </div>
      </div>
      <div className="relative font-display text-[2.25rem] leading-none font-semibold text-bc-text mb-1.5 tracking-tight">
        {value}
      </div>
      {trend && (
        <div
          className={[
            "relative flex items-center gap-1 text-xs font-medium",
            trendColorClasses[trendColor],
          ].join(" ")}
        >
          {trend}
        </div>
      )}
    </div>
  );
}
