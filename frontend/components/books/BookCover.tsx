import type { CSSProperties } from "react";

export interface BookCoverProps {
  title: string;
  author: string;
  gradient?: string;
  coverUrl?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function BookCover({
  title,
  author,
  gradient = "linear-gradient(135deg, #1B2638, #3B4860)",
  coverUrl,
  width = 140,
  height = 200,
  className = "",
  style,
}: BookCoverProps) {
  const small = typeof width === "number" && width < 120;
  return (
    <div
      className={[
        "relative overflow-hidden rounded-md flex flex-col items-center justify-center text-center",
        className,
      ].join(" ")}
      style={{
        width,
        height,
        background: coverUrl ? undefined : gradient,
        padding: coverUrl ? "0" : "18px 14px",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -8px 22px rgba(0,0,0,0.18), 0 14px 28px -10px rgba(20, 12, 6, 0.45), 0 6px 12px -6px rgba(20, 12, 6, 0.30)",
        ...style,
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-contain bg-bc-surface-muted"
        />
      ) : (
        <>
          <h3
            className="font-display text-white relative z-[2] m-0"
            style={{
              fontSize: small ? 14 : 18,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              textShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </h3>
          <p
            className="relative z-[2] m-0 mt-3 uppercase font-semibold"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: small ? 9 : 10.5,
              letterSpacing: "0.12em",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {author}
          </p>
        </>
      )}

      {/* spine */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 z-[1]"
        style={{
          left: 6,
          width: 6,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.18), transparent)",
        }}
      />
      {/* paper edge */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 right-0 z-[1]"
        style={{
          width: 3,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
        }}
      />
      {/* glossy highlight */}
      <span
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(0,0,0,0.10) 100%)",
        }}
      />
    </div>
  );
}
