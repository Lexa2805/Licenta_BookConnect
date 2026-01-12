"use client";

import { useEffect, useState } from "react";
import { manuscriptsService } from "@/lib/services/manuscripts";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Manuscript {
    id: number;
    title: string;
    content: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function StudioPage() {
    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'published' | 'archived'>('all');
    const router = useRouter();

    useEffect(() => {
        loadManuscripts();
    }, []);

    const loadManuscripts = () => {
        manuscriptsService.getManuscripts()
            .then((data) => {
                setManuscripts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);

        try {
            const newManuscript = await manuscriptsService.createManuscript({
                title: newTitle,
                author_id: "user_123"
            });
            setShowCreateModal(false);
            setNewTitle("");
            router.push(`/studio/editor/${newManuscript.id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create manuscript");
        } finally {
            setCreating(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle.trim()) return;
        setUploading(true);

        try {
            const newManuscript = await manuscriptsService.uploadManuscript(
                uploadFile,
                uploadTitle,
                "user_123"
            );
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadTitle("");
            router.push(`/studio/editor/${newManuscript.id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to upload manuscript");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            // Auto-fill title from filename if empty
            if (!uploadTitle) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                setUploadTitle(nameWithoutExt);
            }
        }
    };

    const toggleVisibility = async (manuscript: Manuscript) => {
        try {
            if (manuscript.status === 'PUBLISHED') {
                await manuscriptsService.makePrivate(manuscript.id);
            } else {
                await manuscriptsService.publishManuscript(manuscript.id);
            }
            loadManuscripts();
        } catch (err) {
            console.error(err);
            alert("Failed to update visibility");
        }
    };

    const handleArchive = async (id: number) => {
        if (!confirm("Are you sure you want to archive this manuscript?")) return;
        try {
            await manuscriptsService.archiveManuscript(id);
            loadManuscripts();
        } catch (err) {
            console.error(err);
            alert("Failed to archive manuscript");
        }
    };

    const handleDownload = async (manuscript: Manuscript) => {
        try {
            await manuscriptsService.downloadManuscript(manuscript.id, manuscript.title);
        } catch (err) {
            console.error(err);
            alert("Failed to download manuscript");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to permanently delete this manuscript? This action cannot be undone.")) return;
        try {
            await manuscriptsService.deleteManuscript(id);
            loadManuscripts();
        } catch (err) {
            console.error(err);
            alert("Failed to delete manuscript");
        }
    };

    const filteredManuscripts = manuscripts.filter(m => {
        if (activeTab === 'all') return true;
        if (activeTab === 'drafts') return m.status === 'DRAFT';
        if (activeTab === 'published') return m.status === 'PUBLISHED';
        if (activeTab === 'archived') return m.status === 'ARCHIVED';
        return true;
    });

    const getWordCount = (content: string) => {
        if (!content) return 0;
        return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const stats = {
        total: manuscripts.length,
        drafts: manuscripts.filter(m => m.status === 'DRAFT').length,
        published: manuscripts.filter(m => m.status === 'PUBLISHED').length,
        archived: manuscripts.filter(m => m.status === 'ARCHIVED').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-amber-800 to-orange-900 dark:from-amber-900 dark:to-orange-950 text-white">
                <div className="container mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Creative Studio
                            </h1>
                            <p className="text-amber-200 text-lg">Write, edit, and publish your manuscripts</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Manuscript
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.total}</div>
                            <div className="text-amber-200 text-sm">Total Works</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.drafts}</div>
                            <div className="text-amber-200 text-sm">Drafts</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.published}</div>
                            <div className="text-amber-200 text-sm">Published</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold">{stats.archived}</div>
                            <div className="text-amber-200 text-sm">Archived</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(['all', 'drafts', 'published', 'archived'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize whitespace-nowrap ${activeTab === tab
                                ? 'bg-amber-800 dark:bg-amber-700 text-white shadow-md'
                                : 'bg-white/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-white dark:hover:bg-amber-900/60'
                                }`}
                        >
                            {tab === 'all' ? 'All Manuscripts' : tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 dark:border-amber-400"></div>
                    </div>
                ) : filteredManuscripts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-full mb-4">
                            <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">No manuscripts yet</h3>
                        <p className="text-amber-700 dark:text-amber-300 mb-4">Start your writing journey by creating your first manuscript</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Create Your First Manuscript
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredManuscripts.map((manuscript) => (
                            <div
                                key={manuscript.id}
                                className="group bg-white dark:bg-amber-900/30 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100 dark:border-amber-800/50"
                            >
                                {/* Card Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 line-clamp-2 flex-1">
                                            {manuscript.title}
                                        </h2>
                                        <span className={`ml-2 shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${manuscript.status === 'PUBLISHED'
                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                            : manuscript.status === 'ARCHIVED'
                                                ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                                                : 'bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300'
                                            }`}>
                                            {manuscript.status === 'PUBLISHED' && (
                                                <span className="inline-flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Public
                                                </span>
                                            )}
                                            {manuscript.status === 'DRAFT' && (
                                                <span className="inline-flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Private
                                                </span>
                                            )}
                                            {manuscript.status === 'ARCHIVED' && 'Archived'}
                                        </span>
                                    </div>

                                    {/* Word count & dates */}
                                    <div className="flex items-center gap-4 text-sm text-amber-700/70 dark:text-amber-300/70 mb-4">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {getWordCount(manuscript.content).toLocaleString()} words
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(manuscript.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Preview text */}
                                    <p className="text-amber-800/60 dark:text-amber-200/60 text-sm line-clamp-3 min-h-[3.75rem]">
                                        {manuscript.content ? manuscript.content.substring(0, 150) + (manuscript.content.length > 150 ? '...' : '') : 'No content yet...'}
                                    </p>
                                </div>

                                {/* Card Actions */}
                                <div className="px-6 py-4 bg-amber-50/50 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-800/30">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={`/studio/editor/${manuscript.id}`}
                                            className="inline-flex items-center gap-2 text-amber-700 dark:text-orange-400 hover:text-amber-900 dark:hover:text-orange-300 font-semibold transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            {/* Visibility Toggle */}
                                            {manuscript.status !== 'ARCHIVED' && (
                                                <button
                                                    onClick={() => toggleVisibility(manuscript)}
                                                    className={`p-2 rounded-lg transition-all ${manuscript.status === 'PUBLISHED'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                        : 'bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50'
                                                        }`}
                                                    title={manuscript.status === 'PUBLISHED' ? 'Make Private' : 'Make Public'}
                                                >
                                                    {manuscript.status === 'PUBLISHED' ? (
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}

                                            {/* Archive Button */}
                                            {manuscript.status !== 'ARCHIVED' && (
                                                <button
                                                    onClick={() => handleArchive(manuscript.id)}
                                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all"
                                                    title="Archive"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Download Button */}
                                            <button
                                                onClick={() => handleDownload(manuscript)}
                                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                                                title="Download"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(manuscript.id)}
                                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-amber-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-700 to-orange-800 dark:from-amber-800 dark:to-orange-900 p-6 text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Start a New Story
                            </h2>
                            <p className="text-amber-200 mt-1">Every great book begins with a single word</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                                Manuscript Title
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Enter your manuscript title..."
                                className="w-full px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-orange-500 bg-white dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewTitle("");
                                    }}
                                    className="flex-1 px-4 py-3 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-800/30 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim() || creating}
                                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        "Create & Start Writing"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-amber-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-700 to-orange-800 dark:from-amber-800 dark:to-orange-900 p-6 text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload Manuscript
                            </h2>
                            <p className="text-amber-200 mt-1">Import your existing work (TXT, MD files)</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                                Select File
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".txt,.md,.text"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-800/30 transition-colors"
                                >
                                    {uploadFile ? (
                                        <div className="text-center">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-amber-800 dark:text-amber-200 font-medium">{uploadFile.name}</span>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                {(uploadFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-amber-700 dark:text-amber-300">Click to select a file</span>
                                            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">TXT, MD files supported</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2 mt-4">
                                Manuscript Title
                            </label>
                            <input
                                type="text"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder="Enter title for your manuscript..."
                                className="w-full px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-orange-500 bg-white dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500"
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFile(null);
                                        setUploadTitle("");
                                    }}
                                    className="flex-1 px-4 py-3 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-800/30 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadFile || !uploadTitle.trim() || uploading}
                                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        "Upload & Edit"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
