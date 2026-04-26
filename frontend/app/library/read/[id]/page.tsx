"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { libraryService, LibraryBook, Bookmark } from "@/lib/services/library";
import {
    generateBookmarkSuggestion,
    generateVibeCardPrompt,
    getPollinationsImageUrl,
    type BookmarkSuggestion,
    type VibeCardResult,
} from "@/lib/services/ai";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import PdfViewer to avoid SSR issues with react-pdf
const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-gray-600">Loading PDF viewer...</span>
        </div>
    ),
});

export default function BookReaderPage() {
    const params = useParams();
    const { data: session } = useSession();
    const id = parseInt(params.id as string);

    // ── Core reader state ────────────────────────────────
    const [book, setBook] = useState<LibraryBook | null>(null);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [showAddBookmark, setShowAddBookmark] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [bookmarkNote, setBookmarkNote] = useState("");
    const [bookmarkColor, setBookmarkColor] = useState("yellow");
    const [fontSize, setFontSize] = useState(16);
    const [isDarkReader, setIsDarkReader] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfScale, setPdfScale] = useState(1.0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // ── Magic Suggest state ──────────────────────────────
    const [magicSuggestLoading, setMagicSuggestLoading] = useState(false);
    const [magicSuggestError, setMagicSuggestError] = useState<string | null>(null);
    const [magicSuggestion, setMagicSuggestion] = useState<BookmarkSuggestion | null>(null);

    // ── Emoji / Sticker state ────────────────────────────
    const [selectedEmoji, setSelectedEmoji] = useState<string>("");

    // ── Vibe Card state ──────────────────────────────────
    const [vibeCardLoading, setVibeCardLoading] = useState(false);
    const [vibeCardError, setVibeCardError] = useState<string | null>(null);
    const [vibeCardResult, setVibeCardResult] = useState<VibeCardResult | null>(null);
    const [showVibeCard, setShowVibeCard] = useState(false);
    // Vibe card from sidebar bookmark
    const [sidebarVibeLoading, setSidebarVibeLoading] = useState<number | null>(null);
    const [sidebarVibeResult, setSidebarVibeResult] = useState<{ bookmarkId: number; result: VibeCardResult } | null>(null);

    const vibeCardRef = useRef<HTMLDivElement>(null);
    const userId = session?.user?.id || "user_123";

    // ── Data loading ─────────────────────────────────────

    useEffect(() => {
        loadBook();
        loadBookmarks();
        loadSavedProgress();
    }, [id, userId]);

    const loadBook = async () => {
        try {
            const data = await libraryService.getBook(id);
            setBook(data);
        } catch (error) {
            console.error('Error loading book:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedProgress = async () => {
        try {
            const library = await libraryService.getUserLibrary(userId);
            const entry = library.find(e => e.book.id === id);
            if (entry && entry.current_page > 0) {
                setCurrentPage(entry.current_page);
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    };

    const loadBookmarks = async () => {
        try {
            const data = await libraryService.getBookmarks(userId, id);
            setBookmarks(data);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    };

    // ── Text selection ───────────────────────────────────

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString());
            setShowAddBookmark(true);
            // Reset AI states when new text is selected
            setMagicSuggestion(null);
            setMagicSuggestError(null);
            setVibeCardResult(null);
            setVibeCardError(null);
            setShowVibeCard(false);
        }
    };

    // ── Bookmark CRUD ────────────────────────────────────

    const handleAddBookmark = async () => {
        try {
            const emojiSuffix = selectedEmoji ? ` ${selectedEmoji}` : "";
            await libraryService.createBookmark({
                user_id: userId,
                book: id,
                page_number: currentPage,
                paragraph_text: selectedText,
                note: bookmarkNote + emojiSuffix,
                color: bookmarkColor,
            });
            setShowAddBookmark(false);
            setSelectedText("");
            setBookmarkNote("");
            setSelectedEmoji("");
            setMagicSuggestion(null);
            setVibeCardResult(null);
            setShowVibeCard(false);
            loadBookmarks();
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }
    };

    const handleDeleteBookmark = async (bookmarkId: number) => {
        try {
            await libraryService.deleteBookmark(bookmarkId);
            loadBookmarks();
        } catch (error) {
            console.error('Error deleting bookmark:', error);
        }
    };

    const handleSaveProgress = async () => {
        try {
            setSaveStatus('saving');
            const library = await libraryService.getUserLibrary(userId);
            let entry = library.find(e => e.book.id === id);
            
            if (!entry) {
                entry = await libraryService.addToLibrary(userId, id);
            }

            if (entry) {
                await libraryService.updateProgress(entry.id, currentPage);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('idle');
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            setSaveStatus('idle');
        }
    };

    // ── Magic Suggest handler ────────────────────────────

    const handleMagicSuggest = useCallback(async () => {
        if (!selectedText.trim() || !book) return;

        setMagicSuggestLoading(true);
        setMagicSuggestError(null);
        setMagicSuggestion(null);

        try {
            const suggestion = await generateBookmarkSuggestion(
                selectedText,
                book.title,
                book.author
            );
            setMagicSuggestion(suggestion);
            setBookmarkNote(suggestion.note);
            setBookmarkColor(suggestion.color);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate suggestion";
            setMagicSuggestError(message);
        } finally {
            setMagicSuggestLoading(false);
        }
    }, [selectedText, book]);

    // ── Vibe Card handler ────────────────────────────────

    const handleGenerateVibeCard = useCallback(async (text?: string, color?: string) => {
        const textToUse = text || selectedText;
        if (!textToUse.trim() || !book) return;

        setVibeCardLoading(true);
        setVibeCardError(null);
        setVibeCardResult(null);
        setShowVibeCard(true);

        try {
            const result = await generateVibeCardPrompt(
                textToUse,
                book.title,
                book.author,
                color || bookmarkColor
            );
            setVibeCardResult(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate vibe card";
            setVibeCardError(message);
        } finally {
            setVibeCardLoading(false);
        }
    }, [selectedText, book, bookmarkColor]);

    // ── Sidebar vibe card handler ────────────────────────

    const handleSidebarVibeCard = useCallback(async (bookmark: Bookmark) => {
        if (!book) return;
        setSidebarVibeLoading(bookmark.id);
        setSidebarVibeResult(null);

        try {
            const result = await generateVibeCardPrompt(
                bookmark.paragraph_text || bookmark.note,
                book.title,
                book.author,
                bookmark.color
            );
            setSidebarVibeResult({ bookmarkId: bookmark.id, result });
        } catch (err) {
            console.error('Error generating sidebar vibe card:', err);
        } finally {
            setSidebarVibeLoading(null);
        }
    }, [book]);

    // ── Download vibe card ───────────────────────────────

    const handleDownloadVibeCard = useCallback(async (imageUrl: string, caption: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookconnect-vibe-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: open image in new tab
            window.open(imageUrl, '_blank');
        }
    }, []);

    // ── Constants ─────────────────────────────────────────

    const colorOptions = [
        { value: 'yellow', bg: 'bg-yellow-300', label: 'Yellow', desc: 'Key quote' },
        { value: 'green', bg: 'bg-green-300', label: 'Green', desc: 'Character' },
        { value: 'blue', bg: 'bg-blue-300', label: 'Blue', desc: 'World-building' },
        { value: 'pink', bg: 'bg-pink-300', label: 'Pink', desc: 'Emotional' },
        { value: 'purple', bg: 'bg-purple-300', label: 'Purple', desc: 'Philosophical' },
    ];

    const getBookmarkBgClass = (color: string): string => {
        const map: Record<string, string> = {
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
            green: 'bg-green-50 dark:bg-green-900/20 border-green-400',
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400',
            pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-400',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-400',
        };
        return map[color] || map.purple;
    };

    // ── Loading / error states ───────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Book not found</p>
                    <Link href="/library" className="text-amber-600 hover:underline">
                        ← Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────

    return (
        <div className={`min-h-screen ${isDarkReader ? 'bg-gray-900' : 'bg-amber-50 dark:bg-gray-900'}`}>
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-amber-200 dark:border-gray-700 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/library"
                                className="p-2 hover:bg-amber-100 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                ← Back
                            </Link>
                            <div>
                                <h1 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                    {book.title}
                                </h1>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    {book.author}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Page Navigation */}
                            {(book.pages > 0 || totalPages > 0) && (
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage <= 1}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                                    >
                                        ‹
                                    </button>
                                    <input
                                        type="number"
                                        value={currentPage}
                                        onChange={(e) => setCurrentPage(Math.min(totalPages || book.pages, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-16 text-center bg-transparent border-none focus:ring-0"
                                        min={1}
                                        max={totalPages || book.pages}
                                    />
                                    <span className="text-gray-500">/ {totalPages || book.pages}</span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages || book.pages, currentPage + 1))}
                                        disabled={currentPage >= (totalPages || book.pages)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                                    >
                                        ›
                                    </button>
                                </div>
                            )}

                            {/* Zoom / Font Size */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                                <button
                                    onClick={() => {
                                        setFontSize(Math.max(12, fontSize - 2));
                                        setPdfScale(Math.max(0.5, pdfScale - 0.1));
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
                                >
                                    A-
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400 px-1">{fontSize}</span>
                                <button
                                    onClick={() => {
                                        setFontSize(Math.min(24, fontSize + 2));
                                        setPdfScale(Math.min(2.0, pdfScale + 0.1));
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
                                >
                                    A+
                                </button>
                            </div>

                            {/* Dark Reader Toggle */}
                            <button
                                onClick={() => setIsDarkReader(!isDarkReader)}
                                className={`p-2 rounded-lg transition ${isDarkReader
                                    ? 'bg-gray-700 text-yellow-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                title="Toggle dark reader mode"
                            >
                                {isDarkReader ? '☀️' : '🌙'}
                            </button>

                            {/* Bookmarks Toggle */}
                            <button
                                onClick={() => setShowBookmarks(!showBookmarks)}
                                className={`p-2 rounded-lg transition relative ${showBookmarks
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                title="Bookmarks"
                            >
                                🔖
                                {bookmarks.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {bookmarks.length}
                                    </span>
                                )}
                            </button>

                            {/* Save Progress */}
                            <button
                                onClick={handleSaveProgress}
                                disabled={saveStatus === 'saving'}
                                className={`px-4 py-2 rounded-lg transition text-sm font-medium ${saveStatus === 'saved'
                                        ? 'bg-green-600 text-white'
                                        : saveStatus === 'saving'
                                            ? 'bg-green-400 text-white cursor-wait'
                                            : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                            >
                                {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save Progress'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Main Content */}
                <div className="flex-1 h-[calc(100vh-80px)] overflow-auto" onMouseUp={handleTextSelection}>
                    {(book.pdf || book.pdf_url) ? (
                        <PdfViewer
                            pdfUrl={book.pdf || book.pdf_url}
                            currentPage={currentPage}
                            onPageChange={(page) => setCurrentPage(page)}
                            onLoadSuccess={(numPages) => setTotalPages(numPages)}
                            isDarkMode={isDarkReader}
                            scale={pdfScale}
                        />
                    ) : (
                        <div
                            className={`max-w-3xl mx-auto p-8 ${isDarkReader ? 'text-gray-200' : 'text-gray-800 dark:text-gray-200'}`}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                        >
                            <p className="text-center text-gray-500 py-20">
                                No PDF available for this book. Please contact the administrator.
                            </p>
                        </div>
                    )}
                </div>

                {/* Bookmarks Sidebar */}
                {showBookmarks && (
                    <div className="w-80 bg-white dark:bg-gray-800 border-l border-amber-200 dark:border-gray-700 h-[calc(100vh-80px)] overflow-y-auto">
                        <div className="p-4">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                                🔖 Your Bookmarks
                            </h2>
                            {bookmarks.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No bookmarks yet. Select text in the book to add a bookmark.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {bookmarks.map((bookmark) => (
                                        <div
                                            key={bookmark.id}
                                            className={`p-3 rounded-lg border-l-4 ${getBookmarkBgClass(bookmark.color)}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Page {bookmark.page_number}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {/* Vibe Card button on each bookmark */}
                                                    {bookmark.paragraph_text && (
                                                        <button
                                                            onClick={() => handleSidebarVibeCard(bookmark)}
                                                            disabled={sidebarVibeLoading === bookmark.id}
                                                            className="text-xs px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 transition text-amber-700 dark:text-amber-300"
                                                            title="Generate Vibe Card"
                                                        >
                                                            {sidebarVibeLoading === bookmark.id ? (
                                                                <span className="inline-block animate-spin">⟳</span>
                                                            ) : (
                                                                '🎨'
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteBookmark(bookmark.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            {bookmark.paragraph_text && (
                                                <p className="text-sm italic text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                                                    &quot;{bookmark.paragraph_text}&quot;
                                                </p>
                                            )}
                                            {bookmark.note && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    📝 {bookmark.note}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(bookmark.page_number)}
                                                className="mt-2 text-xs text-amber-600 hover:underline"
                                            >
                                                Go to page →
                                            </button>

                                            {/* Sidebar Vibe Card Result */}
                                            {sidebarVibeResult?.bookmarkId === bookmark.id && (
                                                <div className="mt-3 float-in">
                                                    <div className="vibe-card aspect-square w-full">
                                                        <img
                                                            key={sidebarVibeResult.result.imageUrl}
                                                            src={sidebarVibeResult.result.imageUrl}
                                                            alt="Vibe card"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getPollinationsImageUrl("abstract warm golden watercolor book aesthetic");
                                                            }}
                                                        />
                                                        <div className="vibe-card-overlay">
                                                            <p 
                                                                className="vibe-card-text vibe-card-quote whitespace-pre-wrap leading-tight"
                                                                style={{ fontSize: (bookmark.paragraph_text?.length || 0) > 300 ? '0.7rem' : (bookmark.paragraph_text?.length || 0) > 150 ? '0.85rem' : '1.125rem' }}
                                                            >
                                                                {bookmark.paragraph_text}
                                                            </p>
                                                            <p className="vibe-card-text vibe-card-caption">
                                                                {sidebarVibeResult.result.caption}
                                                            </p>
                                                            <p className="vibe-card-text vibe-card-meta">
                                                                {book.title} • BookConnect
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 mt-2">
                                                        <button
                                                            onClick={() => handleDownloadVibeCard(sidebarVibeResult.result.imageUrl, sidebarVibeResult.result.caption)}
                                                            className="flex-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition"
                                                        >
                                                            ⬇ Save
                                                        </button>
                                                        <button
                                                            onClick={() => setSidebarVibeResult(null)}
                                                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Bookmark Modal (with Magic Suggest + Vibe Card) ── */}
            {showAddBookmark && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto float-in shadow-2xl border border-amber-200/30 dark:border-amber-700/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Add Bookmark
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddBookmark(false);
                                    setSelectedText("");
                                    setBookmarkNote("");
                                    setMagicSuggestion(null);
                                    setVibeCardResult(null);
                                    setShowVibeCard(false);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                <span className="text-gray-500 text-xl">✕</span>
                            </button>
                        </div>

                        {/* Selected Text Preview */}
                        {selectedText && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4 border border-amber-200/50 dark:border-amber-700/40">
                                <p className="text-sm italic text-gray-700 dark:text-gray-300 line-clamp-3">
                                    &quot;{selectedText}&quot;
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Page {currentPage}
                                </p>
                            </div>
                        )}

                        {/* ═══ Magic Suggest Button ═══ */}
                        {selectedText && (
                            <div className="mb-4">
                                <button
                                    onClick={handleMagicSuggest}
                                    disabled={magicSuggestLoading}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                                        magicSuggestLoading
                                            ? 'bg-gradient-to-r from-amber-400 to-purple-400 text-white cursor-wait ai-shimmer'
                                            : magicSuggestion
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 text-white hover:from-amber-600 hover:via-orange-600 hover:to-purple-700 shadow-lg hover:shadow-xl magic-suggest-glow'
                                    }`}
                                >
                                    {magicSuggestLoading ? (
                                        <>
                                            <span className="animate-spin">⟳</span>
                                            Analyzing passage...
                                        </>
                                    ) : magicSuggestion ? (
                                        <>
                                            <span>✓</span>
                                            Suggestion Applied — Click to Re-analyze
                                        </>
                                    ) : (
                                        <>
                                            <span className="sparkle-icon text-lg">✨</span>
                                            Magic Suggest
                                        </>
                                    )}
                                </button>

                                {/* Magic Suggest Error */}
                                {magicSuggestError && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            ⚠ {magicSuggestError}
                                        </p>
                                    </div>
                                )}

                                {/* Magic Suggest Result Badge */}
                                {magicSuggestion && (
                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg float-in">
                                        <p className="text-xs text-green-700 dark:text-green-400 italic">
                                            💡 {magicSuggestion.reasoning}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Color Picker */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Highlight Color
                            </label>
                            <div className="flex gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setBookmarkColor(color.value)}
                                        className={`w-8 h-8 rounded-full ${color.bg} transition-all duration-200 ${bookmarkColor === color.value
                                            ? 'ring-2 ring-offset-2 ring-gray-600 scale-110'
                                            : 'hover:scale-105'
                                            }`}
                                        title={`${color.label} — ${color.desc}`}
                                    />
                                ))}
                            </div>
                            {bookmarkColor && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {colorOptions.find(c => c.value === bookmarkColor)?.desc}
                                </p>
                            )}
                        </div>

                        {/* Emoji & Sticker Picker */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mood & Sticker
                            </label>
                            <div className="grid grid-cols-9 gap-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                {[
                                    { emoji: '📖', label: 'Reading' },
                                    { emoji: '💡', label: 'Idea' },
                                    { emoji: '❤️', label: 'Love' },
                                    { emoji: '🔥', label: 'Fire' },
                                    { emoji: '😢', label: 'Sad' },
                                    { emoji: '😍', label: 'Heart eyes' },
                                    { emoji: '🤔', label: 'Thinking' },
                                    { emoji: '⭐', label: 'Star' },
                                    { emoji: '✨', label: 'Sparkle' },
                                    { emoji: '🌹', label: 'Rose' },
                                    { emoji: '🌙', label: 'Moon' },
                                    { emoji: '☀️', label: 'Sun' },
                                    { emoji: '🦋', label: 'Butterfly' },
                                    { emoji: '🎭', label: 'Drama' },
                                    { emoji: '💎', label: 'Gem' },
                                    { emoji: '🗡️', label: 'Sword' },
                                    { emoji: '🏰', label: 'Castle' },
                                    { emoji: '🌊', label: 'Wave' },
                                    { emoji: '🍂', label: 'Autumn' },
                                    { emoji: '🌸', label: 'Blossom' },
                                    { emoji: '🎵', label: 'Music' },
                                    { emoji: '💀', label: 'Skull' },
                                    { emoji: '👑', label: 'Crown' },
                                    { emoji: '🕊️', label: 'Peace' },
                                    { emoji: '💫', label: 'Dizzy' },
                                    { emoji: '🫶', label: 'Heart hands' },
                                    { emoji: '😈', label: 'Devil' },
                                ].map(({ emoji, label }) => (
                                    <button
                                        key={emoji}
                                        onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                                        className={`text-xl p-1.5 rounded-lg transition-all duration-200 hover:scale-125 ${
                                            selectedEmoji === emoji
                                                ? 'bg-amber-200 dark:bg-amber-700 scale-110 ring-2 ring-amber-400 shadow-md'
                                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                        title={label}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            {selectedEmoji && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                    <span className="text-base">{selectedEmoji}</span> will be added to your bookmark
                                </p>
                            )}
                        </div>

                        {/* Note Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Note {magicSuggestion ? <span className="text-amber-500 text-xs">(AI-generated — feel free to edit)</span> : <span className="text-gray-400 text-xs">(optional)</span>}
                            </label>
                            <textarea
                                value={bookmarkNote}
                                onChange={(e) => setBookmarkNote(e.target.value)}
                                placeholder="Add your thoughts about this passage..."
                                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500 transition-all ${
                                    magicSuggestion
                                        ? 'border-amber-400 dark:border-amber-600'
                                        : 'border-amber-200 dark:border-gray-600'
                                }`}
                                rows={3}
                            />
                        </div>

                        {/* ═══ Generate Vibe Card Button ═══ */}
                        {selectedText && (
                            <div className="mb-4">
                                <button
                                    onClick={() => handleGenerateVibeCard(undefined, bookmarkColor)}
                                    disabled={vibeCardLoading}
                                    className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 border ${
                                        vibeCardLoading
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-500 cursor-wait ai-shimmer'
                                            : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:shadow-md'
                                    }`}
                                >
                                    {vibeCardLoading ? (
                                        <>
                                            <span className="animate-spin">⟳</span>
                                            Creating vibe card...
                                        </>
                                    ) : (
                                        <>
                                            🎨 Generate Social Vibe Card
                                        </>
                                    )}
                                </button>

                                {vibeCardError && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            ⚠ {vibeCardError}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ Vibe Card Preview ═══ */}
                        {showVibeCard && (vibeCardLoading || vibeCardResult) && (
                            <div className="mb-4 float-in">
                                <div className="vibe-card aspect-square w-full" ref={vibeCardRef}>
                                    {vibeCardLoading ? (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-100 to-amber-200 dark:from-purple-900 dark:via-pink-900 dark:to-amber-900 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-3"></div>
                                                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                                    Generating your vibe...
                                                </p>
                                            </div>
                                        </div>
                                    ) : vibeCardResult ? (
                                        <>
                                            <img
                                                key={vibeCardResult.imageUrl}
                                                src={vibeCardResult.imageUrl}
                                                alt="Vibe card"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = getPollinationsImageUrl("abstract warm golden watercolor book aesthetic");
                                                }}
                                            />
                                            <div className="vibe-card-overlay">
                                                <p 
                                                    className="vibe-card-text vibe-card-quote whitespace-pre-wrap leading-tight"
                                                    style={{ fontSize: selectedText.length > 300 ? '0.75rem' : selectedText.length > 150 ? '0.9rem' : '1.125rem' }}
                                                >
                                                    {selectedText}
                                                </p>
                                                <p className="vibe-card-text vibe-card-caption">
                                                    {vibeCardResult.caption}
                                                </p>
                                                <p className="vibe-card-text vibe-card-meta">
                                                    — {book.title} by {book.author} • BookConnect
                                                </p>
                                            </div>
                                        </>
                                    ) : null}
                                </div>

                                {/* Vibe Card Actions */}
                                {vibeCardResult && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleDownloadVibeCard(vibeCardResult.imageUrl, vibeCardResult.caption)}
                                            className="flex-1 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition flex items-center justify-center gap-1"
                                        >
                                            ⬇ Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: `${book.title} — BookConnect Vibe`,
                                                        text: `"${selectedText.slice(0, 100)}..." — ${book.title} by ${book.author}\n${vibeCardResult.caption}`,
                                                        url: vibeCardResult.imageUrl,
                                                    }).catch(() => {});
                                                } else {
                                                    navigator.clipboard.writeText(
                                                        `"${selectedText.slice(0, 100)}..." — ${book.title} by ${book.author}\n${vibeCardResult.caption}\n${vibeCardResult.imageUrl}`
                                                    );
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition flex items-center justify-center gap-1"
                                        >
                                            📤 Share
                                        </button>
                                        <button
                                            onClick={() => handleGenerateVibeCard(undefined, bookmarkColor)}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                            title="Regenerate with new style"
                                        >
                                            🔄
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAddBookmark(false);
                                    setSelectedText("");
                                    setBookmarkNote("");
                                    setMagicSuggestion(null);
                                    setVibeCardResult(null);
                                    setShowVibeCard(false);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddBookmark}
                                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition shadow-md hover:shadow-lg"
                            >
                                Save Bookmark
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
