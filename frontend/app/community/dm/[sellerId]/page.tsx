"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ChevronLeft,
    Download,
    FileText,
    Image as ImageIcon,
    Paperclip,
    Send,
    Smile,
    X,
} from "lucide-react";
import { chatService, type Conversation, type DirectMessage } from "@/lib/services/chat";
import { userService } from "@/lib/services/users";

const EMOJI_OPTIONS = [
    "\u{1F44B}",
    "\u{1F60A}",
    "\u{1F60D}",
    "\u{1F602}",
    "\u{1F44D}",
    "\u{1F389}",
    "\u{1F4DA}",
    "\u{1F525}",
    "\u{1F64C}",
    "\u{2728}",
];

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const DOCUMENT_ACCEPT =
    ".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.rar";

export default function DirectMessagePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const sellerId = params.sellerId as string;
    const routeName = searchParams.get("name")?.trim() || "";
    const bookTitle = searchParams.get("book") || "";

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
    const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const currentUserId = session?.user?.id || "";
    const currentUserName = session?.user?.username || "Anonymous";

    const activeConversation = conversations.find(
        (conversation) => conversation.participant_id === sellerId
    );
    const sellerName =
        userNameMap[sellerId] ||
        routeName ||
        activeConversation?.participant_name ||
        "Reader";

    useEffect(() => {
        if (currentUserId) {
            void loadConversations();
        }
    }, [currentUserId, sellerId]);

    useEffect(() => {
        if (sellerId) {
            void resolveUserNames([sellerId]);
        }
    }, [sellerId]);

    useEffect(() => {
        if (currentUserId && sellerId) {
            void loadMessages();
            const interval = setInterval(() => {
                void loadMessages();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [currentUserId, sellerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (bookTitle && messages.length === 0) {
            setNewMessage(
                `Hi! I'm interested in your book "${bookTitle}". Is it still available?`
            );
        }
    }, [bookTitle, messages.length]);

    const resolveUserNames = async (userIds: string[]) => {
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        if (uniqueIds.length === 0) {
            return;
        }

        try {
            const users = await userService.getUsersByIds(uniqueIds);
            if (users.length === 0) {
                return;
            }

            const nextNames = users.reduce<Record<string, string>>((acc, user) => {
                acc[user.id] = user.username;
                return acc;
            }, {});

            setUserNameMap((current) => ({ ...current, ...nextNames }));
        } catch (error) {
            console.error("Failed to resolve usernames:", error);
        }
    };

    const loadConversations = async () => {
        try {
            const data = await chatService.getConversations(currentUserId);
            setConversations(data);
            await resolveUserNames([sellerId, ...data.map((conversation) => conversation.participant_id)]);
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

    const clearSelectedAttachment = () => {
        setSelectedAttachment(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
        if (documentInputRef.current) {
            documentInputRef.current.value = "";
        }
    };

    const handleAttachmentSelection = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > MAX_ATTACHMENT_SIZE) {
            alert("Please choose a file smaller than 10 MB.");
            event.target.value = "";
            return;
        }

        setSelectedAttachment(file);
        setShowEmojiPicker(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!newMessage.trim() && !selectedAttachment) || !currentUserId) {
            return;
        }

        setSending(true);
        try {
            await chatService.sendDirectMessage({
                sender_id: currentUserId,
                sender_name: currentUserName,
                receiver_id: sellerId,
                receiver_name: sellerName,
                content: newMessage.trim(),
                attachment: selectedAttachment,
                attachment_name: selectedAttachment?.name,
                attachment_type: selectedAttachment?.type,
                attachment_size: selectedAttachment?.size,
            });

            setNewMessage("");
            clearSelectedAttachment();
            setShowEmojiPicker(false);
            await loadMessages();
            await loadConversations();
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const appendEmoji = (emoji: string) => {
        setNewMessage((current) => `${current}${emoji}`);
        setShowEmojiPicker(false);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString("ro-RO", {
                hour: "2-digit",
                minute: "2-digit",
            });
        }

        return date.toLocaleDateString("ro-RO", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatConversationTime = (timestamp: string) => {
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

        return date.toLocaleDateString("ro-RO", {
            day: "numeric",
            month: "short",
        });
    };

    const formatFileSize = (size?: number | null) => {
        if (!size) {
            return "";
        }
        if (size < 1024) {
            return `${size} B`;
        }
        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getConversationName = (conversation: Conversation) =>
        userNameMap[conversation.participant_id] || conversation.participant_name;

    if (!session?.user) {
        return (
            <div className="container mx-auto p-4 py-20 text-center">
                <p className="mb-4 text-amber-800 dark:text-amber-200">
                    Please log in to send messages.
                </p>
                <Link href="/login" className="btn-primary">
                    Log In
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl p-4">
            <div className="flex h-[calc(100vh-120px)] gap-4">
                <aside className="hidden w-80 flex-shrink-0 overflow-hidden md:block">
                    <div className="flex h-full flex-col rounded-xl border border-amber-200 bg-white dark:border-amber-700/50 dark:bg-amber-900/30">
                        <div className="border-b border-amber-200 p-4 dark:border-amber-700/50">
                            <h2 className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                Conversations
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-sm text-amber-600 dark:text-amber-400">
                                    No conversations yet
                                </div>
                            ) : (
                                <div className="divide-y divide-amber-100 dark:divide-amber-800/50">
                                    {conversations.map((conversation) => (
                                        <Link
                                            key={conversation.participant_id}
                                            href={`/community/dm/${conversation.participant_id}?name=${encodeURIComponent(
                                                getConversationName(conversation)
                                            )}`}
                                            className={`flex items-center gap-3 p-3 transition hover:bg-amber-50 dark:hover:bg-amber-800/30 ${
                                                conversation.participant_id === sellerId
                                                    ? "bg-amber-100 dark:bg-amber-800/40"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-700">
                                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                                    {getConversationName(conversation)[0]?.toUpperCase() || "?"}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="truncate text-sm font-medium text-amber-900 dark:text-amber-100">
                                                        {getConversationName(conversation)}
                                                    </h3>
                                                    <span className="ml-1 flex-shrink-0 text-xs text-amber-500 dark:text-amber-400">
                                                        {formatConversationTime(conversation.last_message_time)}
                                                    </span>
                                                </div>
                                                <p className="truncate text-xs text-amber-600 dark:text-amber-400">
                                                    {conversation.last_message}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="rounded-t-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/30">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/community"
                                className="text-amber-700 transition hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-700">
                                    <span className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                                        {sellerName[0]?.toUpperCase() || "?"}
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

                    <div className="flex-1 overflow-y-auto border-x border-amber-200 bg-amber-50/50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-700 dark:border-amber-400"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <span className="mb-4 text-4xl">{`\u{1F4AC}`}</span>
                                <p className="text-amber-700 dark:text-amber-300">No messages yet.</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Start the conversation with {sellerName}!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => {
                                    const isMe = message.sender_id === currentUserId;
                                    const attachmentUrl = message.attachment_url || message.attachment || "";
                                    const isImageAttachment = (message.attachment_type || "").startsWith("image/");

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                                    isMe
                                                        ? "rounded-br-md bg-amber-600 text-white"
                                                        : "rounded-bl-md border border-amber-200 bg-white text-amber-900 dark:border-amber-700/50 dark:bg-amber-800/50 dark:text-amber-100"
                                                }`}
                                            >
                                                {attachmentUrl ? (
                                                    isImageAttachment ? (
                                                        <a
                                                            href={attachmentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mb-3 block overflow-hidden rounded-2xl"
                                                        >
                                                            <img
                                                                src={attachmentUrl}
                                                                alt={message.attachment_name || "Shared image"}
                                                                className="max-h-72 w-full rounded-2xl object-cover"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={attachmentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={`mb-3 flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition ${
                                                                isMe
                                                                    ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                                                                    : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100"
                                                            }`}
                                                        >
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <FileText className="h-5 w-5 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium">
                                                                        {message.attachment_name || "Attachment"}
                                                                    </p>
                                                                    <p
                                                                        className={`text-xs ${
                                                                            isMe
                                                                                ? "text-amber-100"
                                                                                : "text-amber-600 dark:text-amber-400"
                                                                        }`}
                                                                    >
                                                                        {formatFileSize(message.attachment_size)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Download className="h-4 w-4 flex-shrink-0" />
                                                        </a>
                                                    )
                                                ) : null}

                                                {message.content ? (
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                ) : null}

                                                <p
                                                    className={`mt-2 text-xs ${
                                                        isMe
                                                            ? "text-amber-200"
                                                            : "text-amber-500 dark:text-amber-400"
                                                    }`}
                                                >
                                                    {formatTime(message.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={handleSend}
                        className="rounded-b-xl border border-t-0 border-amber-200 bg-white p-4 dark:border-amber-700/50 dark:bg-amber-900/30"
                    >
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAttachmentSelection}
                            disabled={sending}
                        />
                        <input
                            ref={documentInputRef}
                            type="file"
                            accept={DOCUMENT_ACCEPT}
                            className="hidden"
                            onChange={handleAttachmentSelection}
                            disabled={sending}
                        />

                        {selectedAttachment ? (
                            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/50 dark:bg-amber-900/20">
                                <div className="flex min-w-0 items-center gap-3">
                                    {selectedAttachment.type.startsWith("image/") ? (
                                        <ImageIcon className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                                    ) : (
                                        <FileText className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-amber-900 dark:text-amber-100">
                                            {selectedAttachment.name}
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            {formatFileSize(selectedAttachment.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearSelectedAttachment}
                                    className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-800/40"
                                    aria-label="Remove attachment"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : null}

                        <div className="relative">
                            {showEmojiPicker ? (
                                <div className="absolute bottom-full left-0 mb-3 flex flex-wrap gap-2 rounded-2xl border border-amber-200 bg-white p-3 shadow-lg dark:border-amber-700/50 dark:bg-amber-900">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => appendEmoji(emoji)}
                                            className="rounded-xl px-2 py-1 text-xl transition hover:bg-amber-100 dark:hover:bg-amber-800/40"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            <div className="flex items-end gap-3">
                                <div className="flex flex-shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker((current) => !current)}
                                        className="rounded-full border border-amber-200 p-3 text-amber-700 transition hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-800/30"
                                        aria-label="Open emoji picker"
                                        disabled={sending}
                                    >
                                        <Smile className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="rounded-full border border-amber-200 p-3 text-amber-700 transition hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-800/30"
                                        aria-label="Attach photo"
                                        disabled={sending}
                                    >
                                        <ImageIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => documentInputRef.current?.click()}
                                        className="rounded-full border border-amber-200 p-3 text-amber-700 transition hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-300 dark:hover:bg-amber-800/30"
                                        aria-label="Attach document"
                                        disabled={sending}
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>
                                </div>

                                <textarea
                                    value={newMessage}
                                    onChange={(event) => setNewMessage(event.target.value)}
                                    placeholder="Write a message, add an emoji, or share a file..."
                                    className="min-h-[52px] flex-1 resize-none rounded-3xl border border-amber-200 bg-white px-4 py-3 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100 dark:placeholder-amber-500"
                                    disabled={sending}
                                    rows={2}
                                />

                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !selectedAttachment) || sending}
                                    className="btn-primary flex h-[52px] w-[52px] items-center justify-center rounded-full disabled:opacity-50"
                                    aria-label="Send message"
                                >
                                    {sending ? (
                                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
