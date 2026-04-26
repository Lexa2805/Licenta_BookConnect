"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { libraryService, LibraryBook, UserLibraryEntry, CreateBookData } from "@/lib/services/library";
import Link from "next/link";

export default function LibraryPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'browse' | 'my-library' | 'favorites' | 'admin'>('browse');
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [userLibrary, setUserLibrary] = useState<UserLibraryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    // Admin state
    const [showAddModal, setShowAddModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newBook, setNewBook] = useState<CreateBookData>({
        title: '',
        author: '',
        description: '',
        language: 'English',
        pages: 0,
        is_free: true,
        is_featured: false,
    });
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState<string>('');
    const coverInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const userId = session?.user?.id || "";
    const isAdmin = session?.user?.role === 'admin';

    useEffect(() => {
        loadData();
    }, [activeTab, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'browse' || activeTab === 'admin') {
                const [data, libData] = await Promise.all([
                    libraryService.getBooks({ search: searchQuery || undefined }),
                    userId ? libraryService.getUserLibrary(userId) : Promise.resolve([])
                ]);
                setBooks(data);
                if (userId) setUserLibrary(libData);
            } else if (activeTab === 'my-library') {
                if (userId) {
                    const data = await libraryService.getUserLibrary(userId, {
                        status: filterStatus || undefined
                    });
                    setUserLibrary(data);
                }
            } else if (activeTab === 'favorites') {
                if (userId) {
                    const data = await libraryService.getUserLibrary(userId, { favorites: true });
                    setUserLibrary(data);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const handleAddToLibrary = async (bookId: number) => {
        try {
            await libraryService.addToLibrary(userId, bookId);
            alert('Book added to your library!');
            loadData();
        } catch (error) {
            console.error('Error adding to library:', error);
        }
    };

    const handleToggleFavorite = async (entryId: number) => {
        try {
            await libraryService.toggleFavorite(entryId);
            loadData();
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleFavoriteFromBrowse = async (bookId: number) => {
        try {
            let entry = userLibrary.find(e => e.book.id === bookId);
            if (!entry) {
                entry = await libraryService.addToLibrary(userId, bookId);
            }
            await libraryService.toggleFavorite(entry.id);
            loadData();
        } catch (error) {
            console.error('Error toggling favorite from browse:', error);
        }
    };

    const handleRemoveFromLibrary = async (entryId: number) => {
        // Optimistically update the UI to feel instant
        setUserLibrary(prev => prev.filter(entry => entry.id !== entryId));
        
        try {
            if (activeTab === 'favorites') {
                // Just remove from favorites, don't delete from library entirely
                await libraryService.toggleFavorite(entryId);
            } else {
                // Delete the entire library entry
                await libraryService.removeFromLibrary(entryId);
            }
            loadData();
        } catch (error: any) {
            console.error('Error removing from library/favorites:', error);
            alert('Failed to remove: ' + error?.message);
            loadData();
        }
    };

    const handleRateBook = async (entryId: number, rating: number) => {
        try {
            await libraryService.rateBook(entryId, rating);
            loadData();
        } catch (error) {
            console.error('Error rating book:', error);
        }
    };

    // Admin functions
    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewBook({ ...newBook, cover_image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewBook({ ...newBook, pdf_file: file });
            setPdfName(file.name);
        }
    };

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBook.title || !newBook.author) {
            alert('Please fill in title and author');
            return;
        }

        setUploading(true);
        try {
            await libraryService.createBook(newBook);
            setShowAddModal(false);
            setNewBook({
                title: '',
                author: '',
                description: '',
                language: 'English',
                pages: 0,
                is_free: true,
                is_featured: false,
            });
            setCoverPreview(null);
            setPdfName('');
            loadData();
            alert('Book added successfully!');
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBook = async (bookId: number) => {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
            await libraryService.deleteBook(bookId);
            loadData();
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Failed to delete book.');
        }
    };

    const handleToggleFeatured = async (bookId: number) => {
        try {
            await libraryService.toggleFeatured(bookId);
            loadData();
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'WANT_TO_READ': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            'READING': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'FINISHED': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        };
        const labels: Record<string, string> = {
            'WANT_TO_READ': 'Want to Read',
            'READING': 'Reading',
            'FINISHED': 'Finished',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-gray-900">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-800 dark:to-orange-700">
                <div className="container mx-auto px-4 py-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        📚 Library
                    </h1>
                    <p className="text-amber-100 text-lg max-w-2xl">
                        Browse our collection, add books to your library, track your reading progress, and mark your favorites.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === 'browse'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        🔍 Browse Books
                    </button>
                    <button
                        onClick={() => setActiveTab('my-library')}
                        className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === 'my-library'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        📖 My Library
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === 'favorites'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        ❤️ Favorites
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === 'admin'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            ⚙️ Admin Panel
                        </button>
                    )}
                </div>

                {/* Search & Filters */}
                {activeTab === 'browse' && (
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Search books by title, author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-amber-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'my-library' && (
                    <div className="mb-8">
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setTimeout(loadData, 0);
                            }}
                            className="px-4 py-3 rounded-xl border border-amber-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                        >
                            <option value="">All Books</option>
                            <option value="WANT_TO_READ">Want to Read</option>
                            <option value="READING">Currently Reading</option>
                            <option value="FINISHED">Finished</option>
                        </select>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                    </div>
                ) : activeTab === 'browse' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {books.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">
                                    No books available yet. Check back soon!
                                </p>
                            </div>
                        ) : (
                            books.map((book) => (
                                <div
                                    key={book.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                                >
                                    <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 relative">
                                        {(book.cover || book.cover_url) ? (
                                            <img
                                                src={book.cover || book.cover_url}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-6xl">📖</span>
                                            </div>
                                        )}
                                        {book.is_featured && (
                                            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                                                ⭐ Featured
                                            </div>
                                        )}
                                        {book.is_free && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                Free
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-1 gap-2">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                                                {book.title}
                                            </h3>
                                            {userId && (
                                                <button
                                                    onClick={() => handleFavoriteFromBrowse(book.id)}
                                                    className="text-xl flex-shrink-0"
                                                    title={userLibrary.find(e => e.book.id === book.id)?.is_favorite ? "Remove from favorites" : "Add to favorites"}
                                                >
                                                    {userLibrary.find(e => e.book.id === book.id)?.is_favorite ? '❤️' : '🤍'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-amber-600 dark:text-amber-400 text-sm mb-2">
                                            {book.author}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                            {book.description || "No description available."}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddToLibrary(book.id)}
                                                className="flex-1 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition text-sm font-medium"
                                            >
                                                + Add to Library
                                            </button>
                                            {(book.pdf || book.pdf_url) && (
                                                <Link
                                                    href={`/library/read/${book.id}`}
                                                    className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm font-medium"
                                                >
                                                    Read
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* My Library / Favorites View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userLibrary.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                                    {activeTab === 'favorites'
                                        ? "You haven't added any favorites yet."
                                        : "Your library is empty."}
                                </p>
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
                                >
                                    Browse Books
                                </button>
                            </div>
                        ) : (
                            userLibrary.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                                >
                                    <div className="flex">
                                        <div className="w-32 h-44 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex-shrink-0">
                                            {(entry.book.cover || entry.book.cover_url) ? (
                                                <img
                                                    src={entry.book.cover || entry.book.cover_url}
                                                    alt={entry.book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-4xl">📖</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">
                                                    {entry.book.title}
                                                </h3>
                                                <button
                                                    onClick={() => handleToggleFavorite(entry.id)}
                                                    className="text-2xl"
                                                >
                                                    {entry.is_favorite ? '❤️' : '🤍'}
                                                </button>
                                            </div>
                                            <p className="text-amber-600 dark:text-amber-400 text-sm mb-2">
                                                {entry.book.author}
                                            </p>
                                            {activeTab !== 'favorites' && (
                                                <>
                                                    <div className="mb-3">
                                                        {getStatusBadge(entry.status)}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {entry.book.pages > 0 && (
                                                        <div className="mb-3">
                                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                <span>Page {entry.current_page} of {entry.book.pages}</span>
                                                                <span>{Math.round((entry.current_page / entry.book.pages) * 100)}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-500 transition-all"
                                                                    style={{ width: `${(entry.current_page / entry.book.pages) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Rating */}
                                                    <div className="flex items-center gap-1 mb-3">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => handleRateBook(entry.id, star)}
                                                                className="text-lg"
                                                            >
                                                                {star <= (entry.rating || 0) ? '⭐' : '☆'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex gap-2">
                                                {(entry.book.pdf || entry.book.pdf_url) && (
                                                    <Link
                                                        href={`/library/read/${entry.book.id}`}
                                                        className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                                                    >
                                                        📖 Read
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveFromLibrary(entry.id)}
                                                    className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Admin View */}
                {activeTab === 'admin' && isAdmin && (
                    <div>
                        {/* Admin header */}
                        <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Library Management</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{books.length} books in the library</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/library/manage"
                                    className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-semibold text-sm shadow-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Open Management Dashboard
                                </Link>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm shadow-sm"
                                >
                                    ➕ Quick Add
                                </button>
                            </div>
                        </div>

                        {/* Books Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {books.length === 0 ? (
                                <div className="col-span-full text-center py-16">
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        No books in the library yet. Add your first book!
                                    </p>
                                </div>
                            ) : (
                                books.map((book) => (
                                    <div
                                        key={book.id}
                                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
                                    >
                                        <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative">
                                            {(book.cover || book.cover_url) ? (
                                                <img
                                                    src={book.cover || book.cover_url}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-6xl">📖</span>
                                                </div>
                                            )}
                                            {book.is_featured && (
                                                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                                                    ⭐ Featured
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-1">
                                                {book.title}
                                            </h3>
                                            <p className="text-purple-600 dark:text-purple-400 text-sm mb-2">
                                                {book.author}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                                {book.description || "No description"}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleFeatured(book.id)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${book.is_featured
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {book.is_featured ? '⭐ Featured' : '☆ Feature'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBook(book.id)}
                                                    className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Add Book Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Add New Book
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setNewBook({ title: '', author: '', description: '', pages: 0 });
                                            setCoverPreview(null);
                                            setPdfName('');
                                        }}
                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Cover Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Cover Image
                                        </label>
                                        <input
                                            type="file"
                                            ref={coverInputRef}
                                            onChange={handleCoverSelect}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => coverInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition"
                                        >
                                            {coverPreview ? (
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover preview"
                                                    className="w-32 h-44 object-cover mx-auto rounded-lg"
                                                />
                                            ) : (
                                                <div className="py-8">
                                                    <span className="text-4xl">🖼️</span>
                                                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                                                        Click to upload cover image
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={newBook.title}
                                            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Enter book title"
                                        />
                                    </div>

                                    {/* Author */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Author *
                                        </label>
                                        <input
                                            type="text"
                                            value={newBook.author}
                                            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Enter author name"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={newBook.description}
                                            onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                            placeholder="Enter book description"
                                        />
                                    </div>

                                    {/* Pages */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Number of Pages
                                        </label>
                                        <input
                                            type="number"
                                            value={newBook.pages || ''}
                                            onChange={(e) => setNewBook({ ...newBook, pages: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Enter number of pages"
                                            min="0"
                                        />
                                    </div>

                                    {/* PDF Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            PDF File
                                        </label>
                                        <input
                                            type="file"
                                            ref={pdfInputRef}
                                            onChange={handlePdfSelect}
                                            accept=".pdf"
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => pdfInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition"
                                        >
                                            {pdfName ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-2xl">📄</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{pdfName}</span>
                                                </div>
                                            ) : (
                                                <div className="py-4">
                                                    <span className="text-4xl">📄</span>
                                                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                                                        Click to upload PDF file
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleAddBook}
                                        disabled={uploading || !newBook.title || !newBook.author}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? 'Adding Book...' : 'Add Book'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
