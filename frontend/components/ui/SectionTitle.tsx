import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span className="bc-section-title">{title}</span>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-bc-text-soft hover:text-bc-primary transition-colors"
        >
          {actionLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <span className="bc-section-title">{children}</span>;
}
