"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Search, Users, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery } from "@tanstack/react-query";
import { chatService, type Conversation } from "@/lib/services/chat";
import { userService } from "@/lib/services/users";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({});
  const { data: session } = useSession();
  const router = useRouter();

  const { data: circles = [], isLoading: loadingCircles } = useQuery({
    queryKey: ["chat-groups"],
    queryFn: () => chatService.getGroups(),
  });

  const { data: myCircles = [], isLoading: loadingMyCircles } = useQuery({
    queryKey: ["my-chat-groups", session?.user?.id],
    queryFn: () => chatService.getMyGroups(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["dm-conversations", session?.user?.id],
    queryFn: () => chatService.getConversations(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["user-directory", session?.user?.id, search],
    enabled: !!session?.user?.id,
    queryFn: () => userService.searchUsers(search, session?.user?.id as string),
  });

  useEffect(() => {
    const participantIds = (conversations as Conversation[])
      .map((conversation) => conversation.participant_id)
      .filter(Boolean);

    if (participantIds.length === 0) {
      return;
    }

    let cancelled = false;

    userService
      .getUsersByIds(participantIds)
      .then((participants) => {
        if (cancelled) {
          return;
        }

        const nextNames = participants.reduce<Record<string, string>>((acc, user) => {
          acc[user.id] = user.username;
          return acc;
        }, {});

        setConversationNames((current) => ({ ...current, ...nextNames }));
      })
      .catch((error) => {
        console.error("Failed to resolve conversation names:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [conversations]);

  const getConversationName = (conversation: Conversation) =>
    conversationNames[conversation.participant_id] || conversation.participant_name;

  return (
    <PageLayout
      active="community"
      pageTitle="Community"
      pageSubtitle="Threads, circles, and quiet conversations about what you're reading."
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <div className="flex flex-col gap-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={session?.user?.id ? "Search members..." : "Sign in to search members..."}
            leftIcon={<Search size={16} />}
            disabled={!session?.user?.id}
          />

          {/* Your circles */}
          <div>
            <div className="mb-3">
              <SectionTitle>Your circles</SectionTitle>
            </div>
            {!session?.user?.id ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                Sign in to see your groups.
              </div>
            ) : loadingMyCircles ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-bc-primary w-6 h-6" />
              </div>
            ) : myCircles.length === 0 ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                You haven’t joined any circles yet.
              </div>
            ) : (
              <div className="bc-stagger flex flex-col gap-3">
                {myCircles.map((c) => (
                  <div
                    key={c.id}
                    className="bc-card bc-card-hover p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push(`/community/chat/${c.id}`)}
                  >
                    <div className="grid place-items-center w-10 h-10 rounded-bc-md bg-bc-primary-soft text-bc-primary shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-bc-text truncate">
                        {c.name}
                      </div>
                      <div className="text-[11.5px] text-bc-subtext truncate">
                        {c.last_message || c.description || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct messages */}
          <div>
            <div className="mb-3">
              <SectionTitle>Direct messages</SectionTitle>
            </div>
            {!session?.user?.id ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                Sign in to see your conversations.
              </div>
            ) : loadingConversations ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-bc-primary w-6 h-6" />
              </div>
            ) : (conversations as Conversation[]).length === 0 ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                No direct messages yet.
              </div>
            ) : (
              <div className="bc-stagger flex flex-col gap-3">
                {(conversations as Conversation[]).map((conv) => (
                  <div
                    key={conv.id}
                    className="bc-card bc-card-hover p-4 flex gap-4 items-start cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/community/dm/${conv.participant_id}?name=${encodeURIComponent(getConversationName(conv))}`
                      )
                    }
                  >
                    <div className="grid place-items-center w-11 h-11 rounded-full bg-bc-primary-grad text-white font-bold text-sm shrink-0 shadow-bc-primary">
                      {getConversationName(conv)?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="text-[13.5px] font-semibold text-bc-text truncate">
                          {getConversationName(conv)}
                        </div>
                        <div className="text-[11px] text-bc-subtext shrink-0">
                          {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <div className="text-[12.5px] text-bc-subtext line-clamp-1">
                        {conv.last_message || ""}
                      </div>
                      <div className="mt-2 text-[12px] text-bc-subtext inline-flex items-center gap-1">
                        <MessageCircle size={13} /> {conv.unread_count ? `${conv.unread_count} unread` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* People */}
          <div>
            <div className="mb-3">
              <SectionTitle>People</SectionTitle>
            </div>
            {!session?.user?.id ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                Sign in to browse members.
              </div>
            ) : loadingUsers ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-bc-primary w-6 h-6" />
              </div>
            ) : users.length === 0 ? (
              <div className="bc-card p-5 text-sm text-bc-subtext">
                No users found.
              </div>
            ) : (
              <div className="bc-stagger flex flex-col gap-3">
                {users.slice(0, 12).map((u) => (
                  <div
                    key={u.id}
                    className="bc-card bc-card-hover p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push(`/community/dm/${u.id}?name=${encodeURIComponent(u.username)}`)}
                  >
                    <div className="grid place-items-center w-10 h-10 rounded-full bg-bc-surface-muted text-bc-primary font-semibold shrink-0">
                      {u.username?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-bc-text truncate">
                        {u.username}
                      </div>
                      <div className="text-[11.5px] text-bc-subtext truncate">
                        {u.email}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/community/dm/${u.id}?name=${encodeURIComponent(u.username)}`);
                    }}>
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — circles */}
        <aside className="flex flex-col gap-6">
          <div>
            <div className="mb-4">
              <SectionTitle>Trending circles</SectionTitle>
            </div>
            <div className="flex flex-col gap-3">
              {loadingCircles ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-bc-primary w-6 h-6" /></div>
              ) : circles.length === 0 ? (
                <div className="text-center py-4 text-bc-subtext text-sm">No active circles right now.</div>
              ) : (
                circles.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="bc-card bc-card-hover p-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push(`/community/chat/${c.id}`)}
                  >
                    <div className="grid place-items-center w-10 h-10 rounded-bc-md bg-bc-primary-soft text-bc-primary shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-bc-text truncate">
                        {c.name}
                      </div>
                      <div className="text-[11.5px] text-bc-subtext">
                        {c.member_count || 1} members
                      </div>
                    </div>
                    {session?.user?.id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          chatService
                            .joinGroup(c.id, session.user.id as string)
                            .then(() => router.push(`/community/chat/${c.id}`));
                        }}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
