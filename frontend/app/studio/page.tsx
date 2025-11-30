"use client";

import { useEffect, useState } from "react";
import { manuscriptsService } from "@/lib/services/manuscripts";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Manuscript {
    id: number;
    title: string;
    status: string;
    updated_at: string;
}

export default function StudioPage() {
    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadManuscripts();
    }, []);

    const loadManuscripts = () => {
        // In a real app, we'd filter by current user ID
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
        const title = prompt("Enter manuscript title:");
        if (!title) return;

        try {
            const newManuscript = await manuscriptsService.createManuscript({
                title,
                author_id: "user_123" // Mock user ID
            });
            router.push(`/studio/editor/${newManuscript.id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create manuscript");
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Creative Studio</h1>
                <button
                    onClick={handleCreate}
                    className="btn-primary"
                >
                    New Manuscript
                </button>
            </div>

            {loading ? (
                <p className="text-amber-800 dark:text-amber-200">Loading manuscripts...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {manuscripts.map((manuscript) => (
                        <div key={manuscript.id} className="border border-amber-200 dark:border-amber-700/50 rounded-xl p-6 shadow-sm hover:shadow-md transition bg-white dark:bg-amber-900/30">
                            <h2 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">{manuscript.title}</h2>
                            <div className="flex justify-between items-center mt-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${manuscript.status === 'PUBLISHED' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200'
                                    }`}>
                                    {manuscript.status}
                                </span>
                                <span className="text-sm text-amber-800/60 dark:text-amber-300/60">
                                    Updated: {new Date(manuscript.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Link
                                    href={`/studio/editor/${manuscript.id}`}
                                    className="text-amber-700 dark:text-orange-400 hover:text-amber-900 dark:hover:text-orange-300 font-medium"
                                >
                                    Open Editor &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
