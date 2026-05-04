import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 font-semibold tracking-tight rounded-bc-md whitespace-nowrap overflow-hidden isolate transition-all duration-300 ease-bc-ease border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bc-bg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-bc-primary-grad bg-[length:180%_180%] bg-[position:0%_50%] hover:bg-[position:100%_50%] text-white border-white/10 shadow-bc-primary hover:shadow-bc-primary-hover hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-bc-surface text-bc-text border-bc-border-strong shadow-bc-sm hover:bg-bc-surface-2 hover:border-bc-primary hover:text-bc-primary hover:-translate-y-0.5 hover:shadow-bc-md",
  ghost:
    "bg-transparent text-bc-text-soft border-transparent hover:bg-bc-surface-muted hover:text-bc-text",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leftIcon,
    rightIcon,
    fullWidth,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const showShine = variant === "primary";
  return (
    <button
      ref={ref}
      className={[
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span className="relative z-10">{children}</span>
      {rightIcon && (
        <span className="inline-flex shrink-0 transition-transform duration-300 ease-bc-ease group-hover:translate-x-1">
          {rightIcon}
        </span>
      )}
      {showShine && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-[120%] w-3/5 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-[left] duration-700 ease-bc-ease group-hover:left-[130%]"
        />
      )}
    </button>
  );
});
