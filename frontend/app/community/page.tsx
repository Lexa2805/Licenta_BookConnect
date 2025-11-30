"use client";

import { useEffect, useState } from "react";
import { chatService } from "@/lib/services/chat";
import Link from "next/link";

interface ChatGroup {
    id: number;
    name: string;
    description: string;
}

export default function CommunityPage() {
    const [groups, setGroups] = useState<ChatGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chatService.getGroups()
            .then((data) => {
                setGroups(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleJoin = async (groupId: number) => {
        try {
            await chatService.joinGroup(groupId, "user_123"); // Mock user ID
            alert("Joined group!");
        } catch (err) {
            console.error(err);
            alert("Failed to join group");
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-amber-900">Community Groups</h1>

            {loading ? (
                <p className="text-amber-800">Loading groups...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="border border-amber-200 rounded-xl p-6 shadow-sm hover:shadow-md transition bg-white">
                            <h2 className="text-xl font-semibold mb-2 text-amber-900">{group.name}</h2>
                            <p className="text-amber-800/80 mb-4">{group.description}</p>
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => handleJoin(group.id)}
                                    className="text-amber-700 hover:text-amber-900 font-medium"
                                >
                                    Join Group
                                </button>
                                <Link
                                    href={`/community/chat/${group.id}`}
                                    className="btn-primary text-sm"
                                >
                                    Open Chat
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
