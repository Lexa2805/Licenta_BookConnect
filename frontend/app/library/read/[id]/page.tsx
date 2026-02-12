"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { libraryService, LibraryBook, Bookmark } from "@/lib/services/library";
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
    const router = useRouter();
    const { data: session } = useSession();
    const id = parseInt(params.id as string);

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

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const userId = session?.user?.id || "user_123";

    useEffect(() => {
        loadBook();
        loadBookmarks();
        loadSavedProgress();
    }, [id]);

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

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString());
            setShowAddBookmark(true);
        }
    };

    const handleAddBookmark = async () => {
        try {
            await libraryService.createBookmark({
                user_id: userId,
                book: id,
                page_number: currentPage,
                paragraph_text: selectedText,
                note: bookmarkNote,
                color: bookmarkColor,
            });
            setShowAddBookmark(false);
            setSelectedText("");
            setBookmarkNote("");
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
            // Find user's library entry for this book
            const library = await libraryService.getUserLibrary(userId);
            const entry = library.find(e => e.book.id === id);
            if (entry) {
                await libraryService.updateProgress(entry.id, currentPage);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            setSaveStatus('idle');
        }
    };

    const colorOptions = [
        { value: 'yellow', bg: 'bg-yellow-300', label: 'Yellow' },
        { value: 'green', bg: 'bg-green-300', label: 'Green' },
        { value: 'blue', bg: 'bg-blue-300', label: 'Blue' },
        { value: 'pink', bg: 'bg-pink-300', label: 'Pink' },
        { value: 'purple', bg: 'bg-purple-300', label: 'Purple' },
    ];

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
                                            className={`p-3 rounded-lg border-l-4 ${bookmark.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' :
                                                bookmark.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-400' :
                                                    bookmark.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                                                        bookmark.color === 'pink' ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-400' :
                                                            'bg-purple-50 dark:bg-purple-900/20 border-purple-400'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Page {bookmark.page_number}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteBookmark(bookmark.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            {bookmark.paragraph_text && (
                                                <p className="text-sm italic text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                                                    "{bookmark.paragraph_text}"
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Bookmark Modal */}
            {showAddBookmark && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Add Bookmark
                        </h3>

                        {selectedText && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
                                <p className="text-sm italic text-gray-700 dark:text-gray-300 line-clamp-3">
                                    "{selectedText}"
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Highlight Color
                            </label>
                            <div className="flex gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setBookmarkColor(color.value)}
                                        className={`w-8 h-8 rounded-full ${color.bg} ${bookmarkColor === color.value
                                            ? 'ring-2 ring-offset-2 ring-gray-600'
                                            : ''
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Note (optional)
                            </label>
                            <textarea
                                value={bookmarkNote}
                                onChange={(e) => setBookmarkNote(e.target.value)}
                                placeholder="Add your thoughts about this passage..."
                                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAddBookmark(false);
                                    setSelectedText("");
                                    setBookmarkNote("");
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddBookmark}
                                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
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
