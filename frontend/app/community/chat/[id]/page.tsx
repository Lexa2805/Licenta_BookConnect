"use client";

import { useEffect, useState, useRef } from "react";
import { chatService, ChatGroup } from "@/lib/services/chat";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Message {
    id: string | number;
    sender_id: string;
    sender_name?: string;
    content: string;
    timestamp: string;
}

export default function GroupChatPage() {
    const params = useParams();
    const { data: session } = useSession();
    const groupId = String(params.id);

    const [group, setGroup] = useState<ChatGroup | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = session?.user?.id || "";
    const currentUserName = session?.user?.username || "Anonymous";

    useEffect(() => {
        if (groupId) {
            loadGroup();
            loadMessages();
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadGroup = async () => {
        try {
            const data = await chatService.getGroup(groupId);
            setGroup(data);
        } catch (err) {
            console.error("Failed to load group:", err);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages(groupId);
            setMessages(data as Message[]);
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
            await chatService.sendMessage({
                group: groupId,
                sender_id: currentUserId,
                sender_name: currentUserName,
                content: newMessage.trim()
            });
            setNewMessage("");
            await loadMessages();
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message");
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

    if (!session?.user) {
        return (
            <div className="container mx-auto p-4 text-center py-20">
                <p className="text-amber-800 dark:text-amber-200 mb-4">Please log in to participate in group chats.</p>
                <Link href="/login" className="btn-primary">Log In</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex flex-col h-[calc(100vh-120px)]">
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
                            <div className="w-10 h-10 rounded-xl bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                                <span className="text-lg">💬</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                    {group?.name || "Group Chat"}
                                </h1>
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    {group?.member_count || 0} members
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
                                Start the conversation!
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
                                            {!isMe && (
                                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                                                    {msg.sender_name || msg.sender_id}
                                                </p>
                                            )}
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
    );
}
