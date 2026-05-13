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
            await manuscriptsService.updateManuscript(id, { content }, userId);
            setSaving(false);
        } catch (err) {
            console.error(err);
            setSaving(false);
            alert("Failed to save");
        }
    };

    const handlePublish = async () => {
        if (!isOwner || !userId) return;
        if (!confirm("Are you sure you want to publish this manuscript? It will be visible to everyone.")) return;

        try {
            await manuscriptsService.publishManuscript(id, userId);
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-amber-100">{manuscript.title}</h1>
                    <span className="text-sm text-gray-500 dark:text-amber-300">
                        {manuscript.status === "PUBLISHED" ? "Public" : "Private"}
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

            <main className="flex-1 p-6 overflow-hidden">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    readOnly={!isOwner}
                    className="w-full h-full p-6 border border-amber-200 dark:border-amber-700/50 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500 font-serif text-lg leading-relaxed bg-white dark:bg-amber-900/30 text-gray-900 dark:text-amber-100 placeholder-gray-400 dark:placeholder-amber-400"
                    placeholder="Start writing your masterpiece..."
                />
            </main>
        </div>
    );
}
