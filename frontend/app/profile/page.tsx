"use client";

import { useMemo, useState } from "react";
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Edit3, MapPin, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { libraryService, type ReadingCalendar as ReadingCalendarData, type UserLibraryEntry } from "@/lib/services/library";
import { canReadLibrary, getRoleLabel } from "@/lib/roles";

const SHELF_FILTERS = ["All", "Reading", "Finished", "Wishlist"] as const;
type ShelfFilter = (typeof SHELF_FILTERS)[number];

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const username = session?.user?.username || session?.user?.email?.split("@")[0] || "";
  const initials = username.substring(0, 2).toUpperCase();
  const showReadingStats = canReadLibrary(session?.user?.role);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>("All");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const { data: userLibrary = [], isLoading } = useQuery({
    queryKey: ["user-library", session?.user?.id],
    queryFn: () => libraryService.getUserLibrary(session!.user.id as string),
    enabled: !!session?.user?.id && showReadingStats,
  });

  const { data: readingCalendar, isLoading: loadingCalendar } = useQuery({
    queryKey: ["reading-calendar", session?.user?.id],
    queryFn: () => libraryService.getReadingCalendar(session!.user.id as string, 365),
    enabled: !!session?.user?.id && showReadingStats,
  });

  const visibleShelfBooks = useMemo(() => {
    if (shelfFilter === "Reading") return userLibrary.filter((entry) => entry.status === "READING");
    if (shelfFilter === "Finished") return userLibrary.filter((entry) => entry.status === "FINISHED");
    if (shelfFilter === "Wishlist") return userLibrary.filter((entry) => entry.is_favorite || entry.status === "WANT_TO_READ");
    return userLibrary;
  }, [shelfFilter, userLibrary]);
  const selectedShelfBook =
    visibleShelfBooks.find((entry) => String(entry.book.id) === selectedBookId) ??
    visibleShelfBooks[0];
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
          <div className="grid place-items-center w-24 h-24 rounded-full bg-bc-primary-grad text-white font-display text-3xl font-semibold shadow-bc-primary shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-[26px] font-semibold text-bc-text leading-tight">
              {username}
            </h2>
            <p className="text-bc-subtext text-[13.5px] mt-1 inline-flex items-center gap-1.5">
              <MapPin size={13} /> {session?.user?.email || "No email provided"}
            </p>
            <p className="text-bc-text-soft text-[14.5px] leading-relaxed mt-3 max-w-xl">
              {getRoleLabel(session?.user?.role)} on BookConnect.
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

      {/* Virtual library */}
      {showReadingStats && (
      <section>
        <SectionHeader title="Virtual library" />
        <VirtualLibrary
          books={visibleShelfBooks}
          allBooksCount={userLibrary.length}
          activeFilter={shelfFilter}
          selectedBook={selectedShelfBook}
          isLoading={isLoading}
          onFilterChange={(filter) => {
            setShelfFilter(filter);
            setSelectedBookId(null);
          }}
          onSelectBook={(entry) => setSelectedBookId(String(entry.book.id))}
          onOpenBook={(bookId) => router.push(`/books/${bookId}`)}
          onOpenReader={(bookId) => router.push(`/library/read/${bookId}`)}
        />
      </section>
      )}

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

function VirtualLibrary({
  books,
  allBooksCount,
  activeFilter,
  selectedBook,
  isLoading,
  onFilterChange,
  onSelectBook,
  onOpenBook,
  onOpenReader,
}: {
  books: UserLibraryEntry[];
  allBooksCount: number;
  activeFilter: ShelfFilter;
  selectedBook?: UserLibraryEntry;
  isLoading: boolean;
  onFilterChange: (filter: ShelfFilter) => void;
  onSelectBook: (entry: UserLibraryEntry) => void;
  onOpenBook: (bookId: string | number) => void;
  onOpenReader: (bookId: string | number) => void;
}) {
  return (
    <div className="mt-2 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-bc-text">
              {allBooksCount} book{allBooksCount === 1 ? "" : "s"} in your collection
            </div>
            <div className="mt-1 text-xs text-bc-subtext">
              Click a spine to inspect progress and jump back into the book.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SHELF_FILTERS.map((filter) => (
              <Pill
                key={filter}
                active={activeFilter === filter}
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </Pill>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center text-bc-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-bc-md border border-dashed border-bc-border bg-bc-surface-muted px-6 text-center">
            <div>
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-bc-subtext" />
              <p className="text-sm font-semibold text-bc-text">No books on this shelf yet</p>
              <p className="mt-1 text-sm text-bc-subtext">Add books from the Library to start filling it.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {chunkBooks(books, 12).map((row, rowIndex) => (
              <div key={rowIndex} className="relative pb-5">
                <div className="flex min-h-48 items-end gap-2 overflow-x-auto px-2 pt-3">
                  {row.map((entry, index) => {
                    const isSelected = selectedBook?.id === entry.id;
                    const progressPct = getProgressPct(entry);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectBook(entry)}
                        className={[
                          "group relative flex shrink-0 items-end justify-center rounded-t-[7px] border border-white/10 px-2 pb-3 pt-4 text-left shadow-bc-sm transition duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-bc-primary",
                          isSelected ? "-translate-y-2 ring-2 ring-bc-primary" : "",
                        ].join(" ")}
                        style={{
                          width: `${42 + (index % 4) * 7}px`,
                          height: `${132 + (index % 5) * 12}px`,
                          background: getSpineGradient(String(entry.book.id), index),
                        }}
                        title={`${entry.book.title} by ${entry.book.author}`}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-1 w-1.5 rounded-full bg-black/15"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-y-0 right-1 w-px bg-white/25"
                        />
                        {entry.is_favorite && (
                          <Bookmark className="absolute right-1.5 top-2 h-3.5 w-3.5 fill-white/80 text-white/80" />
                        )}
                        <span className="relative z-[1] max-h-[104px] -rotate-180 [writing-mode:vertical-rl] text-[11px] font-bold leading-none text-white drop-shadow line-clamp-1">
                          {entry.book.title}
                        </span>
                        {progressPct > 0 && (
                          <span className="absolute bottom-0 left-0 h-1 rounded-br-full bg-white/70" style={{ width: `${progressPct}%` }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-5 rounded-bc-md border border-bc-border bg-[linear-gradient(180deg,var(--bc-surface-muted),var(--bc-surface))] shadow-bc-sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
        {selectedBook ? (
          <div className="flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-bc-subtext">
                  Selected book
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-tight text-bc-text">
                  {selectedBook.book.title}
                </h3>
                <p className="mt-1 truncate text-sm text-bc-subtext">{selectedBook.book.author}</p>
              </div>
              <span className="shrink-0 rounded-full border border-bc-border bg-bc-surface-muted px-3 py-1 text-xs font-semibold text-bc-text-soft">
                {getStatusLabel(selectedBook)}
              </span>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-bc-subtext">
                <span>Progress</span>
                <span>{getProgressPct(selectedBook)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bc-surface-muted">
                <div
                  className="h-full rounded-full bg-bc-primary-grad"
                  style={{ width: `${getProgressPct(selectedBook)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-bc-subtext">
                Page {selectedBook.current_page || 0} of {selectedBook.book.pages || "?"}
              </div>
            </div>

            <p className="line-clamp-5 text-sm leading-6 text-bc-text-soft">
              {selectedBook.book.description?.trim() || "No description has been added for this book yet."}
            </p>

            <div className="mt-auto flex flex-col gap-2 pt-5">
              <Button
                fullWidth
                onClick={() => onOpenReader(selectedBook.book.id)}
                leftIcon={<BookOpen size={14} />}
              >
                Open reader
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onOpenBook(selectedBook.book.id)}
              >
                View details
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-72 place-items-center text-center">
            <div>
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-bc-subtext" />
              <p className="text-sm font-semibold text-bc-text">Choose a book spine</p>
              <p className="mt-1 text-sm text-bc-subtext">Its progress and quick actions will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
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

function chunkBooks(books: UserLibraryEntry[], size: number) {
  const rows: UserLibraryEntry[][] = [];
  for (let index = 0; index < books.length; index += size) {
    rows.push(books.slice(index, index + size));
  }
  return rows;
}

function getProgressPct(entry: UserLibraryEntry) {
  if (entry.status === "FINISHED") return 100;
  const pages = entry.book.pages || 0;
  if (!pages) return entry.current_page > 0 ? 1 : 0;
  return Math.min(100, Math.max(0, Math.round((entry.current_page / pages) * 100)));
}

function getStatusLabel(entry: UserLibraryEntry) {
  if (entry.status === "FINISHED") return "Finished";
  if (entry.status === "READING") return "Reading";
  if (entry.is_favorite) return "Wishlist";
  return "Saved";
}

function getSpineGradient(seed: string, index: number) {
  const palettes = [
    ["#1f4a3a", "#6b8f71"],
    ["#7a3f4f", "#c07a82"],
    ["#234f68", "#8bb7c9"],
    ["#8a5a24", "#d2a85f"],
    ["#3d355f", "#8d7ab8"],
    ["#6b2f35", "#c66f58"],
    ["#2f4d5c", "#77a3a3"],
  ];
  const value = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), index);
  const [from, to] = palettes[value % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
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
