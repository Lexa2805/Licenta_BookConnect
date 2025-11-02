"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
        setErr("Nu s-au putut încărca cărțile.");
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Se încarcă...</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-slate-100">
        <p className="text-red-500">{err}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-100 via-white to-slate-100">
      {/* HERO */}
      <header className="bg-white/70 backdrop-blur sticky top-0 z-10 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4 md:px-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold">
              B
            </div>
            <span className="font-semibold text-slate-800 text-lg">
              BookConnect
            </span>
          </div>
          {/* aici pui userul logat mai târziu */}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-0 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-2">
              Bine ai venit în BookConnect
              <span className="text-2xl"></span>
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
            {data.latest.length} cărți noi disponibile 📚
          </div>
        </div>

        {/* GENURI */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Genuri</h2>
          <div className="flex flex-wrap gap-3">
            {data.genres.length === 0 ? (
              <p className="text-slate-400">Nu există genuri de afișat.</p>
            ) : (
              data.genres.map((g) => (
                <button
                  key={g}
                  className="px-4 py-1.5 rounded-full bg-white border text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition text-sm"
                >
                  {g}
                </button>
              ))
            )}
          </div>
        </section>

        {/* ULTIMELE CĂRȚI */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Ultimele cărți
            </h2>
            {/* buton vezi toate */}
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              Vezi toate →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {data.latest.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* FREE */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Lecturi gratuite
          </h2>
          {data.free.length === 0 ? (
            <p className="text-slate-400">Nu sunt cărți gratuite acum.</p>
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
  // 1) fallback dacă nu avem poză deloc
  const fallback =
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80&auto=format&fit=crop";

  // 2) luăm coperta din ORICE nume de câmp vine din backend
  const rawCover: string | null =
    book.cover_url ??
    book.coverImage ??
    book.cover_image ??
    book.cover ??
    book.image ??
    null;

  // 3) o curățăm (tu ai în Mongo "sherlock.jpg," → să scoatem virgula)
  const cleanedCover =
    typeof rawCover === "string"
      ? rawCover.trim().replace(/[,;]+$/, "")
      : "";

  // 4) construim src-ul
  const coverSrc =
    cleanedCover.length > 0
      ? cleanedCover.startsWith("http")
        ? cleanedCover // e link complet
        : `/covers/${cleanedCover}` // e doar numele: "sherlock.jpg" → /covers/sherlock.jpg
      : fallback;

  // 5) AUTORUL
  let authorText = "Autor necunoscut";

  if (Array.isArray(book.authors) && book.authors.length > 0) {
    authorText = book.authors.join(", ");
  } else if (typeof book.author === "string" && book.author.trim() !== "") {
    const candidate = book.author.trim();
    // dacă e ObjectId, nu îl afișăm ca nume
    const looksLikeObjectId = /^[a-fA-F0-9]{24}$/.test(candidate);
    authorText = looksLikeObjectId ? "Autor necunoscut" : candidate;
  }

  // 6) dacă tot nu avem copertă după toate astea, logăm cartea → vezi în consolă exact ce câmp are
  if (!cleanedCover) {
    // asta o vezi în DevTools -> Console
    console.log("CARTE FARA COVER:", book);
  }

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition flex flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverSrc}
        alt={book.title}
        className="w-full h-44 object-cover"
      />
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-slate-500 mb-3">{authorText}</p>
        <div className="mt-auto flex items-center justify-between">
          {book.is_free ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Gratuit
            </span>
          ) : book.price ? (
            <span className="text-sm font-semibold text-slate-800">
              {book.price.amount} {book.price.currency}
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}

          <button className="text-sm text-indigo-600 hover:text-indigo-800">
            Deschide
          </button>
        </div>
      </div>
    </article>
  );
}
