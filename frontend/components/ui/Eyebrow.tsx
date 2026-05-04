import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
  withDot = true,
}: {
  children: ReactNode;
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full bg-bc-surface-glass backdrop-blur border border-bc-border text-[11.5px] font-bold tracking-[0.06em] uppercase text-bc-primary shadow-bc-sm",
        className,
      ].join(" ")}
    >
      {withDot && (
        <span className="w-[7px] h-[7px] rounded-full bg-bc-primary animate-bc-pulse-glow" />
      )}
      {children}
    </span>
  );
}
