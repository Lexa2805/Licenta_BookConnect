import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  leftIcon?: ReactNode;
}

export function Pill({
  active,
  leftIcon,
  className = "",
  children,
  ...rest
}: PillProps) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium rounded-full transition-all duration-200 ease-bc-ease shadow-bc-xs border",
        active
          ? "text-bc-primary border-transparent font-semibold shadow-[0_2px_8px_-2px_var(--bc-border-glow)]"
          : "bg-bc-surface text-bc-text-soft border-bc-border hover:bg-bc-surface-2 hover:text-bc-text hover:-translate-y-0.5 hover:shadow-bc-sm hover:border-bc-border-strong",
        className,
      ].join(" ")}
      style={
        active
          ? {
              backgroundImage:
                "linear-gradient(135deg, var(--bc-primary-soft-strong), var(--bc-primary-soft))",
            }
          : undefined
      }
      {...rest}
    >
      {leftIcon && <span className="inline-flex">{leftIcon}</span>}
      {children}
    </button>
  );
}
