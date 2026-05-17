"use client";

import { useMemo } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { SectionHeader } from "../ui/SectionTitle";
import { libraryService, type ReadingCalendarDay } from "@/lib/services/library";

const DAY_COUNT = 35;

export function ReadingCalendarMini() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["home-reading-calendar", session?.user?.id],
    queryFn: () => libraryService.getReadingCalendar(session!.user.id as string, DAY_COUNT),
    enabled: !!session?.user?.id,
  });

  const days = useMemo(() => buildRecentDays(DAY_COUNT), []);
  const daysByDate = useMemo(() => {
    return new Map((data?.days ?? []).map((day) => [day.date, day]));
  }, [data?.days]);

  const activeDays = days.reduce((count, day) => count + (daysByDate.has(toDateKey(day)) ? 1 : 0), 0);
  const totalPages = days.reduce((sum, day) => {
    return sum + (daysByDate.get(toDateKey(day))?.pages_read ?? 0);
  }, 0);

  return (
    <section>
      <SectionHeader
        title="Reading calendar"
        actionLabel="Profile"
        actionHref="/profile"
      />
      <div className="bc-card p-5">
        {isLoading ? (
          <div className="grid min-h-44 place-items-center text-bc-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !session?.user?.id ? (
          <div className="grid min-h-44 place-items-center text-center text-sm text-bc-subtext">
            Log in to track your reading days.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="rounded-bc-lg border border-bc-border bg-bc-surface-muted p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bc-text">
                <CalendarDays size={16} className="text-bc-primary" />
                Last 5 weeks
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                  const key = toDateKey(day);
                  const activity = daysByDate.get(key);
                  const pages = activity?.pages_read ?? 0;
                  return (
                    <div
                      key={key}
                      title={buildDayTitle(day, activity)}
                      className="grid h-9 w-9 place-items-center rounded-bc-md border border-bc-border text-[11px] font-semibold text-bc-text-soft"
                      style={{
                        background: getActivityColor(pages),
                        borderColor: pages > 0 ? "rgba(196, 106, 43, 0.25)" : undefined,
                      }}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CalendarStat label="Active days" value={activeDays} />
              <CalendarStat label="Pages read" value={totalPages} />
              <CalendarStat label="Sessions" value={data?.total_sessions ?? 0} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CalendarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-bc-subtext">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold text-bc-text">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function buildRecentDays(count: number) {
  const today = new Date();
  const days: Date[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset));
  }
  return days;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActivityColor(pagesRead: number) {
  if (pagesRead >= 50) return "rgba(196, 106, 43, 0.88)";
  if (pagesRead >= 25) return "rgba(196, 106, 43, 0.62)";
  if (pagesRead >= 10) return "rgba(196, 106, 43, 0.38)";
  if (pagesRead > 0) return "rgba(196, 106, 43, 0.2)";
  return "var(--bc-surface)";
}

function buildDayTitle(day: Date, activity?: ReadingCalendarDay) {
  const label = day.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const pages = activity?.pages_read ?? 0;
  const sessions = activity?.sessions ?? 0;
  return `${label}: ${pages} page${pages === 1 ? "" : "s"} in ${sessions} session${sessions === 1 ? "" : "s"}`;
}
