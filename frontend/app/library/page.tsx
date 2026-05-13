"use client";

import { useMemo, useState } from "react";
import { Grid3x3, List, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Pill } from "@/components/ui/Pill";
import { BookCard } from "@/components/books/BookCard";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libraryService, type UserLibraryEntry } from "@/lib/services/library";

const FILTERS = [
  "All",
  "Reading",
  "Finished",
  "Wishlist",
] as const;

export default function LibraryPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const searchQuery = searchParams.get("search")?.trim() ?? "";

  const { data: allBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["all-books", searchQuery],
    queryFn: () => libraryService.getBooks(searchQuery ? { search: searchQuery } : undefined),
  });

  const { data: userLibrary = [], isLoading: loadingLibrary } = useQuery({
    queryKey: ["user-library", session?.user?.id],
    queryFn: () => libraryService.getUserLibrary(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const userEntryByBookId = useMemo(() => {
    return new Map<string, UserLibraryEntry>(userLibrary.map((e) => [String(e.book.id), e]));
  }, [userLibrary]);

  const toggleWishlistMutation = useMutation({
    mutationFn: async (bookId: string | number) => {
      const userId = session?.user?.id as string | undefined;
      if (!userId) throw new Error("Not authenticated");

      const existing = userEntryByBookId.get(String(bookId));
      if (existing) {
        return await libraryService.toggleFavorite(existing.id);
      }

      const created = await libraryService.addToLibrary(userId, bookId);
      if (created.is_favorite) return created;
      return await libraryService.toggleFavorite(created.id);
    },
    onSuccess: (updatedEntry) => {
      const userId = session?.user?.id;
      if (!userId) return;

      queryClient.setQueryData<UserLibraryEntry[]>(["user-library", userId], (prev) => {
        const prevList = prev ?? [];
        const idx = prevList.findIndex((e) => e.id === updatedEntry.id);
        if (idx === -1) return [updatedEntry, ...prevList];

        const next = prevList.slice();
        next[idx] = updatedEntry;
        return next;
      });
    },
  });

  const isLoading = loadingBooks || loadingLibrary;

  const getGradientSeed = (id: string | number) => {
    if (typeof id === "number") return id;
    return String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  };

  const getGradientForBook = (id: string | number) => {
    const gradients = [
      "linear-gradient(135deg, #1B2638, #3B4860)",
      "linear-gradient(135deg, #7C3F22, #B26845)",
      "linear-gradient(135deg, #1F4A3A, #3D7A60)",
      "linear-gradient(135deg, #BA9747, #D4B679)",
      "linear-gradient(135deg, #2D4C3B, #5A7B68)",
      "linear-gradient(135deg, #5C3A21, #8B5A33)",
      "linear-gradient(135deg, #4B2A3B, #7A4A5C)",
    ];
    return gradients[getGradientSeed(id) % gradients.length];
  };

  // Map backend status to UI filter
  let displayBooks: any[] = [];

  if (filter === "All") {
    // Show all available books from admin catalog
    displayBooks = allBooks.map(book => {
      // Check if user has this book in their library to show status badge
      const userEntry = userLibrary.find(entry => String(entry.book.id) === String(book.id));
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover || book.cover_url,
        status: userEntry?.status,
        isWishlisted: !!userEntry?.is_favorite,
        meta: `Added ${new Date(book.created_at).toLocaleDateString()}`
      };
    });
  } else {
    // Show only user's specific library entries based on filter
    displayBooks = userLibrary
      .filter((entry) => {
        if (filter === "Reading" && entry.status === "READING") return true;
        if (filter === "Finished" && entry.status === "FINISHED") return true;
        if (filter === "Wishlist" && entry.is_favorite) return true;
        return false;
      })
      .map(entry => ({
        id: entry.book.id,
        title: entry.book.title,
        author: entry.book.author,
        cover_url: entry.book.cover || entry.book.cover_url,
        status: entry.status,
        isWishlisted: entry.is_favorite,
        meta: entry.status === "READING"
          ? `Page ${entry.current_page} / ${entry.book.pages || '?'}`
          : entry.status === "FINISHED"
            ? `Finished`
            : `Added ${new Date(entry.added_at).toLocaleDateString()}`
      }));
  }

  const readingCount = userLibrary.filter(b => b.status === "READING").length;

  return (
    <PageLayout
      active="library"
      pageTitle="Your library"
      pageSubtitle={
        searchQuery
          ? `${allBooks.length} result${allBooks.length === 1 ? "" : "s"} for "${searchQuery}"`
          : `${allBooks.length} books available · ${readingCount} currently reading`
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Pill key={f} active={f === filter} onClick={() => setFilter(f as any)}>
              {f}
            </Pill>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Pill>Sort: Recently added</Pill>
          <div className="flex items-center bg-bc-surface border border-bc-border rounded-bc-md p-1 shadow-bc-xs">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setView("grid")}
              className={[
                "grid place-items-center w-8 h-8 rounded-[8px] transition-colors",
                view === "grid"
                  ? "bg-bc-primary-soft text-bc-primary"
                  : "text-bc-subtext hover:text-bc-text",
              ].join(" ")}
            >
              <Grid3x3 size={14} />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView("list")}
              className={[
                "grid place-items-center w-8 h-8 rounded-[8px] transition-colors",
                view === "list"
                  ? "bg-bc-primary-soft text-bc-primary"
                  : "text-bc-subtext hover:text-bc-text",
              ].join(" ")}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : displayBooks.length === 0 ? (
        <div className="grid place-items-center py-20 text-bc-subtext">
          <p>No books found in this category.</p>
        </div>
      ) : (
        <div className="bc-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              gradient={book.cover_url ? undefined : getGradientForBook(book.id)}
              coverUrl={book.cover_url}
              badge={book.status === "FINISHED" ? "Finished" : undefined}
              meta={book.meta}
              isWishlisted={!!(userEntryByBookId.get(String(book.id))?.is_favorite ?? book.isWishlisted)}
              onToggleWishlist={
                session?.user?.id
                  ? () => toggleWishlistMutation.mutate(book.id)
                  : undefined
              }
              href={`/books/${book.id}`}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
