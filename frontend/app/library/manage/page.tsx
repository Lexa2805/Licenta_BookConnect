"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { libraryService, LibraryBook, CreateBookData } from "@/lib/services/library";

// ─── Icons ──────────────────────────────────────────────────────────────────
function IconSearch(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}
function IconPlus(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}
function IconEdit(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}
function IconTrash(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}
function IconTable(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
    );
}
function IconGrid(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );
}
function IconX(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
function IconCheck(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}
function IconStar(p: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...p} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

// ─── Initial empty form ───────────────────────────────────────────────────────
type BookFormData = {
    title: string;
    author: string;
    description: string;
    genres: string;
    language: string;
    pages: string;
    year_published: string;
    is_free: boolean;
    is_featured: boolean;
    cover_image?: File | null;
    cover_url: string;
    pdf_file?: File | null;
    pdf_url: string;
};

const EMPTY_FORM: BookFormData = {
    title: "",
    author: "",
    description: "",
    genres: "",
    language: "English",
    pages: "",
    year_published: "",
    is_free: true,
    is_featured: false,
    cover_image: null,
    cover_url: "",
    pdf_file: null,
    pdf_url: "",
};

// ─── Input helpers ────────────────────────────────────────────────────────────
const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
            {children}
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookManagePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Panel state
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LibraryBook | null>(null);

    // Form
    const [form, setForm] = useState<BookFormData>(EMPTY_FORM);
    const [coverPreview, setCoverPreview] = useState<string>("");
    const [pdfName, setPdfName] = useState<string>("");
    const coverRef = useRef<HTMLInputElement>(null);
    const pdfRef = useRef<HTMLInputElement>(null);

    const isAdmin = session?.user?.role === "admin";

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") loadBooks();
    }, [status]);

    const loadBooks = async () => {
        setLoading(true);
        try {
            const data = await libraryService.getBooks();
            setBooks(data);
        } catch (err) {
            showToast(getErrorMessage(err, "Failed to load books"), "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const getErrorMessage = (err: unknown, fallback: string) =>
        err instanceof Error ? err.message : fallback;

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return books;
        return books.filter(
            (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
        );
    }, [books, searchQuery]);

    // ── Panel helpers ──────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditingBook(null);
        setForm(EMPTY_FORM);
        setCoverPreview("");
        setPdfName("");
        setPanelOpen(true);
    };

    const openEdit = (book: LibraryBook) => {
        setEditingBook(book);
        setForm({
            title: book.title,
            author: book.author,
            description: book.description || "",
            genres: Array.isArray(book.genres) ? book.genres.join(", ") : "",
            language: book.language || "English",
            pages: book.pages ? String(book.pages) : "",
            year_published: book.year_published ? String(book.year_published) : "",
            is_free: book.is_free,
            is_featured: book.is_featured,
            cover_image: null,
            cover_url: book.cover_url || "",
            pdf_file: null,
            pdf_url: book.pdf_url || "",
        });
        setCoverPreview(book.cover || book.cover_url || "");
        setPdfName(book.pdf_file ? String(book.pdf_file).split("/").pop() || "" : "");
        setPanelOpen(true);
    };

    const closePanel = () => {
        setPanelOpen(false);
        setEditingBook(null);
    };

    // ── Form submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.author.trim()) {
            showToast("Title and author are required", "error");
            return;
        }
        setSaving(true);
        try {
            const payload: CreateBookData = {
                title: form.title.trim(),
                author: form.author.trim(),
                description: form.description.trim(),
                genres: form.genres ? form.genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
                language: form.language || "English",
                pages: form.pages ? parseInt(form.pages) : 0,
                year_published: form.year_published ? parseInt(form.year_published) : undefined,
                is_free: form.is_free,
                is_featured: form.is_featured,
                cover_url: form.cover_url || undefined,
                pdf_url: form.pdf_url || undefined,
            };
            if (form.cover_image) payload.cover_image = form.cover_image;
            if (form.pdf_file) payload.pdf_file = form.pdf_file;

            if (editingBook) {
                await libraryService.updateBook(editingBook.id, payload);
                showToast(`"${form.title}" updated successfully`);
            } else {
                await libraryService.createBook(payload);
                showToast(`"${form.title}" added to the library`);
            }
            closePanel();
            loadBooks();
        } catch (err) {
            showToast(getErrorMessage(err, "Failed to save book. Please try again."), "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await libraryService.deleteBook(deleteTarget.id);
            showToast(`"${deleteTarget.title}" deleted`);
            setDeleteTarget(null);
            loadBooks();
        } catch (err) {
            showToast(getErrorMessage(err, "Failed to delete book"), "error");
        }
    };

    // ── Cover file handling ────────────────────────────────────────────────────
    const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm((f) => ({ ...f, cover_image: file }));
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm((f) => ({ ...f, pdf_file: file }));
        setPdfName(file.name);
    };

    const f = (key: keyof BookFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
                >
                    {toast.type === "success" ? (
                        <IconCheck className="w-4 h-4 shrink-0" />
                    ) : (
                        <IconX className="w-4 h-4 shrink-0" />
                    )}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-amber-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-2xl font-bold text-amber-800 hover:text-amber-700 flex items-center gap-1.5">
                            <span>📚</span> BookConnect
                        </Link>
                        <span className="hidden sm:block text-gray-300">|</span>
                        <span className="hidden sm:block text-sm font-semibold text-gray-600">Book Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/library"
                            className="text-sm text-gray-500 hover:text-gray-800 transition hidden sm:block"
                        >
                            ← Back to Library
                        </Link>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-semibold text-sm shadow-sm"
                            >
                                <IconPlus className="w-4 h-4" />
                                Add Book
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Page title + stats */}
                <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Book Management</h1>
                        <p className="text-gray-500 text-sm mt-0.5">{books.length} book{books.length !== 1 ? "s" : ""} in the library</p>
                    </div>
                    {/* Stats pills */}
                    <div className="flex gap-3 text-xs text-gray-600">
                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm text-center">
                            <div className="text-2xl font-bold text-amber-700">{books.length}</div>
                            <div>Total</div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm text-center">
                            <div className="text-2xl font-bold text-green-600">{books.filter((b) => b.is_free).length}</div>
                            <div>Free</div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm text-center">
                            <div className="text-2xl font-bold text-yellow-500">{books.filter((b) => b.is_featured).length}</div>
                            <div>Featured</div>
                        </div>
                    </div>
                </div>

                {/* Search + View toggle */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by title or author…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            >
                                <IconX className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2.5 rounded-xl border transition ${viewMode === "table" ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                            title="Table view"
                        >
                            <IconTable className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2.5 rounded-xl border transition ${viewMode === "grid" ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                            title="Grid view"
                        >
                            <IconGrid className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-semibold text-sm shadow-sm"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span className="hidden sm:block">Add New Book</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-amber-200 shadow-sm">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {searchQuery ? `No results for "${searchQuery}"` : "No books yet"}
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            {searchQuery ? "Try a different search term." : "Add your first book to the library."}
                        </p>
                        {!searchQuery && isAdmin && (
                            <button
                                onClick={openAdd}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-semibold shadow-sm"
                            >
                                <IconPlus className="w-5 h-5" /> Add First Book
                            </button>
                        )}
                    </div>
                )}

                {/* TABLE VIEW */}
                {viewMode === "table" && filtered.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-amber-50 border-b border-amber-100 text-left text-xs uppercase tracking-wider text-amber-800 font-bold">
                                        <th className="px-4 py-3 w-16">Cover</th>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Author</th>
                                        <th className="px-4 py-3">Genres</th>
                                        <th className="px-4 py-3 w-16 text-center">Year</th>
                                        <th className="px-4 py-3 w-20 text-center">Status</th>
                                        {isAdmin && <th className="px-4 py-3 w-24 text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((book) => (
                                        <tr key={book.id} className="hover:bg-amber-50/30 transition group">
                                            <td className="px-4 py-3">
                                                <div className="w-10 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                                                    {book.cover || book.cover_url ? (
                                                        <img
                                                            src={book.cover || book.cover_url}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span className="text-lg">📖</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 line-clamp-2">{book.title}</div>
                                                {book.is_featured && (
                                                    <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600 font-medium">
                                                        <IconStar className="w-3 h-3" /> Featured
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-amber-700 font-medium">{book.author}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(book.genres || []).slice(0, 3).map((genre, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
                                                            {genre}
                                                        </span>
                                                    ))}
                                                    {(book.genres || []).length > 3 && (
                                                        <span className="text-xs text-gray-400">+{book.genres.length - 3}</span>
                                                    )}
                                                    {(!book.genres || book.genres.length === 0) && (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500">{book.year_published ?? "—"}</td>
                                            <td className="px-4 py-3 text-center">
                                                {book.is_free ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Free</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Premium</span>
                                                )}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => openEdit(book)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition"
                                                            title="Edit"
                                                        >
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(book)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                            title="Delete"
                                                        >
                                                            <IconTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* GRID VIEW */}
                {viewMode === "grid" && filtered.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-2">
                        {filtered.map((book) => (
                            <div
                                key={book.id}
                                className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
                            >
                                <div className="aspect-[2.5/4] bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
                                    {book.cover || book.cover_url ? (
                                        <img
                                            src={book.cover || book.cover_url}
                                            alt={book.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl">📖</span>
                                        </div>
                                    )}
                                    <div className="absolute top-0.5 left-0.5 flex flex-col gap-0.5">
                                        {book.is_featured && (
                                            <span className="px-1 py-0 rounded text-xs font-bold bg-yellow-400 text-yellow-900">⭐</span>
                                        )}
                                        {book.is_free && (
                                            <span className="px-1 py-0 rounded text-2xs font-bold bg-green-500 text-white">Free</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-1.5">
                                    <h3 className="font-semibold text-gray-900 text-2xs line-clamp-1 mb-0.5">{book.title}</h3>
                                    <p className="text-amber-600 text-2xs mb-1 truncate">{book.author}</p>
                                    {isAdmin && (
                                        <div className="flex gap-0.5">
                                            <button
                                                onClick={() => openEdit(book)}
                                                className="flex-1 flex items-center justify-center gap-0.5 px-1 py-0.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition font-medium"
                                            >
                                                <IconEdit className="w-2.5 h-2.5" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(book)}
                                                className="px-1 py-0.5 border border-gray-200 rounded text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                                            >
                                                <IconTrash className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── Side panel (add / edit) ─────────────────────────────────────── */}
            {panelOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closePanel} />
                    {/* Panel */}
                    <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in">
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-amber-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingBook ? "Edit Book" : "Add New Book"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {editingBook ? "Update the book details below" : "Fill in the details to add a book"}
                                </p>
                            </div>
                            <button onClick={closePanel} className="p-2 rounded-lg hover:bg-amber-100 transition text-gray-500">
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Panel body (scrollable) */}
                        <form id="book-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            {/* Basic info */}
                            <div className="space-y-4">
                                <Field label="Book Title *">
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={f("title")}
                                        placeholder="Enter book title"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Author *">
                                    <input
                                        type="text"
                                        required
                                        value={form.author}
                                        onChange={f("author")}
                                        placeholder="Enter author name"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Description">
                                    <textarea
                                        value={form.description}
                                        onChange={f("description")}
                                        placeholder="Brief description of the book…"
                                        rows={3}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Genres" hint="Comma-separated: Fiction, Classic, Drama">
                                    <input
                                        type="text"
                                        value={form.genres}
                                        onChange={f("genres")}
                                        placeholder="Fiction, Classic, Drama"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Language">
                                        <input type="text" value={form.language} onChange={f("language")} className={inputClass} />
                                    </Field>
                                    <Field label="Pages">
                                        <input type="number" min="0" value={form.pages} onChange={f("pages")} placeholder="0" className={inputClass} />
                                    </Field>
                                </div>
                                <Field label="Year Published">
                                    <input type="number" min="1000" max="2100" value={form.year_published} onChange={f("year_published")} placeholder="2024" className={inputClass} />
                                </Field>
                                <div className="flex gap-6 pt-1">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_free}
                                            onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))}
                                            className="h-4 w-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Free to Read</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_featured}
                                            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                                            className="h-4 w-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Featured</span>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Cover image */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Cover Image</h3>
                                <div className="flex gap-4">
                                    <div
                                        onClick={() => coverRef.current?.click()}
                                        className="w-24 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer border-2 border-dashed border-amber-200 hover:border-amber-400 transition shrink-0"
                                    >
                                        {coverPreview ? (
                                            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <div className="text-2xl mb-1">🖼️</div>
                                                <p className="text-xs">Click to upload</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input ref={coverRef} type="file" accept="image/*" onChange={onCoverChange} className="hidden" />
                                        <button
                                            type="button"
                                            onClick={() => coverRef.current?.click()}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                        >
                                            📤 Upload Cover Image
                                        </button>
                                        <Field label="or paste URL">
                                            <input
                                                type="url"
                                                value={form.cover_url}
                                                onChange={(e) => {
                                                    setForm((fv) => ({ ...fv, cover_url: e.target.value }));
                                                    if (e.target.value) setCoverPreview(e.target.value);
                                                }}
                                                placeholder="https://example.com/cover.jpg"
                                                className={inputClass}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* PDF */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">PDF File</h3>
                                <div className="flex flex-col gap-3">
                                    <input ref={pdfRef} type="file" accept=".pdf" onChange={onPdfChange} className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => pdfRef.current?.click()}
                                        className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-sm flex items-center justify-center gap-2 transition
                      ${pdfName ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-amber-400 hover:bg-amber-50"}`}
                                    >
                                        {pdfName ? (
                                            <>
                                                <IconCheck className="w-4 h-4 text-green-600" />
                                                <span className="truncate max-w-[240px]">{pdfName}</span>
                                            </>
                                        ) : (
                                            <>📄 Upload PDF File</>
                                        )}
                                    </button>
                                    <Field label="or paste PDF URL">
                                        <input
                                            type="url"
                                            value={form.pdf_url}
                                            onChange={f("pdf_url")}
                                            placeholder="https://example.com/book.pdf"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* Spacer for sticky footer */}
                            <div className="h-4" />
                        </form>

                        {/* Panel footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
                            <button
                                type="button"
                                onClick={closePanel}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="book-form"
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-semibold text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving…</>
                                ) : (
                                    <><IconCheck className="w-4 h-4" /> {editingBook ? "Save Changes" : "Add Book"}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirmation dialog ─────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                <IconTrash className="w-7 h-7 text-red-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Book</h3>
                        <p className="text-gray-500 text-sm text-center mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-gray-800">"{deleteTarget.title}"</span>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-sm shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
        </div>
    );
}
