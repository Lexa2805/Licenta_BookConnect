"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AlertCircle, BookOpen, Clapperboard, ExternalLink, Film, ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { findMovieMatches, findMovieMatchesFromImage, type MovieMatchResult } from "@/lib/services/ai";
import type { LibraryBook } from "@/lib/services/library";

type MovieMatchToolProps = {
  books?: LibraryBook[];
};

export function MovieMatchTool({ books = [] }: MovieMatchToolProps) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieGenre, setMovieGenre] = useState("");
  const [movieText, setMovieText] = useState("");
  const [movieResult, setMovieResult] = useState<MovieMatchResult | null>(null);
  const [movieLoading, setMovieLoading] = useState(false);
  const [movieError, setMovieError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const movieFileRef = useRef<HTMLInputElement | null>(null);
  const imageFileRef = useRef<HTMLInputElement | null>(null);

  function applyBook(bookId: string) {
    setSelectedBookId(bookId);
    const book = books.find((item) => String(item.id) === bookId);
    if (!book) return;

    setMovieTitle(book.title || "");
    setMovieGenre(Array.isArray(book.genres) ? book.genres.join(", ") : "");
    setMovieText(book.description || "");
    setMovieResult(null);
    setMovieError("");
    setImagePreview("");
  }

  async function handleFindMovies() {
    const text = movieText.trim();
    if (!text) {
      setMovieError("Choose a book, paste text, or upload a .txt file first.");
      return;
    }

    setMovieLoading(true);
    setMovieError("");
    try {
      const result = await findMovieMatches(movieTitle.trim(), text, movieGenre.trim());
      setMovieResult(result);
    } catch (err) {
      setMovieError(err instanceof Error ? err.message : "Could not find movie matches.");
    } finally {
      setMovieLoading(false);
    }
  }

  async function handleFindMoviesFromImage(imageUrl: string) {
    setMovieLoading(true);
    setMovieError("");
    try {
      const result = await findMovieMatchesFromImage(
        imageUrl,
        movieTitle.trim(),
        movieGenre.trim(),
      );
      setMovieResult(result);
    } catch (err) {
      setMovieError(err instanceof Error ? err.message : "Could not scan the image.");
    } finally {
      setMovieLoading(false);
    }
  }

  async function handleMovieFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isTextFile = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isTextFile) {
      setMovieError("For now, movie scanning can read .txt files. Paste text from PDFs or DOCX files into the box.");
      return;
    }

    const text = await file.text();
    setMovieText(text.trim());
    if (!movieTitle.trim()) {
      setMovieTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    setSelectedBookId("");
    setMovieResult(null);
    setMovieError("");
    setImagePreview("");
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMovieError("Choose a PNG, JPG, or another image file.");
      return;
    }

    setMovieLoading(true);
    setSelectedBookId("");
    setMovieResult(null);
    setMovieError("");

    try {
      const uploaded = await uploadMovieScanImage(file);
      setImagePreview(uploaded.url);
      await handleFindMoviesFromImage(uploaded.url);
    } catch (err) {
      setMovieError(err instanceof Error ? err.message : "Could not upload the image.");
      setMovieLoading(false);
    }
  }

  return (
    <section className="bc-card overflow-hidden">
      <div className="border-b border-bc-border bg-bc-surface-2 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
            <Clapperboard size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-bc-text">Find your movie</h2>
            <p className="text-[13px] text-bc-subtext">
              Match a book or excerpt with films that share its tone, setting, and themes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-bc-subtext">
              Book
            </span>
            <select
              value={selectedBookId}
              onChange={(event) => applyBook(event.target.value)}
              className="h-10 w-full rounded-bc-md border border-bc-border bg-bc-surface px-3 text-sm text-bc-text outline-none transition focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
            >
              <option value="">Choose from library...</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>

          <TextInput label="Title" value={movieTitle} onChange={setMovieTitle} placeholder="Book title" />
          <TextInput label="Genre" value={movieGenre} onChange={setMovieGenre} placeholder="Mystery, sci-fi, literary..." />
          <TextArea
            label="Text to scan"
            value={movieText}
            onChange={setMovieText}
            placeholder="Paste a synopsis, chapter, or full text excerpt..."
            rows={8}
          />

          <input
            ref={movieFileRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleMovieFileUpload}
            className="hidden"
          />
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreview && (
            <div className="overflow-hidden rounded-bc-md border border-bc-border bg-bc-surface">
              <img src={imagePreview} alt="Uploaded scan preview" className="max-h-44 w-full object-cover" />
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => movieFileRef.current?.click()}
              leftIcon={<Upload size={14} />}
            >
              Upload .txt
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={movieLoading}
              onClick={() => imageFileRef.current?.click()}
              leftIcon={<ImageIcon size={14} />}
            >
              Upload image
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={movieLoading}
              onClick={handleFindMovies}
              leftIcon={movieLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film size={14} />}
            >
              {movieLoading ? "Scanning..." : "Find movies"}
            </Button>
          </div>
          {movieError && <ToolError message={movieError} />}
        </div>

        <div className="rounded-bc-lg border border-bc-border bg-bc-surface-muted p-4">
          {movieResult ? (
            <div>
              <p className="mb-4 text-sm leading-6 text-bc-text-soft">{movieResult.summary}</p>
              <div className="space-y-3">
                {movieResult.movies.map((movie) => (
                  <article key={`${movie.title}-${movie.year}`} className="rounded-bc-md border border-bc-border bg-bc-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-bc-text">
                          {movie.title} {movie.year ? <span className="text-bc-subtext">({movie.year})</span> : null}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-bc-text-soft">{movie.reason}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-bc-primary-soft px-2.5 py-1 text-xs font-bold text-bc-primary">
                        {movie.match_score}%
                      </span>
                    </div>
                      {movie.shared_elements.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {movie.shared_elements.map((element) => (
                            <span key={element} className="rounded-full border border-bc-border bg-bc-surface-muted px-2 py-1 text-[11px] text-bc-subtext">
                              {element}
                          </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <MovieLink href={getJustWatchSearchUrl(movie.title, movie.year)} label="Where to watch" />
                        <MovieLink href={getImdbSearchUrl(movie.title, movie.year)} label="Movie page" />
                      </div>
                    </article>
                  ))}
                </div>
            </div>
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center text-center">
              <div>
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-bc-subtext" />
                <p className="text-sm font-semibold text-bc-text">Movie matches appear here</p>
                <p className="mt-1 text-sm text-bc-subtext">The scan compares story signals from the selected book or pasted text.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getJustWatchSearchUrl(title: string, year?: string) {
  return `https://www.justwatch.com/us/search?q=${encodeURIComponent(`${title} ${year || ""}`.trim())}`;
}

async function uploadMovieScanImage(file: File) {
  const form = new FormData();
  form.set("file", file);
  form.set("purpose", "movie-scan");

  const response = await fetch("/api/uploads/cloudinary", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = text || "Could not upload the image.";
    try {
      const parsed = JSON.parse(text) as { detail?: string; error?: string };
      message = parsed.detail || parsed.error || message;
    } catch {
      // keep raw message
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ public_id: string; url: string }>;
}

function getImdbSearchUrl(title: string, year?: string) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(`${title} ${year || ""}`.trim())}`;
}

function MovieLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-bc-md border border-bc-border bg-bc-surface-muted px-2.5 text-xs font-semibold text-bc-text-soft transition hover:border-bc-primary hover:text-bc-primary"
    >
      {label}
      <ExternalLink size={12} />
    </a>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-bc-subtext">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-bc-md border border-bc-border bg-bc-surface px-3 text-sm text-bc-text outline-none transition placeholder:text-bc-subtext focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-bc-subtext">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-bc-md border border-bc-border bg-bc-surface px-3 py-2 text-sm leading-6 text-bc-text outline-none transition placeholder:text-bc-subtext focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
      />
    </label>
  );
}

function ToolError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-bc-md border border-bc-danger/25 bg-bc-danger/10 px-3 py-2 text-xs leading-5 text-bc-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
