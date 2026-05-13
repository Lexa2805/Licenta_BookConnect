"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  generateBookmarkSuggestion,
  generateVibeCardPrompt,
  getPollinationsImageUrl,
  type BookmarkSuggestion,
  type VibeCardResult,
} from "@/lib/services/ai";
import { libraryService, type Bookmark, type LibraryBook } from "@/lib/services/library";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-bc-primary border-t-transparent" />
      <span className="ml-3 text-bc-subtext">Loading PDF viewer...</span>
    </div>
  ),
});

type BookmarkColor = "yellow" | "green" | "blue" | "pink" | "purple";

type BookmarkDraft = {
  open: boolean;
  text: string;
  note: string;
  color: BookmarkColor;
};

type SidebarVibeCard = {
  bookmarkId: string | number;
  result: VibeCardResult;
};

type VibeCardThemeId = "editorial" | "glass" | "postcard" | "noir";

type VibeCardTheme = {
  id: VibeCardThemeId;
  name: string;
  variationHint: string;
  frameClass: string;
  overlayClass: string;
  contentClass: string;
  bodyClass: string;
  quoteClass: string;
  captionClass: string;
  metaClass: string;
  chipClass: string;
  quoteFont: string;
  captionFont: string;
  metaFont: string;
};

type VibeCardSticker = {
  id: number;
  emoji: string;
  top: number;
  left: number;
  size: number;
  rotate: number;
};

type EmojiOption = {
  value: string;
  label: string;
};

const BOOKMARK_COLORS: Array<{
  value: BookmarkColor;
  bg: string;
  label: string;
  description: string;
}> = [
  { value: "yellow", bg: "bg-yellow-300", label: "Yellow", description: "Key quote" },
  { value: "green", bg: "bg-green-300", label: "Green", description: "Character" },
  { value: "blue", bg: "bg-blue-300", label: "Blue", description: "World-building" },
  { value: "pink", bg: "bg-pink-300", label: "Pink", description: "Emotional" },
  { value: "purple", bg: "bg-purple-300", label: "Purple", description: "Theme" },
];

const FALLBACK_VIBE_PROMPT = "abstract warm golden watercolor book aesthetic";
const MODAL_BUTTON_BASE =
  "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";
const MODAL_BLOCK_BUTTON =
  "rounded-xl border px-4 py-3 text-sm font-semibold shadow-bc-sm hover:-translate-y-0.5 hover:shadow-bc-md";
const MODAL_PILL_BUTTON =
  "rounded-full border px-4 py-2 text-sm font-medium shadow-bc-sm hover:-translate-y-0.5 hover:shadow-bc-md";

const MOOD_EMOJIS: EmojiOption[] = [
  { value: "\u{2728}", label: "Sparkle" },
  { value: "\u{1F4D6}", label: "Book" },
  { value: "\u{2764}\u{FE0F}", label: "Heart" },
  { value: "\u{1F525}", label: "Fire" },
  { value: "\u{1F319}", label: "Moon" },
  { value: "\u{1F339}", label: "Rose" },
  { value: "\u{1F98B}", label: "Butterfly" },
  { value: "\u{1F30A}", label: "Wave" },
  { value: "\u{1F451}", label: "Crown" },
  { value: "\u{1F3B5}", label: "Music" },
  { value: "\u{1F3F0}", label: "Castle" },
  { value: "\u{1F480}", label: "Skull" },
];

const STICKER_ANCHORS = [
  { top: 14, left: 14 },
  { top: 16, left: 82 },
  { top: 28, left: 70 },
  { top: 72, left: 16 },
  { top: 78, left: 78 },
  { top: 58, left: 24 },
  { top: 34, left: 24 },
  { top: 62, left: 68 },
];

const VIBE_CARD_THEMES: VibeCardTheme[] = [
  {
    id: "editorial",
    name: "Editorial",
    variationHint: "editorial magazine cover with cinematic depth, bold negative space, and strong framing",
    frameClass: "bg-stone-900",
    overlayClass: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 p-5",
    contentClass: "flex h-full flex-col justify-end",
    bodyClass: "max-w-[84%]",
    quoteClass: "text-left text-white drop-shadow-[0_12px_24px_rgba(0,0,0,0.42)]",
    captionClass: "mt-4 text-lg font-semibold text-white",
    metaClass: "mt-1 text-[11px] uppercase tracking-[0.28em] text-white/70",
    chipClass:
      "absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white backdrop-blur-md",
    quoteFont: "var(--font-display), Georgia, serif",
    captionFont: "var(--font-sans), system-ui, sans-serif",
    metaFont: "var(--font-sans), system-ui, sans-serif",
  },
  {
    id: "glass",
    name: "Glass Poem",
    variationHint: "soft glassmorphism poster with a centered luminous subject and dreamy atmospheric glow",
    frameClass: "bg-slate-900",
    overlayClass:
      "absolute inset-0 bg-[linear-gradient(135deg,rgba(9,14,26,0.08),rgba(9,14,26,0.78))] p-5",
    contentClass: "flex h-full items-center justify-center",
    bodyClass:
      "w-full max-w-[86%] rounded-[28px] border border-white/18 bg-white/14 p-5 text-center shadow-[0_20px_48px_rgba(0,0,0,0.3)] backdrop-blur-xl",
    quoteClass: "text-white",
    captionClass: "mt-4 text-base font-semibold text-white",
    metaClass: "mt-2 text-[11px] uppercase tracking-[0.24em] text-white/75",
    chipClass:
      "absolute right-4 top-4 rounded-full border border-white/20 bg-white/14 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white backdrop-blur-md",
    quoteFont: "var(--font-sans), system-ui, sans-serif",
    captionFont: "var(--font-display), Georgia, serif",
    metaFont: "var(--font-sans), system-ui, sans-serif",
  },
  {
    id: "postcard",
    name: "Postcard",
    variationHint: "romantic art postcard with a collectible keepsake feel and elegant layered framing",
    frameClass: "bg-amber-950",
    overlayClass:
      "absolute inset-0 bg-[linear-gradient(180deg,rgba(20,12,8,0.12),rgba(20,12,8,0.8))] p-5",
    contentClass: "flex h-full flex-col justify-end",
    bodyClass:
      "max-w-[90%] rounded-[28px] border border-white/35 bg-[rgba(250,243,232,0.88)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md",
    quoteClass: "text-stone-900",
    captionClass: "mt-4 text-lg font-semibold text-stone-950",
    metaClass: "mt-2 text-[11px] uppercase tracking-[0.24em] text-stone-600",
    chipClass:
      "absolute left-4 top-4 rounded-full border border-black/10 bg-[rgba(250,243,232,0.88)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-stone-700 shadow-sm",
    quoteFont: "var(--font-display), Georgia, serif",
    captionFont: "var(--font-sans), system-ui, sans-serif",
    metaFont: "var(--font-sans), system-ui, sans-serif",
  },
  {
    id: "noir",
    name: "Noir",
    variationHint: "moody noir poster with a bold cropped subject, glossy highlights, and dramatic darkness",
    frameClass: "bg-neutral-950",
    overlayClass:
      "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.88))] p-5",
    contentClass: "flex h-full items-end",
    bodyClass:
      "w-[80%] rounded-[30px] border border-white/12 bg-black/45 p-5 shadow-[0_20px_44px_rgba(0,0,0,0.38)] backdrop-blur-md",
    quoteClass: "text-left text-white",
    captionClass: "mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-white",
    metaClass: "mt-2 text-[10px] uppercase tracking-[0.3em] text-white/65",
    chipClass:
      "absolute right-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/85 backdrop-blur-md",
    quoteFont: "var(--font-sans), system-ui, sans-serif",
    captionFont: "var(--font-display), Georgia, serif",
    metaFont: "var(--font-sans), system-ui, sans-serif",
  },
];

function getBookmarkBgClass(color: string) {
  const map: Record<string, string> = {
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400",
    green: "bg-green-50 dark:bg-green-900/20 border-green-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-400",
    pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-400",
  };
  return map[color] ?? map.yellow;
}

function clampPage(page: number, maxPages: number) {
  return Math.min(maxPages, Math.max(1, page));
}

function sanitizeBookmarkText(value: string, options?: { collapseWhitespace?: boolean }) {
  const sanitized = value
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");

  if (options?.collapseWhitespace ?? true) {
    return sanitized.replace(/\s+/g, " ").trim();
  }

  return sanitized.trim();
}

function createEmptyBookmarkDraft(): BookmarkDraft {
  return {
    open: false,
    text: "",
    note: "",
    color: "yellow",
  };
}

function getVibeCardTheme(themeId: VibeCardThemeId) {
  return VIBE_CARD_THEMES.find((theme) => theme.id === themeId) ?? VIBE_CARD_THEMES[0];
}

function pickNextVibeCardTheme(currentThemeId?: VibeCardThemeId) {
  const pool = VIBE_CARD_THEMES.filter((theme) => theme.id !== currentThemeId);
  const candidates = pool.length > 0 ? pool : VIBE_CARD_THEMES;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? VIBE_CARD_THEMES[0];
}

function createVibeCardSticker(
  emoji: string,
  offset = 0,
  existingId?: number,
): VibeCardSticker {
  const anchor =
    STICKER_ANCHORS[
      (Math.floor(Math.random() * STICKER_ANCHORS.length) + offset) % STICKER_ANCHORS.length
    ] ?? STICKER_ANCHORS[0];

  return {
    id: existingId ?? Date.now() + Math.floor(Math.random() * 100_000),
    emoji,
    top: Math.max(12, Math.min(82, anchor.top + Math.floor(Math.random() * 10) - 5)),
    left: Math.max(12, Math.min(84, anchor.left + Math.floor(Math.random() * 10) - 5)),
    size: 28 + Math.floor(Math.random() * 10),
    rotate: Math.floor(Math.random() * 36) - 18,
  };
}

function reseedVibeCardStickers(stickers: VibeCardSticker[]) {
  return stickers.map((sticker, index) =>
    createVibeCardSticker(sticker.emoji, index, sticker.id),
  );
}

function getVibeQuoteStyle(text: string) {
  const length = sanitizeBookmarkText(text).length;

  if (length > 520) {
    return { fontSize: "0.66rem", lineHeight: 1.2, maxLines: 13 };
  }
  if (length > 380) {
    return { fontSize: "0.74rem", lineHeight: 1.24, maxLines: 12 };
  }
  if (length > 260) {
    return { fontSize: "0.84rem", lineHeight: 1.3, maxLines: 11 };
  }
  if (length > 160) {
    return { fontSize: "0.96rem", lineHeight: 1.36, maxLines: 10 };
  }

  return { fontSize: "1.05rem", lineHeight: 1.45, maxLines: 8 };
}

export function BookReaderClient({
  bookId,
  initialBook,
}: {
  bookId: string | number;
  initialBook: LibraryBook;
}) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";
  const [book] = useState(initialBook);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageText, setCurrentPageText] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkDraft, setBookmarkDraft] = useState<BookmarkDraft>(createEmptyBookmarkDraft);
  const [magicSuggestLoading, setMagicSuggestLoading] = useState(false);
  const [magicSuggestError, setMagicSuggestError] = useState<string | null>(null);
  const [magicSuggestion, setMagicSuggestion] = useState<BookmarkSuggestion | null>(null);
  const [vibeCardLoading, setVibeCardLoading] = useState(false);
  const [vibeCardError, setVibeCardError] = useState<string | null>(null);
  const [vibeCardResult, setVibeCardResult] = useState<VibeCardResult | null>(null);
  const [showVibeCard, setShowVibeCard] = useState(false);
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState("");
  const [vibeCardThemeId, setVibeCardThemeId] = useState<VibeCardThemeId>("editorial");
  const [vibeCardStickers, setVibeCardStickers] = useState<VibeCardSticker[]>([]);
  const [sidebarVibeLoading, setSidebarVibeLoading] = useState<string | number | null>(null);
  const [sidebarVibeResult, setSidebarVibeResult] = useState<SidebarVibeCard | null>(null);
  const [savedCardPreview, setSavedCardPreview] = useState<Bookmark | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkReader, setIsDarkReader] = useState(false);
  const [pdfScale, setPdfScale] = useState(1);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loadingLibraryState, setLoadingLibraryState] = useState(true);
  const [readingSessionId, setReadingSessionId] = useState<string | number | null>(null);
  const currentPageRef = useRef(1);
  const sessionStartedRef = useRef(false);
  const magicSuggestRequestRef = useRef(0);
  const vibeCardRequestRef = useRef(0);

  const maxPages = totalPages || book.pages || 1;
  const pdfUrl = book.pdf || book.pdf_url;
  const activeVibeCardTheme = getVibeCardTheme(vibeCardThemeId);
  const vibeQuoteStyle = getVibeQuoteStyle(bookmarkDraft.text);

  const resetVibeCardDecor = useCallback(() => {
    setSelectedMoodEmoji("");
    setVibeCardThemeId("editorial");
    setVibeCardStickers([]);
  }, []);

  const resetBookmarkAiState = useCallback(() => {
    magicSuggestRequestRef.current += 1;
    vibeCardRequestRef.current += 1;
    setMagicSuggestLoading(false);
    setMagicSuggestError(null);
    setMagicSuggestion(null);
    setVibeCardLoading(false);
    setVibeCardError(null);
    setVibeCardResult(null);
    setShowVibeCard(false);
  }, []);

  const closeBookmarkModal = useCallback(() => {
    setBookmarkDraft(createEmptyBookmarkDraft());
    resetBookmarkAiState();
    resetVibeCardDecor();
  }, [resetBookmarkAiState, resetVibeCardDecor]);

  useEffect(() => {
    currentPageRef.current = currentPage;
    setCurrentPageText("");
  }, [currentPage]);

  const loadBookmarks = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const data = await libraryService.getBookmarks(userId, bookId);
      setBookmarks(data);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  }, [bookId, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadBookmarks();
  }, [loadBookmarks, userId]);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      if (!userId) {
        setLoadingLibraryState(false);
        return;
      }

      setLoadingLibraryState(true);
      try {
        const library = await libraryService.getUserLibrary(userId);
        const entry = library.find((item) => String(item.book.id) === String(bookId));
        if (!cancelled && entry?.current_page) {
          const nextPage = clampPage(entry.current_page, maxPages);
          setCurrentPage(nextPage);
          currentPageRef.current = nextPage;
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      } finally {
        if (!cancelled) {
          setLoadingLibraryState(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [bookId, maxPages, userId]);

  useEffect(() => {
    if (!userId || loadingLibraryState || sessionStartedRef.current) {
      return;
    }

    sessionStartedRef.current = true;
    libraryService
      .startReadingSession(userId, bookId, currentPageRef.current)
      .then((readingSession: { id?: string | number } | undefined) => {
        if (readingSession?.id) {
          setReadingSessionId(readingSession.id);
        }
      })
      .catch((error) => {
        console.error("Error starting reading session:", error);
      });
  }, [bookId, loadingLibraryState, userId]);

  useEffect(() => {
    return () => {
      if (!readingSessionId) {
        return;
      }

      libraryService
        .endReadingSession(readingSessionId, currentPageRef.current)
        .catch((error) => console.error("Error ending reading session:", error));
    };
  }, [readingSessionId]);

  const handleSaveProgress = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setSaveStatus("saving");
      const library = await libraryService.getUserLibrary(userId);
      let entry = library.find((item) => String(item.book.id) === String(bookId));

      if (!entry) {
        entry = await libraryService.addToLibrary(userId, bookId);
      }

      await libraryService.updateProgress(entry.id, currentPage);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving progress:", error);
      setSaveStatus("idle");
    }
  }, [bookId, currentPage, userId]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = sanitizeBookmarkText(selection?.toString() ?? "");

    if (!text) {
      return;
    }

    resetBookmarkAiState();
    resetVibeCardDecor();
    setBookmarkDraft({
      open: true,
      text,
      note: "",
      color: "yellow",
    });
  }, [resetBookmarkAiState, resetVibeCardDecor]);

  const handleAddBookmark = useCallback(async () => {
    if (!userId) {
      return;
    }

    const cleanedText = sanitizeBookmarkText(bookmarkDraft.text);
    const cleanedNote = sanitizeBookmarkText(bookmarkDraft.note, {
      collapseWhitespace: false,
    });

    if (!cleanedText) {
      return;
    }

    try {
      await libraryService.createBookmark({
        user_id: userId,
        book: bookId,
        page_number: currentPage,
        paragraph_text: cleanedText,
        note: cleanedNote,
        color: bookmarkDraft.color,
        vibe_card_image_url: vibeCardResult?.imageUrl,
        vibe_card_prompt: vibeCardResult?.prompt,
        vibe_card_caption: vibeCardResult?.caption,
        vibe_card_theme: vibeCardResult ? vibeCardThemeId : undefined,
        vibe_card_mood: vibeCardResult ? selectedMoodEmoji : undefined,
        vibe_card_stickers: vibeCardResult ? vibeCardStickers : undefined,
      });

      closeBookmarkModal();
      await loadBookmarks();
    } catch (error) {
      console.error("Error adding bookmark:", error);
    }
  }, [
    bookmarkDraft,
    bookId,
    closeBookmarkModal,
    currentPage,
    loadBookmarks,
    selectedMoodEmoji,
    userId,
    vibeCardResult,
    vibeCardStickers,
    vibeCardThemeId,
  ]);

  const handleMagicSuggest = useCallback(async () => {
    const cleanedText = sanitizeBookmarkText(bookmarkDraft.text);
    if (!cleanedText) {
      return;
    }

    const requestId = magicSuggestRequestRef.current + 1;
    magicSuggestRequestRef.current = requestId;
    setMagicSuggestLoading(true);
    setMagicSuggestError(null);
    setMagicSuggestion(null);

    try {
      const suggestion = await generateBookmarkSuggestion(
        cleanedText,
        book.title,
        book.author,
        currentPageText,
        currentPage,
      );

      if (magicSuggestRequestRef.current !== requestId) {
        return;
      }

      setMagicSuggestion(suggestion);
      setBookmarkDraft((draft) => ({
        ...draft,
        note: suggestion.note,
        color: suggestion.color,
      }));
    } catch (error) {
      if (magicSuggestRequestRef.current !== requestId) {
        return;
      }

      setMagicSuggestError(
        error instanceof Error ? error.message : "Failed to generate bookmark suggestion.",
      );
    } finally {
      if (magicSuggestRequestRef.current === requestId) {
        setMagicSuggestLoading(false);
      }
    }
  }, [book.author, book.title, bookmarkDraft.text, currentPage, currentPageText]);

  const handleAddSticker = useCallback((emoji: string) => {
    setVibeCardStickers((current) => {
      const next = [...current, createVibeCardSticker(emoji, current.length)];
      return next.slice(-4);
    });
  }, []);

  const handleRemoveSticker = useCallback((stickerId: number) => {
    setVibeCardStickers((current) => current.filter((sticker) => sticker.id !== stickerId));
  }, []);

  const handleClearStickers = useCallback(() => {
    setVibeCardStickers([]);
  }, []);

  const handleGenerateVibeCard = useCallback(
    async (text?: string, color?: BookmarkColor) => {
      const cleanedText = sanitizeBookmarkText(text ?? bookmarkDraft.text);
      if (!cleanedText) {
        return;
      }

      const nextTheme = pickNextVibeCardTheme(vibeCardThemeId);
      const requestId = vibeCardRequestRef.current + 1;
      vibeCardRequestRef.current = requestId;
      setVibeCardLoading(true);
      setVibeCardError(null);
      setVibeCardResult(null);
      setShowVibeCard(true);
      setVibeCardThemeId(nextTheme.id);
      setVibeCardStickers((current) => {
        if (current.length > 0) {
          return reseedVibeCardStickers(current);
        }

        return selectedMoodEmoji ? [createVibeCardSticker(selectedMoodEmoji)] : current;
      });

      try {
        const result = await generateVibeCardPrompt(
          cleanedText,
          book.title,
          book.author,
          color ?? bookmarkDraft.color,
          selectedMoodEmoji,
          nextTheme.variationHint,
        );

        if (vibeCardRequestRef.current !== requestId) {
          return;
        }

        setVibeCardResult(result);
      } catch (error) {
        if (vibeCardRequestRef.current !== requestId) {
          return;
        }

        setVibeCardError(
          error instanceof Error ? error.message : "Failed to generate social vibe card.",
        );
      } finally {
        if (vibeCardRequestRef.current === requestId) {
          setVibeCardLoading(false);
        }
      }
    },
    [
      book.author,
      book.title,
      bookmarkDraft.color,
      bookmarkDraft.text,
      selectedMoodEmoji,
      vibeCardThemeId,
    ],
  );

  const handleSidebarVibeCard = useCallback(
    async (bookmark: Bookmark) => {
      const sourceText = sanitizeBookmarkText(bookmark.paragraph_text || bookmark.note);
      if (!sourceText) {
        return;
      }

      setSidebarVibeLoading(bookmark.id);
      setSidebarVibeResult(null);

      try {
        const result = await generateVibeCardPrompt(
          sourceText,
          book.title,
          book.author,
          (bookmark.color as BookmarkColor) || "yellow",
        );
        setSidebarVibeResult({ bookmarkId: bookmark.id, result });
      } catch (error) {
        console.error("Error generating bookmark vibe card:", error);
      } finally {
        setSidebarVibeLoading((current) => (current === bookmark.id ? null : current));
      }
    },
    [book.author, book.title],
  );

  const handleDownloadVibeCard = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `bookconnect-vibe-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleShareVibeCard = useCallback(
    async (text: string, card: VibeCardResult) => {
      const excerpt = sanitizeBookmarkText(text).slice(0, 100);
      const shareText = `"${excerpt}${text.length > 100 ? "..." : ""}" — ${book.title} by ${book.author}\n${card.caption}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: `${book.title} — BookConnect Vibe`,
            text: shareText,
            url: card.imageUrl,
          });
          return;
        }

        await navigator.clipboard.writeText(`${shareText}\n${card.imageUrl}`);
      } catch {
        window.open(card.imageUrl, "_blank", "noopener,noreferrer");
      }
    },
    [book.author, book.title],
  );

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string | number) => {
      try {
        await libraryService.deleteBookmark(bookmarkId);
        await loadBookmarks();
      } catch (error) {
        console.error("Error deleting bookmark:", error);
      }
    },
    [loadBookmarks],
  );

  const savedCardTheme = savedCardPreview
    ? getVibeCardTheme((savedCardPreview.vibe_card_theme as VibeCardThemeId) || "editorial")
    : null;
  const savedCardQuoteStyle = savedCardPreview
    ? getVibeQuoteStyle(savedCardPreview.paragraph_text || savedCardPreview.note)
    : null;
  const savedCardStickers = Array.isArray(savedCardPreview?.vibe_card_stickers)
    ? savedCardPreview.vibe_card_stickers
    : [];

  if (status === "loading" || !userId) {
    return (
      <main className="min-h-screen bg-bc-bg text-bc-text grid place-items-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-bc-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-bc-subtext">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  if (loadingLibraryState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bc-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-bc-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bc-bg">
      <div className="sticky top-0 z-50 border-b border-bc-border bg-bc-surface shadow-bc-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href={`/books/${bookId}`}
                className="rounded-lg p-2 transition hover:bg-bc-surface-muted"
              >
                Back
              </Link>
              <div className="min-w-0">
                <h1 className="line-clamp-1 font-bold text-bc-text">{book.title}</h1>
                <p className="text-sm text-bc-subtext">{book.author}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-bc-surface-muted px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => clampPage(page - 1, maxPages))}
                  disabled={currentPage <= 1}
                  className="rounded p-1 transition hover:bg-bc-primary-soft disabled:opacity-50"
                >
                  Prev
                </button>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(event) =>
                    setCurrentPage(clampPage(parseInt(event.target.value, 10) || 1, maxPages))
                  }
                  className="w-16 border-none bg-transparent text-center text-bc-text focus:ring-0"
                  min={1}
                  max={maxPages}
                />
                <span className="text-bc-subtext">/ {maxPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => clampPage(page + 1, maxPages))}
                  disabled={currentPage >= maxPages}
                  className="rounded p-1 transition hover:bg-bc-primary-soft disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-bc-surface-muted px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFontSize((size) => Math.max(12, size - 2));
                    setPdfScale((scale) => Math.max(0.5, scale - 0.1));
                  }}
                  className="rounded p-1 text-sm transition hover:bg-bc-primary-soft"
                >
                  A-
                </button>
                <span className="px-1 text-sm text-bc-subtext">{fontSize}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFontSize((size) => Math.min(24, size + 2));
                    setPdfScale((scale) => Math.min(2, scale + 0.1));
                  }}
                  className="rounded p-1 text-sm transition hover:bg-bc-primary-soft"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsDarkReader((value) => !value)}
                className={[
                  "rounded-lg p-2 transition",
                  isDarkReader
                    ? "bg-bc-primary-soft text-bc-warning"
                    : "bg-bc-surface-muted text-bc-subtext",
                ].join(" ")}
                title="Toggle dark reader mode"
              >
                Theme
              </button>

              <button
                type="button"
                onClick={() => setShowBookmarks((value) => !value)}
                className={[
                  "relative rounded-lg p-2 transition",
                  showBookmarks
                    ? "bg-bc-primary text-white"
                    : "bg-bc-surface-muted text-bc-subtext",
                ].join(" ")}
                title="Bookmarks"
              >
                Notes
                {bookmarks.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={saveStatus === "saving"}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium text-white transition",
                  saveStatus === "saving"
                    ? "cursor-wait bg-bc-success opacity-80"
                    : "bg-bc-success hover:opacity-90",
                ].join(" ")}
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                    ? "Saved"
                    : "Save Progress"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <div
          className="h-[calc(100vh-80px)] flex-1 overflow-auto"
          onMouseUp={handleTextSelection}
        >
          {pdfUrl ? (
            <PdfViewer
              pdfUrl={pdfUrl}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onLoadSuccess={setTotalPages}
              onPageTextLoad={(page, text) => {
                if (page === currentPageRef.current) {
                  setCurrentPageText(text);
                }
              }}
              isDarkMode={isDarkReader}
              scale={pdfScale}
            />
          ) : (
            <div
              className="mx-auto max-w-3xl p-8 text-bc-text"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            >
              <p className="py-20 text-center text-bc-subtext">
                No PDF is available for this book yet.
              </p>
            </div>
          )}
        </div>

        {showBookmarks && (
          <aside className="h-[calc(100vh-80px)] w-80 overflow-y-auto border-l border-bc-border bg-bc-surface">
            <div className="p-4">
              <h2 className="mb-4 text-lg font-bold text-bc-text">Bookmarks</h2>

              {bookmarks.length === 0 ? (
                <p className="text-sm text-bc-subtext">
                  Select text in the reader to save a bookmark.
                </p>
              ) : (
                <div className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className={`rounded-lg border-l-4 p-3 ${getBookmarkBgClass(bookmark.color)}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-xs text-bc-subtext">
                          Page {bookmark.page_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          className="text-sm text-red-500 transition hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      {bookmark.paragraph_text && (
                        <p className="mb-2 line-clamp-3 text-sm italic text-bc-text-soft">
                          "{bookmark.paragraph_text}"
                        </p>
                      )}

                      {bookmark.note && (
                        <p className="text-sm text-bc-text-soft">{bookmark.note}</p>
                      )}

                      {bookmark.vibe_card_image_url && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-bc-border bg-bc-bg-elev shadow-bc-sm">
                          <div className="relative aspect-square bg-bc-surface-muted">
                            <img
                              src={bookmark.vibe_card_image_url}
                              alt="Saved bookmark social card"
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src =
                                  getPollinationsImageUrl(FALLBACK_VIBE_PROMPT);
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-4">
                              <div className="flex h-full flex-col justify-end">
                                {bookmark.paragraph_text && (
                                  <p className="line-clamp-4 text-sm italic leading-relaxed text-white">
                                    "{bookmark.paragraph_text}"
                                  </p>
                                )}
                                {bookmark.vibe_card_caption && (
                                  <p className="mt-3 text-sm font-semibold text-white">
                                    {bookmark.vibe_card_caption}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage(clampPage(bookmark.page_number, maxPages))
                          }
                          className="rounded-full bg-bc-primary-soft px-3 py-1 text-xs font-medium text-bc-primary transition hover:bg-bc-primary-soft-strong"
                        >
                          Go to page
                        </button>
                        {(bookmark.paragraph_text || bookmark.note) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (bookmark.vibe_card_image_url) {
                                setSavedCardPreview(bookmark);
                                setSidebarVibeResult(null);
                                return;
                              }

                              handleSidebarVibeCard(bookmark);
                            }}
                            disabled={sidebarVibeLoading === bookmark.id}
                            className="rounded-full border border-bc-border px-3 py-1 text-xs font-medium text-bc-text transition hover:bg-bc-surface-muted disabled:cursor-wait disabled:opacity-70"
                          >
                            {sidebarVibeLoading === bookmark.id
                              ? "Creating card..."
                              : bookmark.vibe_card_image_url
                                ? "View saved card"
                                : "Create social card"}
                          </button>
                        )}
                      </div>

                      {sidebarVibeResult?.bookmarkId === bookmark.id && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-bc-border bg-bc-bg-elev shadow-bc-sm">
                          <div className="relative aspect-square bg-bc-surface-muted">
                            <img
                              key={sidebarVibeResult.result.imageUrl}
                              src={sidebarVibeResult.result.imageUrl}
                              alt="Bookmark social card"
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src =
                                  getPollinationsImageUrl(FALLBACK_VIBE_PROMPT);
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 p-4">
                              <div className="flex h-full flex-col justify-end">
                                {bookmark.paragraph_text && (
                                  <p className="line-clamp-5 text-sm italic leading-relaxed text-white">
                                    "{bookmark.paragraph_text}"
                                  </p>
                                )}
                                <p className="mt-3 text-sm font-semibold text-white">
                                  {sidebarVibeResult.result.caption}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                                  {book.title} • BookConnect
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 border-t border-bc-border bg-bc-surface p-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadVibeCard(sidebarVibeResult.result.imageUrl)
                              }
                              className="flex-1 rounded-full bg-bc-primary-soft px-3 py-2 text-xs font-medium text-bc-primary transition hover:bg-bc-primary-soft-strong"
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => setSidebarVibeResult(null)}
                              className="rounded-full border border-bc-border px-3 py-2 text-xs font-medium text-bc-text transition hover:bg-bc-surface-muted"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {savedCardPreview && savedCardTheme && savedCardQuoteStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-bc-border bg-bc-surface shadow-bc-xl">
            <div className="flex items-center justify-between gap-3 border-b border-bc-border px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-bc-text">Saved social card</h3>
                <p className="text-xs text-bc-subtext">Page {savedCardPreview.page_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setSavedCardPreview(null)}
                className="rounded-full border border-bc-border px-3 py-1.5 text-xs font-medium text-bc-text transition hover:bg-bc-surface-muted"
              >
                Close
              </button>
            </div>

            <div
              className={[
                "relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(232,169,169,0.55),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(138,169,143,0.5),transparent_30%),radial-gradient(circle_at_58%_86%,rgba(168,184,200,0.55),transparent_36%),linear-gradient(135deg,#7c3f22,#264f68_42%,#74435b_72%,#c46a2b)]",
                savedCardTheme.frameClass,
              ].join(" ")}
            >
              <img
                src={savedCardPreview.vibe_card_image_url}
                alt="Saved bookmark social card"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = getPollinationsImageUrl(FALLBACK_VIBE_PROMPT);
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,102,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(159,123,140,0.28),transparent_38%)] mix-blend-screen" />
              <div className={savedCardTheme.overlayClass}>
                <div className={savedCardTheme.chipClass}>
                  {savedCardPreview.vibe_card_mood ? `${savedCardPreview.vibe_card_mood} ` : ""}
                  {savedCardTheme.name}
                </div>

                {savedCardStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="absolute flex items-center justify-center rounded-[18px] border border-white/25 bg-black/20 shadow-[0_10px_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
                    style={{
                      top: `${sticker.top}%`,
                      left: `${sticker.left}%`,
                      width: `${sticker.size + 18}px`,
                      height: `${sticker.size + 18}px`,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg)`,
                      fontSize: `${sticker.size}px`,
                    }}
                  >
                    {sticker.emoji}
                  </div>
                ))}

                <div className={savedCardTheme.contentClass}>
                  <div className={savedCardTheme.bodyClass}>
                    <p
                      className={savedCardTheme.quoteClass}
                      style={{
                        fontFamily: savedCardTheme.quoteFont,
                        fontSize: savedCardQuoteStyle.fontSize,
                        fontStyle: "italic",
                        lineHeight: savedCardQuoteStyle.lineHeight,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: savedCardQuoteStyle.maxLines,
                        overflow: "hidden",
                      }}
                      title={savedCardPreview.paragraph_text}
                    >
                      "{savedCardPreview.paragraph_text || savedCardPreview.note}"
                    </p>
                    {savedCardPreview.vibe_card_caption && (
                      <p
                        className={savedCardTheme.captionClass}
                        style={{ fontFamily: savedCardTheme.captionFont }}
                      >
                        {savedCardPreview.vibe_card_caption}
                      </p>
                    )}
                    <p
                      className={savedCardTheme.metaClass}
                      style={{ fontFamily: savedCardTheme.metaFont }}
                    >
                      {book.title} â€¢ {book.author} â€¢ BookConnect
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-bc-border bg-bc-surface p-3">
              <button
                type="button"
                onClick={() => handleDownloadVibeCard(savedCardPreview.vibe_card_image_url || "")}
                className="flex-1 rounded-full bg-bc-primary-soft px-3 py-2 text-xs font-medium text-bc-primary transition hover:bg-bc-primary-soft-strong"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() =>
                  handleShareVibeCard(savedCardPreview.paragraph_text || savedCardPreview.note, {
                    imageUrl: savedCardPreview.vibe_card_image_url || "",
                    prompt: savedCardPreview.vibe_card_prompt || "",
                    caption: savedCardPreview.vibe_card_caption || "Saved social card",
                  })
                }
                className="flex-1 rounded-full border border-bc-border px-3 py-2 text-xs font-medium text-bc-text transition hover:bg-bc-surface-muted"
              >
                Share or Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {bookmarkDraft.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-bc-border bg-bc-surface p-6 shadow-bc-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-bc-text">Add Bookmark</h3>
                <p className="mt-1 text-sm text-bc-subtext">
                  Save the passage, ask AI for a note, or turn it into a social card.
                </p>
              </div>
              <button
                type="button"
                onClick={closeBookmarkModal}
                className="rounded-lg p-2 text-bc-subtext transition hover:bg-bc-surface-muted"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div>
                <div className="rounded-2xl border border-bc-border bg-bc-bg-elev p-4 shadow-bc-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-bc-subtext">
                      Selected passage
                    </span>
                    <span className="rounded-full bg-bc-primary-soft px-3 py-1 text-xs font-medium text-bc-primary">
                      Page {currentPage}
                    </span>
                  </div>
                  <p className="mt-3 text-sm italic leading-7 text-bc-text-soft">
                    "{bookmarkDraft.text}"
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-bc-border bg-bc-surface-2 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleMagicSuggest}
                      disabled={magicSuggestLoading}
                      className={[
                        "flex-1",
                        MODAL_BUTTON_BASE,
                        MODAL_BLOCK_BUTTON,
                        magicSuggestLoading
                          ? "cursor-wait border-bc-border-strong bg-bc-surface-muted text-bc-text"
                          : magicSuggestion
                            ? "border-[color:var(--bc-secondary)] bg-[color:var(--bc-secondary-soft)] text-bc-text"
                            : "border-bc-border-strong bg-bc-surface text-bc-text hover:border-[color:var(--bc-accent-plum)] hover:bg-white hover:text-[color:var(--bc-accent-plum)]",
                      ].join(" ")}
                    >
                      {magicSuggestLoading
                        ? "Analyzing passage..."
                        : magicSuggestion
                          ? "Suggestion Applied"
                          : "Magic Suggest Note"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateVibeCard()}
                      disabled={vibeCardLoading}
                      className={[
                        "flex-1",
                        MODAL_BUTTON_BASE,
                        MODAL_BLOCK_BUTTON,
                        vibeCardLoading
                          ? "cursor-wait border-bc-border bg-bc-surface-muted text-bc-subtext"
                          : "border-bc-border bg-bc-surface-2 text-bc-text hover:border-bc-border-strong hover:bg-bc-surface",
                      ].join(" ")}
                    >
                      {vibeCardLoading ? "Creating social card..." : "Generate Social Card"}
                    </button>
                  </div>

                  {magicSuggestError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                      {magicSuggestError}
                    </div>
                  )}

                  {magicSuggestion && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                      AI chose <span className="font-semibold">{magicSuggestion.color}</span> because{" "}
                      {magicSuggestion.reasoning}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-bc-text-soft">
                    Highlight Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOOKMARK_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setBookmarkDraft((draft) => ({ ...draft, color: color.value }))
                        }
                        className={[
                          "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all duration-200",
                          bookmarkDraft.color === color.value
                            ? "border-bc-border-strong bg-bc-surface shadow-bc-sm"
                            : "border-bc-border bg-bc-surface-muted hover:bg-bc-surface",
                        ].join(" ")}
                        title={`${color.label}: ${color.description}`}
                      >
                        <span className={["h-3 w-3 rounded-full", color.bg].join(" ")} />
                        <span className="text-bc-text">{color.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-bc-subtext">
                    {
                      BOOKMARK_COLORS.find((color) => color.value === bookmarkDraft.color)
                        ?.description
                    }
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-bc-border bg-bc-surface-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-bc-text-soft">Mood and Stickers</p>
                      <p className="mt-1 text-xs text-bc-subtext">
                        Pick one emoji to steer the AI, then place stickers on the card.
                      </p>
                    </div>
                    {selectedMoodEmoji && (
                      <button
                        type="button"
                        onClick={() => setSelectedMoodEmoji("")}
                        className="rounded-full border border-bc-border px-3 py-1 text-xs font-medium text-bc-text transition hover:bg-bc-surface"
                      >
                        Clear mood
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {MOOD_EMOJIS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setSelectedMoodEmoji((current) =>
                            current === option.value ? "" : option.value,
                          )
                        }
                        className={[
                          "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
                          selectedMoodEmoji === option.value
                            ? "border-[color:var(--bc-secondary)] bg-[color:var(--bc-secondary-soft)] text-bc-text shadow-bc-sm"
                            : "border-bc-border bg-bc-surface text-bc-text hover:bg-bc-surface-muted",
                        ].join(" ")}
                        title={option.label}
                      >
                        <span className="text-lg leading-none">{option.value}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => selectedMoodEmoji && handleAddSticker(selectedMoodEmoji)}
                      disabled={!selectedMoodEmoji}
                      className={[
                        MODAL_BUTTON_BASE,
                        MODAL_PILL_BUTTON,
                        selectedMoodEmoji
                          ? "border-bc-border-strong bg-bc-surface text-bc-text hover:border-[color:var(--bc-accent-plum)] hover:text-[color:var(--bc-accent-plum)]"
                          : "border-bc-border bg-bc-surface-muted text-bc-subtext",
                      ].join(" ")}
                    >
                      Add selected sticker
                    </button>
                    <button
                      type="button"
                      onClick={handleClearStickers}
                      disabled={vibeCardStickers.length === 0}
                      className={[
                        MODAL_BUTTON_BASE,
                        MODAL_PILL_BUTTON,
                        "border-bc-border bg-bc-surface-2 text-bc-text hover:bg-bc-surface",
                      ].join(" ")}
                    >
                      Clear stickers
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {vibeCardStickers.length > 0 ? (
                      vibeCardStickers.map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          onClick={() => handleRemoveSticker(sticker.id)}
                          className="rounded-full border border-bc-border bg-bc-surface px-3 py-1.5 text-sm text-bc-text transition hover:bg-bc-surface-muted"
                          title="Remove sticker"
                        >
                          <span className="mr-2 text-base">{sticker.emoji}</span>
                          Remove
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-bc-subtext">
                        No stickers on the card yet. Add one from the selected mood emoji.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-bc-text-soft">
                    Note{" "}
                    {magicSuggestion ? (
                      <span className="text-xs text-[color:var(--bc-accent-plum)]">
                        (AI-generated, editable)
                      </span>
                    ) : (
                      <span className="text-xs text-bc-subtext">(optional)</span>
                    )}
                  </label>
                  <textarea
                    value={bookmarkDraft.note}
                    onChange={(event) =>
                      setBookmarkDraft((draft) => ({ ...draft, note: event.target.value }))
                    }
                    placeholder="Add your thoughts about this passage..."
                    className="min-h-32 w-full rounded-2xl border border-bc-border bg-bc-surface-muted px-4 py-3 text-bc-text placeholder:text-bc-subtext focus:ring-2 focus:ring-bc-primary"
                    rows={5}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-bc-border bg-bc-surface-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-bc-text">Social Vibe Card</h4>
                    <p className="text-sm text-bc-subtext">
                      AI turns this passage into a shareable visual with a rotating style.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-bc-border bg-bc-surface px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-bc-subtext">
                      {activeVibeCardTheme.name}
                    </span>
                    {vibeCardResult && (
                      <button
                        type="button"
                        onClick={() => handleGenerateVibeCard()}
                        className="rounded-full border border-bc-border px-3 py-1.5 text-xs font-medium text-bc-text transition hover:bg-bc-surface"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                </div>

                {vibeCardError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {vibeCardError}
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-2xl border border-bc-border bg-bc-bg-elev shadow-bc-sm">
                  <div
                    className={[
                      "relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(232,169,169,0.55),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(138,169,143,0.5),transparent_30%),radial-gradient(circle_at_58%_86%,rgba(168,184,200,0.55),transparent_36%),linear-gradient(135deg,#7c3f22,#264f68_42%,#74435b_72%,#c46a2b)]",
                      activeVibeCardTheme.frameClass,
                    ].join(" ")}
                  >
                    {vibeCardLoading ? (
                      <div className="flex h-full items-center justify-center p-6 text-center">
                        <div>
                          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-bc-primary border-t-transparent" />
                          <p className="mt-4 text-sm font-medium text-bc-text">
                            Creating your social card...
                          </p>
                        </div>
                      </div>
                    ) : vibeCardResult ? (
                      <>
                        <img
                          key={vibeCardResult.imageUrl}
                          src={vibeCardResult.imageUrl}
                          alt="Generated social card"
                          className="absolute inset-0 h-full w-full object-cover mix-blend-normal"
                          onError={(event) => {
                            event.currentTarget.src =
                              getPollinationsImageUrl(FALLBACK_VIBE_PROMPT);
                          }}
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,102,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(159,123,140,0.28),transparent_38%)] mix-blend-screen" />
                        <div className={activeVibeCardTheme.overlayClass}>
                          <div className={activeVibeCardTheme.chipClass}>
                            {selectedMoodEmoji ? `${selectedMoodEmoji} ` : ""}
                            {activeVibeCardTheme.name}
                          </div>

                          {vibeCardStickers.map((sticker) => (
                            <div
                              key={sticker.id}
                              className="absolute flex items-center justify-center rounded-[18px] border border-white/25 bg-black/20 shadow-[0_10px_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
                              style={{
                                top: `${sticker.top}%`,
                                left: `${sticker.left}%`,
                                width: `${sticker.size + 18}px`,
                                height: `${sticker.size + 18}px`,
                                transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg)`,
                                fontSize: `${sticker.size}px`,
                              }}
                            >
                              {sticker.emoji}
                            </div>
                          ))}

                          <div className={activeVibeCardTheme.contentClass}>
                            <div className={activeVibeCardTheme.bodyClass}>
                            <p
                              className={activeVibeCardTheme.quoteClass}
                              style={{
                                fontFamily: activeVibeCardTheme.quoteFont,
                                fontSize: vibeQuoteStyle.fontSize,
                                fontStyle: "italic",
                                lineHeight: vibeQuoteStyle.lineHeight,
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: vibeQuoteStyle.maxLines,
                                overflow: "hidden",
                              }}
                              title={bookmarkDraft.text}
                            >
                              "{bookmarkDraft.text}"
                            </p>
                            <p
                              className={activeVibeCardTheme.captionClass}
                              style={{ fontFamily: activeVibeCardTheme.captionFont }}
                            >
                              {vibeCardResult.caption}
                            </p>
                            <p
                              className={activeVibeCardTheme.metaClass}
                              style={{ fontFamily: activeVibeCardTheme.metaFont }}
                            >
                              {book.title} • {book.author} • BookConnect
                            </p>
                          </div>
                        </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center">
                        <div>
                          <p className="text-base font-semibold text-bc-text">
                            No card generated yet
                          </p>
                          <p className="mt-2 text-sm text-bc-subtext">
                            Use the AI button to create an image and caption for this quote.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {vibeCardResult && (
                    <div className="border-t border-bc-border bg-bc-surface p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-bc-subtext">
                        AI caption
                      </p>
                      <p className="mt-1 text-sm text-bc-text">{vibeCardResult.caption}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadVibeCard(vibeCardResult.imageUrl)}
                          className={[
                            MODAL_BUTTON_BASE,
                            MODAL_PILL_BUTTON,
                            "border-bc-border-strong bg-bc-surface text-bc-text hover:border-[color:var(--bc-accent-plum)] hover:text-[color:var(--bc-accent-plum)]",
                          ].join(" ")}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleShareVibeCard(bookmarkDraft.text, vibeCardResult)
                          }
                          className="rounded-full border border-bc-border px-4 py-2 text-sm font-medium text-bc-text transition hover:bg-bc-surface-muted"
                        >
                          Share or Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeBookmarkModal}
                className="flex-1 rounded-xl border border-bc-border px-4 py-3 text-bc-text transition hover:bg-bc-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBookmark}
                disabled={vibeCardLoading}
                className={[
                  "flex-1 rounded-xl px-4 py-3 text-white shadow-bc-sm",
                  MODAL_BUTTON_BASE,
                  "bg-bc-text hover:bg-bc-text-soft hover:-translate-y-0.5 hover:shadow-bc-md",
                ].join(" ")}
              >
                {vibeCardLoading ? "Waiting for card..." : "Save Bookmark"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
