"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertCircle, Loader2, MessageCircle, Send, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { chatService, type ChatGroup } from "@/lib/services/chat";

interface Message {
  id: string | number;
  sender_id: string;
  sender_name?: string;
  content: string;
  timestamp: string;
}

function getInitials(name?: string) {
  const value = name?.trim() || "BC";
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = String(params.id);

  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = session?.user?.id || "";
  const currentUserName = session?.user?.username || "Anonymous";

  useEffect(() => {
    if (!groupId) {
      return;
    }

    loadGroup();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function loadGroup() {
    try {
      const data = await chatService.getGroup(groupId);
      setGroup(data);
    } catch (err) {
      console.error("Failed to load group:", err);
      setError("Could not load this group.");
    }
  }

  async function loadMessages() {
    try {
      const data = await chatService.getMessages(groupId);
      setMessages(data as Message[]);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Could not load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = newMessage.trim();
    if (!content || !currentUserId) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await chatService.sendMessage({
        group: groupId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        content,
      });
      setNewMessage("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const groupName = group?.name || "Group chat";
  const memberCount = group?.member_count || group?.members?.length || 0;

  return (
    <PageLayout
      active="community"
      pageTitle={groupName}
      pageSubtitle={group?.description || "A shared space for readers to talk, compare notes, and keep the conversation going."}
      headerActions={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft size={15} />}
          onClick={() => router.push("/community")}
        >
          Community
        </Button>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="bc-card overflow-hidden">
          <div className="border-b border-bc-border bg-bc-surface px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-bc-lg bg-bc-primary-soft text-bc-primary shadow-bc-xs">
                  <MessageCircle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-bc-text">{groupName}</h2>
                    <span className="rounded-full bg-bc-surface-muted px-2.5 py-1 text-[11px] font-bold text-bc-text-soft">
                      Live
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-bc-subtext">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={13} />
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </span>
                    {messages.length > 0 && <span>{messages.length} messages</span>}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft size={15} />}
                onClick={() => router.push("/community")}
              >
                Back
              </Button>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="h-[min(62vh,620px)] overflow-y-auto bg-bc-surface-2 px-4 py-5 sm:px-6"
          >
            {loading ? (
              <div className="grid h-full place-items-center">
                <div className="flex items-center gap-3 rounded-full border border-bc-border bg-bc-surface px-4 py-2 text-sm font-semibold text-bc-text-soft shadow-bc-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-bc-primary" />
                  Loading conversation...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="grid h-full place-items-center px-4 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-bc-2xl bg-bc-primary-soft text-bc-primary shadow-bc-xs">
                    <MessageCircle size={28} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-bc-text">Start this circle</h3>
                  <p className="mt-2 text-sm leading-6 text-bc-subtext">
                    Share a thought, ask what everyone is reading, or drop the first question for the group.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === currentUserId;
                  const senderName = message.sender_name || message.sender_id;

                  return (
                    <div
                      key={message.id}
                      className={["flex items-end gap-2", isMe ? "justify-end" : "justify-start"].join(" ")}
                    >
                      {!isMe && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bc-surface border border-bc-border text-[11px] font-bold text-bc-primary shadow-bc-xs">
                          {getInitials(senderName)}
                        </div>
                      )}
                      <div
                        className={[
                          "max-w-[82%] rounded-bc-lg px-4 py-3 shadow-bc-xs",
                          isMe
                            ? "rounded-br-sm bg-bc-primary text-white"
                            : "rounded-bl-sm border border-bc-border bg-bc-surface text-bc-text",
                        ].join(" ")}
                      >
                        {!isMe && (
                          <div className="mb-1 text-[11.5px] font-bold text-bc-primary">
                            {senderName}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                        <div
                          className={[
                            "mt-1.5 text-right text-[11px] font-medium",
                            isMe ? "text-white/75" : "text-bc-subtext",
                          ].join(" ")}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-bc-border bg-bc-surface p-4">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-bc-md border border-bc-danger/30 bg-bc-danger/10 px-3 py-2 text-[13px] text-bc-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-bc-lg border border-bc-border bg-bc-surface-2 p-2 shadow-bc-xs transition focus-within:border-bc-primary focus-within:shadow-bc-glow">
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Write a message to the group..."
                disabled={sending}
                rows={2}
                className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-bc-text outline-none placeholder:text-bc-subtext disabled:cursor-not-allowed"
              />
              <Button
                type="submit"
                size="md"
                className="h-11 w-11 px-0"
                disabled={!newMessage.trim() || sending}
                aria-label="Send message"
                title="Send message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-bc-xl border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
                <Users size={17} />
              </div>
              <div>
                <div className="text-sm font-bold text-bc-text">Circle details</div>
                <div className="text-[12px] text-bc-subtext">{memberCount} people here</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-bc-subtext">
              {group?.description || "No description yet. Let the first messages shape the mood of this circle."}
            </p>
          </div>

          <div className="rounded-bc-xl border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
            <div className="text-sm font-bold text-bc-text">Members</div>
            <div className="mt-3 flex flex-col gap-2">
              {(group?.members || []).slice(0, 6).map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-sm text-bc-text-soft">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-bc-surface-muted text-[10px] font-bold text-bc-primary">
                    {getInitials(member.user_id)}
                  </div>
                  <span className="truncate">{member.user_id}</span>
                </div>
              ))}
              {(!group?.members || group.members.length === 0) && (
                <div className="text-sm text-bc-subtext">Members will appear here after they join.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </PageLayout>
  );
}
