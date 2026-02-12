"use client";

import { useEffect, useState } from "react";
import { chatService, ChatGroup, Conversation } from "@/lib/services/chat";
import { useSession } from "next-auth/react";
import Link from "next/link";

type TabType = "messages" | "groups" | "discover";

export default function CommunityPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [myGroups, setMyGroups] = useState<ChatGroup[]>([]);
    const [allGroups, setAllGroups] = useState<ChatGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("messages");

    const currentUserId = session?.user?.id || "";

    useEffect(() => {
        if (currentUserId) {
            loadAllData();
        }
    }, [currentUserId]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [convs, all, my] = await Promise.all([
                chatService.getConversations(currentUserId),
                chatService.getGroups(),
                chatService.getMyGroups(currentUserId)
            ]);
            setConversations(convs);
            setAllGroups(all);
            setMyGroups(my);
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || !currentUserId) return;

        setCreating(true);
        try {
            await chatService.createGroup({
                name: newGroupName.trim(),
                description: newGroupDescription.trim(),
                created_by: currentUserId
            });
            setNewGroupName("");
            setNewGroupDescription("");
            setShowCreateModal(false);
            await loadAllData();
            setActiveTab("groups");
        } catch (err) {
            console.error("Failed to create group:", err);
            alert("Failed to create group. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleJoinGroup = async (groupId: number) => {
        if (!currentUserId) {
            alert("Please log in to join groups.");
            return;
        }
        try {
            await chatService.joinGroup(groupId, currentUserId);
            await loadAllData();
        } catch (err) {
            console.error("Failed to join group:", err);
            alert("Failed to join group.");
        }
    };

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return "";
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

    const myGroupIds = new Set(myGroups.map(g => g.id));
    const discoverGroups = allGroups.filter(g => !myGroupIds.has(g.id));

    if (!session?.user) {
        return (
            <div className="container mx-auto p-4 text-center py-20">
                <span className="text-6xl mb-4 block">💬</span>
                <p className="text-amber-800 dark:text-amber-200 mb-4">Please log in to access the community.</p>
                <Link href="/login" className="btn-primary">Log In</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-3">
                        <span>💬</span> Community
                    </h1>
                    <p className="text-amber-600 dark:text-amber-400 mt-1">
                        Messages and group discussions
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-amber-200 dark:border-amber-700/50 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("messages")}
                    className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${activeTab === "messages"
                            ? "text-amber-900 dark:text-amber-100"
                            : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Messages
                    </span>
                    {conversations.length > 0 && (
                        <span className="ml-2 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full">
                            {conversations.length}
                        </span>
                    )}
                    {activeTab === "messages" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("groups")}
                    className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${activeTab === "groups"
                            ? "text-amber-900 dark:text-amber-100"
                            : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        My Groups
                    </span>
                    {myGroups.length > 0 && (
                        <span className="ml-2 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full">
                            {myGroups.length}
                        </span>
                    )}
                    {activeTab === "groups" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("discover")}
                    className={`px-4 py-2 font-medium transition-colors relative whitespace-nowrap ${activeTab === "discover"
                            ? "text-amber-900 dark:text-amber-100"
                            : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Discover
                    </span>
                    {discoverGroups.length > 0 && (
                        <span className="ml-2 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full">
                            {discoverGroups.length}
                        </span>
                    )}
                    {activeTab === "discover" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 dark:border-amber-400"></div>
                </div>
            ) : activeTab === "messages" ? (
                /* Messages Tab */
                <div className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl overflow-hidden shadow-sm">
                    {conversations.length === 0 ? (
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
                                    <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-semibold text-amber-800 dark:text-amber-200">
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
            ) : activeTab === "groups" ? (
                /* My Groups Tab */
                myGroups.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <span className="text-6xl mb-4 block">📚</span>
                        <p className="text-amber-700 dark:text-amber-300 text-lg mb-2">You have not joined any groups yet</p>
                        <p className="text-amber-600 dark:text-amber-400 text-sm mb-6">
                            Discover groups to connect with other book lovers
                        </p>
                        <button
                            onClick={() => setActiveTab("discover")}
                            className="btn-primary"
                        >
                            Discover Groups
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myGroups.map((group) => (
                            <Link
                                key={group.id}
                                href={`/community/chat/${group.id}`}
                                className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-5 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-600 transition group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-amber-200 dark:bg-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                                        <span className="text-xl">👥</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 truncate">
                                            {group.member_count || 0} members
                                        </p>
                                    </div>
                                </div>

                                {group.description && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-3 line-clamp-2">
                                        {group.description}
                                    </p>
                                )}

                                {group.last_message && (
                                    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800/50">
                                        <p className="text-xs text-amber-500 dark:text-amber-400 truncate">
                                            Last: {group.last_message}
                                        </p>
                                        <p className="text-xs text-amber-400 dark:text-amber-500 mt-1">
                                            {formatTime(group.last_message_time)}
                                        </p>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )
            ) : (
                /* Discover Groups Tab */
                discoverGroups.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <span className="text-6xl mb-4 block">🎉</span>
                        <p className="text-amber-700 dark:text-amber-300 text-lg mb-2">You have joined all available groups!</p>
                        <p className="text-amber-600 dark:text-amber-400 text-sm mb-6">
                            Create a new group to start a fresh discussion
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Create New Group
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {discoverGroups.map((group) => (
                            <div
                                key={group.id}
                                className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-5 hover:shadow-lg transition"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">📖</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 truncate">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 truncate">
                                            {group.member_count || 0} members
                                        </p>
                                    </div>
                                </div>

                                {group.description && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-3 line-clamp-2">
                                        {group.description}
                                    </p>
                                )}

                                <button
                                    onClick={() => handleJoinGroup(group.id)}
                                    className="w-full mt-4 py-2 px-4 bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 rounded-lg font-medium hover:bg-amber-200 dark:hover:bg-amber-700/50 transition"
                                >
                                    Join Group
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-amber-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                            <span>✨</span> Create New Group
                        </h2>

                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g., Fantasy Book Club"
                                    className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg px-4 py-2 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="What is this group about?"
                                    rows={3}
                                    className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg px-4 py-2 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 px-4 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 rounded-lg font-medium hover:bg-amber-50 dark:hover:bg-amber-800/30 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newGroupName.trim() || creating}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create Group"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
