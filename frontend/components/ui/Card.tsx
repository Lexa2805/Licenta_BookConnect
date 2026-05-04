import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  elevated?: boolean;
  padded?: boolean;
  children: ReactNode;
}

export function Card({
  hover,
  elevated,
  padded = true,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "bc-card",
        elevated ? "shadow-bc-md" : "",
        hover ? "bc-card-hover" : "",
        padded ? "p-5" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
