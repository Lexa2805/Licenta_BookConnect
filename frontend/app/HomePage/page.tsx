"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTheme } from "../theme-provider";

type Price = {
  amount: number;
  currency: string;
};

type Book = {
  id: string;
  title: string;
  authors: string[];
  genres: string[];
  cover_url?: string | null;
  is_free: boolean;
  price?: Price | null;
};

type HomeData = {
  latest: Book[];
  free: Book[];
  genres: string[];
};

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<HomeData>({
    latest: [],
    free: [],
    genres: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/home-data/")
      .then((res) => {
        setData(res.data);
      })
      .catch((e) => {
        setErr("Could not load books. Make sure the backend server is running on http://127.0.0.1:8000");
        console.error("API Error:", e.message);
        console.error("Check if Django server is running: python manage.py runserver");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
        <p className="text-gray-800 dark:text-amber-100">Loading...</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 p-6">
        <div className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-xl border border-red-200 dark:border-red-500/50 rounded-xl p-6 max-w-lg">
          <p className="text-red-600 dark:text-red-300">{err}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
      <section className="max-w-6xl mx-auto px-4 md:px-0 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-orange-400 flex items-center gap-2">
              Welcome to BookConnect
              <span className="text-2xl">📚</span>
            </h1>
            <p className="text-gray-600 dark:text-orange-300 mt-2 max-w-2xl">
              Discover and explore amazing books
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-800/30 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            {data.latest.length} new books available 📚
          </div>
        </div>

        {/* GENRES */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-orange-300 mb-3">Genres</h2>
          <div className="flex flex-wrap gap-3">
            {data.genres.length === 0 ? (
              <p className="text-gray-400 dark:text-orange-300/60">No genres to display.</p>
            ) : (
              data.genres.map((g) => (
                <button
                  key={g}
                  className="px-4 py-1.5 rounded-full bg-white dark:bg-amber-800/30 border border-amber-200 dark:border-amber-700/50 text-gray-700 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-700/40 hover:border-amber-300 dark:hover:border-amber-600 transition text-sm"
                >
                  {g}
                </button>
              ))
            )}
          </div>
        </section>

        {/* LATEST BOOKS */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-orange-300">
              Latest Books
            </h2>
            <button className="text-sm text-amber-700 dark:text-orange-400 hover:text-amber-900 dark:hover:text-orange-300">
              See all →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {data.latest.length === 0 ? (
              <p className="text-gray-400 dark:text-orange-300/60 col-span-full text-center py-8">No books available yet.</p>
            ) : (
              data.latest.map((book) => (
                <BookCard key={book.id} book={book} />
              ))
            )}
          </div>
        </section>

        {/* FREE BOOKS */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-orange-300 mb-4">
            Free Reads
          </h2>
          {data.free.length === 0 ? (
            <p className="text-gray-400 dark:text-orange-300/60 text-center py-8">No free books available right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {data.free.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
function BookCard({ book }: { book: any }) {
  // 1) Fallback image if no cover available
  const fallback =
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80&auto=format&fit=crop";

  // 2) Get cover from any field name coming from backend
  const rawCover: string | null =
    book.cover_url ??
    book.coverImage ??
    book.cover_image ??
    book.cover ??
    book.image ??
    null;

  // 3) Clean it (remove trailing commas/semicolons)
  const cleanedCover =
    typeof rawCover === "string"
      ? rawCover.trim().replace(/[,;]+$/, "")
      : "";

  // 4) Build the src URL
  const coverSrc =
    cleanedCover.length > 0
      ? cleanedCover.startsWith("http")
        ? cleanedCover // Full URL
        : `/covers/${cleanedCover}` // Just filename: "sherlock.jpg" → /covers/sherlock.jpg
      : fallback;

  // 5) AUTHOR
  let authorText = "Unknown Author";

  if (Array.isArray(book.authors) && book.authors.length > 0) {
    authorText = book.authors.join(", ");
  } else if (typeof book.author === "string" && book.author.trim() !== "") {
    const candidate = book.author.trim();
    // If it looks like ObjectId, don't display it as name
    const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(candidate);
    authorText = looksLikeObjectId ? "Unknown Author" : candidate;
  }

  // 6) Log books without cover for debugging
  if (!cleanedCover) {
    console.log("BOOK WITHOUT COVER:", book);
  }

  return (
    <article className="bg-white dark:bg-amber-900/30 rounded-2xl overflow-hidden shadow-sm border border-amber-200 dark:border-amber-700/50 hover:shadow-md transition flex flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverSrc}
        alt={book.title}
        className="w-full h-44 object-cover"
      />
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 dark:text-amber-100 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-orange-300 mb-3">{authorText}</p>
        <div className="mt-auto flex items-center justify-between">
          {book.is_free ? (
            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              Free
            </span>
          ) : book.price ? (
            <span className="text-sm font-semibold text-gray-800 dark:text-amber-200">
              {book.price.amount} {book.price.currency}
            </span>
          ) : (
            <span className="text-xs text-gray-300 dark:text-amber-700">—</span>
          )}

          <button className="text-sm text-amber-700 dark:text-orange-400 hover:text-amber-900 dark:hover:text-orange-300">
            Open
          </button>
        </div>
      </div>
    </article>
  );
}
