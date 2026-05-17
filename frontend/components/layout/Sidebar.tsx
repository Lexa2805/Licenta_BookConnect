"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { NAV_ITEMS, type NavKey } from "@/lib/nav";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { libraryService } from "@/lib/services/library";
import { canReadLibrary, hasCapability } from "@/lib/roles";

export function Sidebar({ active }: { active: NavKey }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const showReadingWidgets = canReadLibrary(userRole);

  const { data: streak } = useQuery({
    queryKey: ["reading-streak", session?.user?.id],
    queryFn: () => libraryService.getReadingStreak(session!.user.id as string),
    enabled: !!session?.user?.id && showReadingWidgets,
    staleTime: 60_000,
  });

  const streakDays = streak?.streak_days ?? 0;
  const streakLabel = session?.user?.id
    ? `${streakDays} day${streakDays === 1 ? "" : "s"} · keep it going`
    : "Log in to track your streak";

  const progressPct = Math.min(100, Math.round((streakDays / 30) * 100));

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 px-5 py-6 border-r border-bc-border bg-bc-bg">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-10 h-10 rounded-bc-md bg-bc-primary-grad grid place-items-center text-white shadow-bc-primary group-hover:scale-105 transition-transform duration-300 ease-bc-ease">
          <BookGlyph />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[18px] font-bold text-bc-text">
            BookConnect
          </div>
          <div className="text-[11px] text-bc-subtext tracking-wide">
            Read · Trade · Belong
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.filter((item) => hasCapability(userRole, item.requiredCapability)).map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 h-11 rounded-bc-md text-[14px] font-medium transition-all duration-200 ease-bc-ease",
                isActive
                  ? "bg-bc-primary-soft text-bc-primary font-semibold"
                  : "text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text",
              ].join(" ")}
            >
              <item.Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Streak */}
      {showReadingWidgets && (
        <div className="mt-auto bc-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-bc-warning" />
            <span className="text-[13px] font-semibold text-bc-text">
              Reading streak
            </span>
          </div>
          <div className="text-[11.5px] text-bc-subtext mb-3">{streakLabel}</div>
          <div className="h-1.5 bg-bc-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-bc-primary-grad rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function BookGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
