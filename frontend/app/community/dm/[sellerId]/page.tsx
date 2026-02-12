"use client";

import { useEffect, useState, useRef } from "react";
import { chatService, Conversation } from "@/lib/services/chat";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Message {
    id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    timestamp: string;
}

export default function DirectMessagePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const sellerId = params.sellerId as string;
    const sellerName = searchParams.get('name') || 'Seller';
    const bookTitle = searchParams.get('book') || '';

    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = session?.user?.id || "";
    const currentUserName = session?.user?.username || "Anonymous";

    useEffect(() => {
        if (currentUserId) {
            loadConversations();
        }
    }, [currentUserId]);

    useEffect(() => {
        if (currentUserId && sellerId) {
            loadMessages();
            const interval = setInterval(loadMessages, 3000); // Poll every 3s
            return () => clearInterval(interval);
        }
    }, [currentUserId, sellerId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Pre-fill message if coming from a book listing
    useEffect(() => {
        if (bookTitle && messages.length === 0) {
            setNewMessage(`Hi! I'm interested in your book "${bookTitle}". Is it still available?`);
        }
    }, [bookTitle, messages.length]);

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations(currentUserId);
            setConversations(data);
        } catch (err) {
            console.error("Failed to load conversations:", err);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await chatService.getDirectMessages(currentUserId, sellerId);
            setMessages(data);
        } catch (err) {
            console.error("Failed to load messages:", err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserId) return;

        setSending(true);
        try {
            await chatService.sendDirectMessage({
                sender_id: currentUserId,
                sender_name: currentUserName,
                receiver_id: sellerId,
                receiver_name: sellerName,
                content: newMessage.trim()
            });
            setNewMessage("");
            await loadMessages();
            await loadConversations(); // Refresh conversation list
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatConvTime = (timestamp: string) => {
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
                <p className="text-amber-800 dark:text-amber-200 mb-4">Please log in to send messages.</p>
                <Link href="/login" className="btn-primary">Log In</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="flex gap-4 h-[calc(100vh-120px)]">
                {/* Sidebar - Conversation List */}
                <div className={`${showSidebar ? 'w-80' : 'w-0'} flex-shrink-0 transition-all duration-300 overflow-hidden hidden md:block`}>
                    <div className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl h-full flex flex-col">
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-amber-200 dark:border-amber-700/50">
                            <h2 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Conversations
                            </h2>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-amber-600 dark:text-amber-400 text-sm">
                                    No conversations yet
                                </div>
                            ) : (
                                <div className="divide-y divide-amber-100 dark:divide-amber-800/50">
                                    {conversations.map((conv) => (
                                        <Link
                                            key={conv.participant_id}
                                            href={`/community/dm/${conv.participant_id}?name=${encodeURIComponent(conv.participant_name)}`}
                                            className={`flex items-center gap-3 p-3 hover:bg-amber-50 dark:hover:bg-amber-800/30 transition ${conv.participant_id === sellerId
                                                ? 'bg-amber-100 dark:bg-amber-800/40'
                                                : ''
                                                }`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                                    {conv.participant_name[0]?.toUpperCase() || '?'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-sm text-amber-900 dark:text-amber-100 truncate">
                                                        {conv.participant_name}
                                                    </h3>
                                                    <span className="text-xs text-amber-500 dark:text-amber-400 flex-shrink-0 ml-1">
                                                        {formatConvTime(conv.last_message_time)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                                                    {conv.last_message}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-t-xl p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/community"
                                className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                                    <span className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                                        {sellerName[0]?.toUpperCase() || '?'}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                        {sellerName}
                                    </h1>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        Direct Message
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="bg-amber-50/50 dark:bg-amber-950/30 border-x border-amber-200 dark:border-amber-700/50 flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 dark:border-amber-400"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="text-4xl mb-4">💬</span>
                                <p className="text-amber-700 dark:text-amber-300">No messages yet.</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Start the conversation with {sellerName}!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                                    ? 'bg-amber-600 text-white rounded-br-md'
                                                    : 'bg-white dark:bg-amber-800/50 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-700/50 rounded-bl-md'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-amber-200' : 'text-amber-500 dark:text-amber-400'
                                                    }`}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <form
                        onSubmit={handleSend}
                        className="bg-white dark:bg-amber-900/30 border border-t-0 border-amber-200 dark:border-amber-700/50 rounded-b-xl p-4"
                    >
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 border border-amber-200 dark:border-amber-700/50 rounded-full px-4 py-2 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="btn-primary rounded-full px-6 disabled:opacity-50"
                            >
                                {sending ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
