"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { libraryService, LibraryBook } from "@/lib/services/library";
import Link from "next/link";

export default function AdminBooksPage() {
    const { data: session } = useSession();
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        description: "",
        cover_url: "",
        pdf_url: "",
        epub_url: "",
        genres: [] as string[],
        language: "English",
        pages: 0,
        year_published: null as number | null,
        is_free: true,
        is_featured: false,
    });
    const [genreInput, setGenreInput] = useState("");

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            const data = await libraryService.getBooks();
            setBooks(data);
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            author: "",
            description: "",
            cover_url: "",
            pdf_url: "",
            epub_url: "",
            genres: [],
            language: "English",
            pages: 0,
            year_published: null,
            is_free: true,
            is_featured: false,
        });
        setGenreInput("");
        setEditingBook(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (book: LibraryBook) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            description: book.description,
            cover_url: book.cover_url,
            pdf_url: book.pdf_url,
            epub_url: book.epub_url,
            genres: book.genres || [],
            language: book.language,
            pages: book.pages,
            year_published: book.year_published,
            is_free: book.is_free,
            is_featured: book.is_featured,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.author) return;

        setSaving(true);
        try {
            if (editingBook) {
                await libraryService.updateBook(editingBook.id, formData);
            } else {
                await libraryService.createBook(formData);
            }
            setShowModal(false);
            resetForm();
            loadBooks();
        } catch (error) {
            console.error('Error saving book:', error);
            alert('Failed to save book');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (book: LibraryBook) => {
        if (!confirm(`Delete "${book.title}"? This action cannot be undone.`)) return;

        try {
            await libraryService.deleteBook(book.id);
            loadBooks();
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Failed to delete book');
        }
    };

    const handleToggleFeatured = async (book: LibraryBook) => {
        try {
            await libraryService.toggleFeatured(book.id);
            loadBooks();
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    const addGenre = () => {
        if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
            setFormData({
                ...formData,
                genres: [...formData.genres, genreInput.trim()]
            });
            setGenreInput("");
        }
    };

    const removeGenre = (genre: string) => {
        setFormData({
            ...formData,
            genres: formData.genres.filter(g => g !== genre)
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-purple-200 mb-2">
                                <Link href="/library" className="hover:text-white transition">
                                    ← Back to Library
                                </Link>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                📚 Admin: Manage Books
                            </h1>
                            <p className="text-purple-200 mt-2">
                                Add, edit, and manage books in the library
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition shadow-lg"
                        >
                            + Add New Book
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Books</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{books.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Featured</p>
                        <p className="text-3xl font-bold text-yellow-600">{books.filter(b => b.is_featured).length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Free Books</p>
                        <p className="text-3xl font-bold text-green-600">{books.filter(b => b.is_free).length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">With PDF</p>
                        <p className="text-3xl font-bold text-blue-600">{books.filter(b => b.pdf_url).length}</p>
                    </div>
                </div>

                {/* Books Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                    </div>
                ) : books.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow">
                        <p className="text-6xl mb-4">📚</p>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Books Yet</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Get started by adding your first book to the library.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                            + Add First Book
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Book</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Author</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Links</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {books.map((book) => (
                                    <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded flex items-center justify-center flex-shrink-0">
                                                    {book.cover_url ? (
                                                        <img src={book.cover_url} alt="" className="w-full h-full object-cover rounded" />
                                                    ) : (
                                                        <span>📖</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{book.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {book.pages} pages • {book.language}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{book.author}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {book.is_featured && (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs">
                                                        ⭐ Featured
                                                    </span>
                                                )}
                                                {book.is_free ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                                                        Free
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {book.pdf_url && (
                                                    <a
                                                        href={book.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-red-600 hover:underline text-sm"
                                                    >
                                                        PDF
                                                    </a>
                                                )}
                                                {book.epub_url && (
                                                    <a
                                                        href={book.epub_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        EPUB
                                                    </a>
                                                )}
                                                {!book.pdf_url && !book.epub_url && (
                                                    <span className="text-gray-400 text-sm">No files</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleFeatured(book)}
                                                    className={`p-2 rounded-lg transition ${book.is_featured
                                                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-yellow-600'
                                                        }`}
                                                    title={book.is_featured ? 'Remove from featured' : 'Add to featured'}
                                                >
                                                    ⭐
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(book)}
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book)}
                                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingBook ? '✏️ Edit Book' : '📚 Add New Book'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Author *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Language
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Cover Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.cover_url}
                                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        PDF URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.pdf_url}
                                        onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        EPUB URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.epub_url}
                                        onChange={(e) => setFormData({ ...formData, epub_url: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Number of Pages
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.pages}
                                        onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        min={0}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Year Published
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.year_published || ''}
                                        onChange={(e) => setFormData({ ...formData, year_published: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                        min={1000}
                                        max={2100}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Genres
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={genreInput}
                                            onChange={(e) => setGenreInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                                            placeholder="Add genre..."
                                        />
                                        <button
                                            type="button"
                                            onClick={addGenre}
                                            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl hover:bg-purple-200 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.genres.map((genre) => (
                                            <span
                                                key={genre}
                                                className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm flex items-center gap-1"
                                            >
                                                {genre}
                                                <button
                                                    type="button"
                                                    onClick={() => removeGenre(genre)}
                                                    className="hover:text-red-600"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_free}
                                            onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                                            className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">Free to read</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">Featured</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
