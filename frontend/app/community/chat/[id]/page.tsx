"use client";

import { useEffect, useState, useRef } from "react";
import { chatService } from "@/lib/services/chat";
import { useParams } from "next/navigation";

interface Message {
    id: number;
    sender_id: string;
    content: string;
    timestamp: string;
}

export default function ChatPage() {
    const params = useParams();
    const groupId = Number(params.id);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserId = "user_123"; // Mock user ID

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = () => {
        chatService.getMessages(groupId)
            .then((data) => {
                setMessages(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await chatService.sendMessage({
                group: groupId,
                sender_id: currentUserId,
                content: newMessage
            });
            setNewMessage("");
            loadMessages();
        } catch (err) {
            console.error(err);
            alert("Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] container mx-auto p-4">
            <div className="bg-white border rounded-t-lg p-4 shadow-sm">
                <h1 className="text-xl font-bold">Group Chat</h1>
            </div>

            <div className="flex-1 bg-gray-50 border-x border-b p-4 overflow-y-auto">
                {loading ? (
                    <p>Loading messages...</p>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'
                                        }`}>
                                        {!isMe && <div className="text-xs text-gray-500 mb-1">{msg.sender_id}</div>}
                                        <p>{msg.content}</p>
                                        <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="bg-white border rounded-b-lg p-4 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
