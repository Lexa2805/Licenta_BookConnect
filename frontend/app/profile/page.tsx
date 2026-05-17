"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, MapPin, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { libraryService, type ReadingCalendar as ReadingCalendarData } from "@/lib/services/library";
import { userService } from "@/lib/services/users";
import { canReadLibrary, getRoleLabel } from "@/lib/roles";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    enabled: !!session?.user?.id,
  });

  const username = profile?.username || session?.user?.username || session?.user?.email?.split("@")[0] || "";
  const email = profile?.email || session?.user?.email || "";
  const avatarUrl = profile?.profile?.avatar_url || "";
  const about = profile?.profile?.about || "";
  const initials = username.substring(0, 2).toUpperCase();
  const showReadingStats = canReadLibrary(session?.user?.role);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const { data: readingCalendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ["reading-calendar", session?.user?.id],
    queryFn: () => libraryService.getReadingCalendar(session!.user.id as string, 365),
    enabled: !!session?.user?.id && showReadingStats,
  });

  return (
    <PageLayout
      active="profile"
      pageTitle="Profile"
      pageSubtitle={
        showReadingStats
          ? "Your reading life, gathered in one place."
          : "Your writer account details, gathered in one place."
      }
      headerActions={
        <Button
          variant="secondary"
          leftIcon={<Edit3 size={14} />}
          onClick={() => router.push("/settings")}
        >
          Edit profile
        </Button>
      }
    >
      {/* Identity card */}
      <section className="bc-card p-6 sm:p-8 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-bc-primary-grad opacity-10 blur-3xl pointer-events-none"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="grid place-items-center w-24 h-24 overflow-hidden rounded-full bg-bc-primary-grad text-white font-display text-3xl font-semibold shadow-bc-primary shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-[26px] font-semibold text-bc-text leading-tight">
              {username}
            </h2>
            <p className="text-bc-subtext text-[13.5px] mt-1 inline-flex items-center gap-1.5">
              <MapPin size={13} /> {email || "No email provided"}
            </p>
            <p className="text-bc-text-soft text-[14.5px] leading-relaxed mt-3 max-w-xl">
              {about || `${getRoleLabel(session?.user?.role)} on BookConnect.`}
            </p>
          </div>
        </div>
        <div className="relative rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
          <div className="font-display text-4xl font-semibold leading-none text-bc-primary">
            &rdquo;
          </div>
          <p className="mt-3 font-display text-[21px] italic leading-snug text-bc-text">
            &ldquo;Memory is a wilderness &mdash; once you let yourself in, you may
            wander a long time before finding your way out.&rdquo;
          </p>
          <div className="mt-4 text-[13px] text-bc-subtext">
            from <em>Norwegian Wood</em>
          </div>
        </div>
      </section>

      {/* Activity heatmap */}
      {showReadingStats && (
      <section>
        <SectionHeader title="Reading calendar" />
        <div className="bc-card p-6 overflow-x-auto mt-2">
          <ProfileReadingCalendar
            data={readingCalendar}
            isLoading={loadingCalendar}
            visibleMonth={visibleMonth}
            onMonthChange={setVisibleMonth}
          />
        </div>
      </section>
      )}
    </PageLayout>
  );
}

function ProfileReadingCalendar({
  data,
  isLoading,
  visibleMonth,
  onMonthChange,
}: {
  data?: ReadingCalendarData;
  isLoading: boolean;
  visibleMonth: Date;
  onMonthChange: (month: Date) => void;
}) {
  const daysByDate = useMemo(() => {
    return new Map((data?.days ?? []).map((day) => [day.date, day]));
  }, [data?.days]);

  const monthCells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const activeDaysThisMonth = monthCells.filter((day) => day && daysByDate.has(toDateKey(day)));
  const pagesThisMonth = activeDaysThisMonth.reduce((sum, day) => {
    if (!day) return sum;
    return sum + (daysByDate.get(toDateKey(day))?.pages_read ?? 0);
  }, 0);
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-w-[680px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-display text-2xl font-semibold text-bc-text">{monthLabel}</div>
          <div className="mt-1 text-sm text-bc-subtext">
            {pagesThisMonth.toLocaleString()} pages across {activeDaysThisMonth.length} active day{activeDaysThisMonth.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
            className="grid h-9 w-9 place-items-center rounded-bc-md border border-bc-border bg-bc-surface text-bc-text-soft transition hover:border-bc-primary hover:text-bc-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
            className="grid h-9 w-9 place-items-center rounded-bc-md border border-bc-border bg-bc-surface text-bc-text-soft transition hover:border-bc-primary hover:text-bc-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-bc-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <div key={dayName} className="px-2 pb-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-bc-subtext">
              {dayName}
            </div>
          ))}
          {monthCells.map((day, index) => {
            const dateKey = day ? toDateKey(day) : "";
            const activity = day ? daysByDate.get(dateKey) : undefined;
            const pagesRead = activity?.pages_read ?? 0;

            return (
              <div
                key={day ? dateKey : `empty-${index}`}
                title={day ? buildDayTitle(day, pagesRead, activity?.sessions ?? 0) : undefined}
                className={[
                  "min-h-24 rounded-bc-md border p-3 transition",
                  day
                    ? "border-bc-border bg-bc-surface"
                    : "border-transparent bg-transparent",
                  pagesRead > 0 ? "shadow-bc-sm" : "",
                ].join(" ")}
              >
                {day && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-bc-text">{day.getDate()}</span>
                      {pagesRead > 0 && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: getActivityColor(pagesRead) }}
                        />
                      )}
                    </div>
                    <div className="mt-auto">
                      {pagesRead > 0 ? (
                        <>
                          <div className="font-display text-xl font-semibold text-bc-text">
                            {pagesRead}
                          </div>
                          <div className="text-[11px] font-medium text-bc-subtext">
                            page{pagesRead === 1 ? "" : "s"}
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-bc-subtext">No pages</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Active days", data?.active_days ?? 0],
          ["Tracked pages", data?.total_pages ?? 0],
          ["Sessions", data?.total_sessions ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-bc-subtext">{label}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-bc-text">
              {Number(value).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarCells(month: Date) {
  const firstDay = startOfMonth(month);
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getActivityColor(pagesRead: number) {
  if (pagesRead >= 50) return "var(--bc-primary)";
  if (pagesRead >= 25) return "rgba(196, 106, 43, 0.75)";
  if (pagesRead >= 10) return "rgba(196, 106, 43, 0.5)";
  return "rgba(196, 106, 43, 0.28)";
}

function buildDayTitle(day: Date, pagesRead: number, sessions: number) {
  const label = day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${label}: ${pagesRead} page${pagesRead === 1 ? "" : "s"} read in ${sessions} session${sessions === 1 ? "" : "s"}`;
}
