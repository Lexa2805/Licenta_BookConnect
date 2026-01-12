"use client";

import { useEffect, useState } from "react";
import { chatService, Conversation } from "@/lib/services/chat";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MessagesPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUserId = session?.user?.id || "";

    useEffect(() => {
        if (currentUserId) {
            loadConversations();
        }
    }, [currentUserId]);

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations(currentUserId);
            setConversations(data);
        } catch (err) {
            console.error("Failed to load conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Acum";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
    };

    if (!session?.user) {
        return (
            <div className="container mx-auto p-4 text-center py-20">
                <span className="text-6xl mb-4 block">💬</span>
                <p className="text-amber-800 dark:text-amber-200 mb-4">Please log in to view your messages.</p>
                <Link href="/login" className="btn-primary">Log In</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-3">
                    <span>💬</span> Messages
                </h1>
                <p className="text-amber-600 dark:text-amber-400 mt-1">
                    Your conversations with other users
                </p>
            </div>

            <div className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 dark:border-amber-400"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl mb-4 block">📭</span>
                        <p className="text-amber-700 dark:text-amber-300 text-lg mb-2">No messages yet</p>
                        <p className="text-amber-600 dark:text-amber-400 text-sm mb-6">
                            Start a conversation by contacting a seller from the marketplace
                        </p>
                        <Link href="/marketplace" className="btn-primary">
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-amber-100 dark:divide-amber-800/50">
                        {conversations.map((conv) => (
                            <Link
                                key={conv.participant_id}
                                href={`/community/dm/${conv.participant_id}?name=${encodeURIComponent(conv.participant_name)}`}
                                className="flex items-center gap-4 p-4 hover:bg-amber-50 dark:hover:bg-amber-800/30 transition"
                            >
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-semibold text-amber-800 dark:text-amber-200">
                                        {conv.participant_name[0]?.toUpperCase() || '?'}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 truncate">
                                            {conv.participant_name}
                                        </h3>
                                        <span className="text-xs text-amber-500 dark:text-amber-400 flex-shrink-0 ml-2">
                                            {formatTime(conv.last_message_time)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-amber-600 dark:text-amber-400 truncate">
                                        {conv.last_message}
                                    </p>
                                </div>

                                {/* Unread badge */}
                                {conv.unread_count > 0 && (
                                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {conv.unread_count}
                                    </div>
                                )}

                                {/* Arrow */}
                                <svg className="w-5 h-5 text-amber-400 dark:text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
