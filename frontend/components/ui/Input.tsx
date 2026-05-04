import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-10 text-[13px]",
  md: "h-12 text-sm",
  lg: "h-14 text-[15px]",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, rightSlot, inputSize = "md", className = "", ...rest },
  ref,
) {
  return (
    <div
      className={[
        "group relative flex items-center w-full rounded-bc-md bg-bc-surface border border-bc-border shadow-bc-xs transition-all duration-200 ease-bc-ease",
        "hover:border-bc-border-strong",
        "focus-within:border-bc-primary focus-within:shadow-bc-glow",
        sizeClasses[inputSize],
        className,
      ].join(" ")}
    >
      {leftIcon && (
        <span className="pl-4 pr-2 text-bc-subtext shrink-0 inline-flex">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        {...rest}
        className={[
          "flex-1 h-full bg-transparent outline-none text-bc-text placeholder:text-bc-subtext",
          leftIcon ? "pr-4" : "px-4",
        ].join(" ")}
      />
      {rightSlot && (
        <span className="pr-2 pl-2 shrink-0 inline-flex items-center">
          {rightSlot}
        </span>
      )}
    </div>
  );
});
