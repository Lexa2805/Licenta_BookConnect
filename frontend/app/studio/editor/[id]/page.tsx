"use client";

import { useEffect, useState, useCallback } from "react";
import { manuscriptsService } from "@/lib/services/manuscripts";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [manuscript, setManuscript] = useState<any>(null);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (id) {
            manuscriptsService.getManuscript(id)
                .then((data) => {
                    setManuscript(data);
                    setContent(data.content || "");
                    setTitle(data.title);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    // Track unsaved changes
    useEffect(() => {
        if (manuscript) {
            const hasChanges = content !== (manuscript.content || "") || title !== manuscript.title;
            setHasUnsavedChanges(hasChanges);
        }
    }, [content, title, manuscript]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const updated = await manuscriptsService.updateManuscript(id, { content, title });
            setManuscript(updated);
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            setSaving(false);
        } catch (err) {
            console.error(err);
            setSaving(false);
            alert("Failed to save");
        }
    }, [id, content, title]);

    // Auto-save every 30 seconds if there are unsaved changes
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 30000);

        return () => clearTimeout(timer);
    }, [hasUnsavedChanges, handleSave]);

    // Keyboard shortcut for save (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const toggleVisibility = async () => {
        try {
            let updated;
            if (manuscript.status === 'PUBLISHED') {
                updated = await manuscriptsService.makePrivate(id);
            } else {
                updated = await manuscriptsService.publishManuscript(id);
            }
            setManuscript(updated);
        } catch (err) {
            console.error(err);
            alert("Failed to update visibility");
        }
    };

    const getWordCount = () => {
        if (!content) return 0;
        return content.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const getCharCount = () => {
        return content.length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 dark:border-amber-400 mx-auto mb-4"></div>
                    <p className="text-amber-800 dark:text-amber-200">Loading editor...</p>
                </div>
            </div>
        );
    }

    if (!manuscript) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">Manuscript not found</h2>
                    <Link href="/studio" className="text-amber-700 dark:text-orange-400 hover:underline">
                        ← Back to Studio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
            {/* Header */}
            <header className="bg-white/80 dark:bg-amber-900/60 backdrop-blur-sm border-b border-amber-200 dark:border-amber-700/50 px-4 md:px-6 py-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/studio"
                            className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300 transition-colors"
                            title="Back to Studio"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-bold text-amber-900 dark:text-amber-100 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                placeholder="Untitled Manuscript"
                            />
                            <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400">
                                {hasUnsavedChanges && (
                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                        Unsaved changes
                                    </span>
                                )}
                                {lastSaved && !hasUnsavedChanges && (
                                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Visibility Toggle */}
                        <button
                            onClick={toggleVisibility}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${manuscript.status === 'PUBLISHED'
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                                : 'bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                                }`}
                        >
                            {manuscript.status === 'PUBLISHED' ? (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden sm:inline">Public</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden sm:inline">Private</span>
                                </>
                            )}
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasUnsavedChanges}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-700 dark:bg-amber-800 text-white rounded-lg hover:bg-amber-800 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    <span className="hidden sm:inline">Save</span>
                                </>
                            )}
                        </button>

                        {/* Download Button */}
                        <button
                            onClick={() => manuscriptsService.downloadManuscript(id, title)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all font-medium"
                            title="Download as TXT"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Editor Area */}
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 p-4 md:p-8 overflow-auto">
                    <div className="max-w-4xl mx-auto h-full">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[500px] p-6 md:p-10 border-0 rounded-2xl shadow-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-orange-500 font-serif text-lg leading-relaxed bg-white dark:bg-amber-900/40 text-amber-950 dark:text-amber-50 placeholder-amber-400 dark:placeholder-amber-500"
                            placeholder="Begin your story here...

Let your imagination flow freely. This is your canvas to create worlds, characters, and adventures that will captivate your readers.

Press Ctrl+S to save your progress at any time."
                        />
                    </div>
                </div>

                {/* Footer Stats */}
                <footer className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-sm border-t border-amber-200 dark:border-amber-700/50 px-6 py-3">
                    <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {getWordCount().toLocaleString()} words
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                {getCharCount().toLocaleString()} characters
                            </span>
                        </div>
                        <div className="text-amber-600 dark:text-amber-400">
                            <kbd className="px-2 py-1 bg-amber-100 dark:bg-amber-800/50 rounded text-xs">Ctrl+S</kbd> to save
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
