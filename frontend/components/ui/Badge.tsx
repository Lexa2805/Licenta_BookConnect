import type { ReactNode } from "react";

type Variant = "default" | "primary" | "soft" | "success" | "warning";

const variants: Record<Variant, string> = {
  default:
    "bg-bc-surface text-bc-text-soft border-bc-border shadow-bc-xs",
  primary:
    "bg-bc-primary-grad text-white border-transparent shadow-[0_4px_10px_-4px_var(--bc-primary-glow)]",
  soft:
    "bg-bc-primary-soft text-bc-primary border-transparent",
  success:
    "bg-[var(--bc-success)]/15 text-bc-success border-transparent",
  warning:
    "bg-[var(--bc-warning)]/15 text-bc-warning border-transparent",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-full border",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
