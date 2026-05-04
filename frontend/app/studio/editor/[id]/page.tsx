"use client";

import { useEffect, useState } from "react";
import { manuscriptsService } from "@/lib/services/manuscripts";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const { data: session, status } = useSession();
    const userId = session?.user?.id as string | undefined;

    const [manuscript, setManuscript] = useState<any>(null);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (id && userId) {
            manuscriptsService.getManuscript(id, userId)
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

    if (loading) return <div className="p-4 text-gray-900 dark:text-amber-100">Loading editor...</div>;
    if (!manuscript) return <div className="p-4 text-gray-900 dark:text-amber-100">Manuscript not found</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-amber-950">
            <header className="bg-white dark:bg-amber-900/50 border-b border-amber-200 dark:border-amber-700/50 px-6 py-3 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-amber-100">{manuscript.title}</h1>
                    <span className="text-sm text-gray-500 dark:text-amber-300">{manuscript.status}</span>
                </div>
                <div className="space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
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
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full p-6 border border-amber-200 dark:border-amber-700/50 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500 font-serif text-lg leading-relaxed bg-white dark:bg-amber-900/30 text-gray-900 dark:text-amber-100 placeholder-gray-400 dark:placeholder-amber-400"
                    placeholder="Start writing your masterpiece..."
                />
            </main>
        </div>
    );
}
