"use client";

import { useEffect, useState } from "react";
import { manuscriptsService } from "@/lib/services/manuscripts";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params.id);
    const { data: session, status } = useSession();
    const userId = session?.user?.id as string | undefined;

    const [manuscript, setManuscript] = useState<any>(null);
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const isOwner = Boolean(userId && manuscript?.author_id === userId);

    useEffect(() => {
        if (status === "loading") return;

        if (id) {
            const loadManuscript = userId
                ? manuscriptsService.getManuscript(id, userId).catch(() => manuscriptsService.getManuscript(id))
                : manuscriptsService.getManuscript(id);

            loadManuscript
                .then((data: any) => {
                    setManuscript(data);
                    setTitle(data.title || "");
                    setAuthorName(data.author_name || "");
                    setContent(data.content);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [id, status, userId]);

    const handleSave = async () => {
        if (!isOwner || !userId) return;

        setSaving(true);
        try {
            const updated = await manuscriptsService.updateManuscript(
                id,
                {
                    title: title.trim(),
                    author_name: authorName.trim(),
                    content,
                },
                userId,
            );
            setManuscript(updated);
            setSaving(false);
        } catch (err) {
            console.error(err);
            setSaving(false);
            alert("Failed to save");
        }
    };

    const handlePublish = async () => {
        if (!isOwner || !userId) return;
        const cleanTitle = title.trim();
        const cleanAuthorName = authorName.trim();

        if (!cleanTitle || !cleanAuthorName) {
            alert("Please add both the manuscript title and author name before publishing.");
            return;
        }

        if (!confirm("Are you sure you want to publish this manuscript? It will be visible to everyone.")) return;

        try {
            await manuscriptsService.updateManuscript(
                id,
                {
                    title: cleanTitle,
                    author_name: cleanAuthorName,
                    content,
                    status: "PUBLISHED",
                },
                userId,
            );
            alert("Published successfully!");
            router.push("/studio");
        } catch (err) {
            console.error(err);
            alert("Failed to publish");
        }
    };

    const handleMakePrivate = async () => {
        if (!isOwner || !userId) return;
        if (!confirm("Make this manuscript private? Only you will be able to read it.")) return;

        try {
            await manuscriptsService.updateManuscript(id, { status: "DRAFT" }, userId);
            setManuscript((current: any) => ({ ...current, status: "DRAFT" }));
        } catch (err) {
            console.error(err);
            alert("Failed to make manuscript private");
        }
    };

    const handleDelete = async () => {
        if (!isOwner || !userId) return;
        if (!confirm("Delete this manuscript permanently? This cannot be undone.")) return;

        setDeleting(true);
        try {
            await manuscriptsService.deleteManuscript(id, userId);
            router.push("/studio");
        } catch (err) {
            console.error(err);
            setDeleting(false);
            alert("Failed to delete manuscript");
        }
    };

    if (loading) return <div className="p-4 text-gray-900 dark:text-amber-100">Loading editor...</div>;
    if (!manuscript) return <div className="p-4 text-gray-900 dark:text-amber-100">Manuscript not found</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-amber-950">
            <header className="bg-white dark:bg-amber-900/50 border-b border-amber-200 dark:border-amber-700/50 px-6 py-3 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-amber-100">{title || manuscript.title}</h1>
                    <span className="text-sm text-gray-500 dark:text-amber-300">
                        {manuscript.status === "PUBLISHED" ? "Public" : "Private"}
                        {authorName.trim() ? ` by ${authorName.trim()}` : ""}
                        {!isOwner ? " - read only" : ""}
                    </span>
                </div>
                {isOwner && (
                <div className="space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || deleting}
                        className="px-4 py-2 bg-gray-200 dark:bg-amber-800/40 text-gray-900 dark:text-amber-100 rounded hover:bg-gray-300 dark:hover:bg-amber-700/50 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Draft"}
                    </button>
                    {manuscript.status !== 'PUBLISHED' && (
                        <button
                            onClick={handlePublish}
                            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800"
                        >
                            Publish
                        </button>
                    )}
                    {manuscript.status === 'PUBLISHED' && (
                        <button
                            onClick={handleMakePrivate}
                            className="px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded hover:bg-amber-700 dark:hover:bg-amber-800"
                        >
                            Make Private
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
                )}
            </header>

            <main className="flex flex-1 flex-col overflow-hidden p-6">
                {isOwner && (
                    <div className="mb-3 grid gap-3 rounded-lg border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/30 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-amber-300">
                                Title
                            </span>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="h-10 w-full rounded border border-amber-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100 dark:focus:border-orange-500 dark:focus:ring-orange-900/40"
                                placeholder="Manuscript title"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-amber-300">
                                Author name
                            </span>
                            <input
                                value={authorName}
                                onChange={(event) => setAuthorName(event.target.value)}
                                className="h-10 w-full rounded border border-amber-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100 dark:focus:border-orange-500 dark:focus:ring-orange-900/40"
                                placeholder="Name shown on public works"
                            />
                        </label>
                    </div>
                )}
                {manuscript.cover_url && (
                    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100">
                        <img
                            src={manuscript.cover_url}
                            alt={`${manuscript.title} cover`}
                            className="h-24 w-16 rounded border border-amber-200 object-cover shadow-sm dark:border-amber-700/50"
                        />
                        <div className="min-w-0">
                            <div className="font-semibold">Manuscript cover</div>
                            <div className="mt-1 text-gray-500 dark:text-amber-300">
                                {manuscript.cover_tagline || "Saved from the Studio cover generator."}
                            </div>
                        </div>
                    </div>
                )}
                {manuscript.file_url && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100">
                        <div>
                            <span className="font-semibold">Uploaded file:</span>{" "}
                            {manuscript.original_filename || "Manuscript file"}
                            {!content.trim() && (
                                <span className="ml-2 text-gray-500 dark:text-amber-300">
                                    Text preview was not available for this file type. Open the file to read it.
                                </span>
                            )}
                        </div>
                        <a
                            href={manuscript.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
                        >
                            Open file
                        </a>
                    </div>
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    readOnly={!isOwner}
                    className="min-h-0 w-full flex-1 resize-none rounded-lg border border-amber-200 bg-white p-6 font-serif text-lg leading-relaxed text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-100 dark:placeholder-amber-400 dark:focus:ring-orange-500"
                    placeholder="Start writing your masterpiece..."
                />
            </main>
        </div>
    );
}
