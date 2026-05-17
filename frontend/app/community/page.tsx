"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  chatService,
  type ChatGroup,
  type Conversation,
  type DirectMessage,
} from "@/lib/services/chat";
import { userService, type PublicUser } from "@/lib/services/users";

type ChatMessage = {
  id: string | number;
  sender_id: string;
  sender_name?: string;
  content: string;
  attachment?: string | null;
  attachment_url?: string | null;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number | null;
  timestamp: string;
};

type ActiveThread =
  | {
      type: "group";
      id: string | number;
      title: string;
      subtitle?: string;
      group: ChatGroup;
    }
  | {
      type: "dm";
      id: string;
      participantId: string;
      participantName: string;
      title: string;
      subtitle?: string;
    };

function getInitials(value?: string) {
  const name = value?.trim() || "BC";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMessageTime(timestamp?: string) {
  if (!timestamp) {
    return "";
  }

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
const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.zip,.rar";

function formatFileSize(size?: number | null) {
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
}

export default function CommunityPage() {
  const [peopleSearchDraft, setPeopleSearchDraft] = useState("");
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("");
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({});
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showAllMyGroups, setShowAllMyGroups] = useState(false);
  const [showAllDirectMessages, setShowAllDirectMessages] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState("");
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [chatError, setChatError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const currentUserId = session?.user?.id as string | undefined;
  const currentUserName = session?.user?.username || "Anonymous";
  const memberSearch = peopleSearchTerm.trim();
  const pendingMemberSearch = peopleSearchDraft.trim();

  const { data: circles = [], isLoading: loadingCircles, refetch: refetchCircles } = useQuery({
    queryKey: ["chat-groups"],
    queryFn: () => chatService.getGroups(),
  });

  const { data: myCircles = [], isLoading: loadingMyCircles, refetch: refetchMyCircles } = useQuery({
    queryKey: ["my-chat-groups", currentUserId],
    queryFn: () => chatService.getMyGroups(currentUserId!),
    enabled: !!currentUserId,
  });

  const { data: conversations = [], isLoading: loadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ["dm-conversations", currentUserId],
    queryFn: () => chatService.getConversations(currentUserId!),
    enabled: !!currentUserId,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["user-directory", currentUserId, memberSearch],
    enabled: !!currentUserId && memberSearch.length >= 2,
    queryFn: () => userService.searchUsers(memberSearch, currentUserId!),
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

  useEffect(() => {
    if (!activeThread) {
      return;
    }

    void loadActiveThreadMessages(activeThread);
    const interval = setInterval(() => {
      void loadActiveThreadMessages(activeThread, false);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeThread]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [threadMessages, loadingThread]);

  const getConversationName = (conversation: Conversation) =>
    conversationNames[conversation.participant_id] || conversation.participant_name;

  async function loadActiveThreadMessages(thread: ActiveThread, showLoader = true) {
    if (showLoader) {
      setLoadingThread(true);
    }
    setChatError("");

    try {
      if (thread.type === "group") {
        const data = await chatService.getMessages(thread.id);
        setThreadMessages(data as ChatMessage[]);
      } else {
        const data = await chatService.getDirectMessages(currentUserId!, thread.participantId);
        setThreadMessages(
          data.map((message: DirectMessage) => ({
            id: message.id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            content: message.content,
            attachment: message.attachment,
            attachment_url: message.attachment_url,
            attachment_name: message.attachment_name,
            attachment_type: message.attachment_type,
            attachment_size: message.attachment_size,
            timestamp: message.timestamp,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load thread:", error);
      setChatError("Could not load this conversation.");
    } finally {
      if (showLoader) {
        setLoadingThread(false);
      }
    }
  }

  function openGroup(group: ChatGroup) {
    setActiveThread({
      type: "group",
      id: group.id,
      title: group.name,
      subtitle: group.description || `${group.member_count || 1} members`,
      group,
    });
    setNewMessage("");
    clearSelectedAttachment();
    setShowEmojiPicker(false);
    setChatError("");
  }

  function openConversation(conversation: Conversation) {
    const participantName = getConversationName(conversation);
    setActiveThread({
      type: "dm",
      id: conversation.participant_id,
      participantId: conversation.participant_id,
      participantName,
      title: participantName,
      subtitle: "Direct message",
    });
    setNewMessage("");
    clearSelectedAttachment();
    setShowEmojiPicker(false);
    setChatError("");
  }

  function openPerson(user: PublicUser) {
    setActiveThread({
      type: "dm",
      id: user.id,
      participantId: user.id,
      participantName: user.username,
      title: user.username,
      subtitle: user.email,
    });
    setNewMessage("");
    clearSelectedAttachment();
    setShowEmojiPicker(false);
    setChatError("");
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = groupName.trim();
    const description = groupDescription.trim();

    if (!currentUserId) {
      setCreateGroupError("Please sign in before creating a group.");
      return;
    }

    if (!name) {
      setCreateGroupError("Group name is required.");
      return;
    }

    setCreatingGroup(true);
    setCreateGroupError("");

    try {
      const group = await chatService.createGroup({
        name,
        description,
        created_by: currentUserId,
      });

      setGroupName("");
      setGroupDescription("");
      setShowCreateGroup(false);
      await Promise.all([refetchCircles(), refetchMyCircles()]);
      openGroup(group);
    } catch (error) {
      console.error("Failed to create group:", error);
      setCreateGroupError("Could not create the group. Please try again.");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = newMessage.trim();
    if ((!content && !selectedAttachment) || !activeThread || !currentUserId) {
      return;
    }

    setSendingMessage(true);
    setChatError("");

    try {
      if (activeThread.type === "group") {
        await chatService.sendMessage({
          group: activeThread.id,
          sender_id: currentUserId,
          sender_name: currentUserName,
          content,
          attachment: selectedAttachment,
          attachment_name: selectedAttachment?.name,
          attachment_type: selectedAttachment?.type,
          attachment_size: selectedAttachment?.size,
        });
      } else {
        await chatService.sendDirectMessage({
          sender_id: currentUserId,
          sender_name: currentUserName,
          receiver_id: activeThread.participantId,
          receiver_name: activeThread.participantName,
          content,
          attachment: selectedAttachment,
          attachment_name: selectedAttachment?.name,
          attachment_type: selectedAttachment?.type,
          attachment_size: selectedAttachment?.size,
        });
      }

      setNewMessage("");
      clearSelectedAttachment();
      setShowEmojiPicker(false);
      await Promise.all([
        loadActiveThreadMessages(activeThread, false),
        refetchConversations(),
        activeThread.type === "group" ? refetchCircles() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatError("Could not send your message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleJoinGroup(group: ChatGroup) {
    if (!currentUserId) {
      return;
    }

    try {
      await chatService.joinGroup(group.id, currentUserId);
      await Promise.all([refetchCircles(), refetchMyCircles()]);
      openGroup(group);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  }

  function handlePeopleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPeopleSearchTerm(pendingMemberSearch);
  }

  function clearSelectedAttachment() {
    setSelectedAttachment(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  }

  function handleAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setChatError("Please choose a file smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedAttachment(file);
    setShowEmojiPicker(false);
    setChatError("");
  }

  function appendEmoji(emoji: string) {
    setNewMessage((current) => `${current}${emoji}`);
    setShowEmojiPicker(false);
  }

  const conversationsList = conversations as Conversation[];
  const visibleMyCircles = showAllMyGroups ? myCircles : myCircles.slice(0, 4);
  const visibleConversations = showAllDirectMessages ? conversationsList : conversationsList.slice(0, 4);
  const discoveredCircles =
    memberSearch.length >= 2
      ? circles.filter((circle) => {
          const haystack = `${circle.name} ${circle.description || ""}`.toLowerCase();
          return haystack.includes(memberSearch.toLowerCase());
        })
      : circles.slice(0, 5);

  return (
    <PageLayout
      active="community"
      pageTitle="Community"
      pageSubtitle="Chat with your reading circles and message people without leaving the community."
      showPageHeader={false}
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionTitle>Your groups</SectionTitle>
              {currentUserId && (
                <Button
                  size="sm"
                  variant={showCreateGroup ? "secondary" : "primary"}
                  leftIcon={showCreateGroup ? <X size={14} /> : <Plus size={14} />}
                  onClick={() => {
                    setShowCreateGroup((current) => !current);
                    setCreateGroupError("");
                  }}
                >
                  {showCreateGroup ? "Cancel" : "Create"}
                </Button>
              )}
            </div>

            {showCreateGroup && currentUserId && (
              <form onSubmit={handleCreateGroup} className="bc-card mb-3 p-4">
                <div className="grid gap-3">
                  <Input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Group name"
                    disabled={creatingGroup}
                  />
                  <textarea
                    value={groupDescription}
                    onChange={(event) => setGroupDescription(event.target.value)}
                    placeholder="Short description"
                    disabled={creatingGroup}
                    rows={3}
                    className="min-h-24 w-full resize-none rounded-bc-md border border-bc-border bg-bc-surface px-4 py-3 text-sm text-bc-text shadow-bc-xs outline-none transition focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {createGroupError && (
                    <div className="flex items-start gap-2 rounded-bc-md border border-bc-danger/30 bg-bc-danger/10 px-3 py-2 text-[13px] text-bc-danger">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{createGroupError}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingGroup || !groupName.trim()}
                    leftIcon={creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={14} />}
                  >
                    {creatingGroup ? "Creating..." : "Create group"}
                  </Button>
                </div>
              </form>
            )}

            {!currentUserId ? (
              <EmptyCard text="Sign in to see your groups." />
            ) : loadingMyCircles ? (
              <LoadingBlock />
            ) : myCircles.length === 0 ? (
              <EmptyCard text="You have not joined any circles yet." />
            ) : (
              <div className="flex flex-col gap-2">
                {visibleMyCircles.map((circle) => (
                  <ThreadCard
                    key={circle.id}
                    title={circle.name}
                    subtitle={circle.last_message || circle.description || `${circle.member_count || 1} members`}
                    icon={<Users size={16} />}
                    active={activeThread?.type === "group" && String(activeThread.id) === String(circle.id)}
                    onClick={() => openGroup(circle)}
                  />
                ))}
                {myCircles.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllMyGroups((current) => !current)}
                    className="rounded-bc-md border border-bc-border bg-bc-surface px-3 py-2 text-[12.5px] font-bold text-bc-text-soft transition hover:border-bc-primary/40 hover:text-bc-primary"
                  >
                    {showAllMyGroups ? "Show fewer groups" : `Show all groups (${myCircles.length})`}
                  </button>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3">
              <SectionTitle>Direct messages</SectionTitle>
            </div>
            {!currentUserId ? (
              <EmptyCard text="Sign in to see your conversations." />
            ) : loadingConversations ? (
              <LoadingBlock />
            ) : conversationsList.length === 0 ? (
              <EmptyCard text="No direct messages yet. Use Find people & groups to start one." />
            ) : (
              <div className="flex flex-col gap-2">
                {visibleConversations.map((conversation) => (
                  <ThreadCard
                    key={conversation.id}
                    title={getConversationName(conversation)}
                    subtitle={conversation.last_message || "Open conversation"}
                    meta={conversation.last_message_time ? formatMessageTime(conversation.last_message_time) : ""}
                    initials={getConversationName(conversation)}
                    active={activeThread?.type === "dm" && activeThread.participantId === conversation.participant_id}
                    onClick={() => openConversation(conversation)}
                  />
                ))}
                {conversationsList.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDirectMessages((current) => !current)}
                    className="rounded-bc-md border border-bc-border bg-bc-surface px-3 py-2 text-[12.5px] font-bold text-bc-text-soft transition hover:border-bc-primary/40 hover:text-bc-primary"
                  >
                    {showAllDirectMessages
                      ? "Show fewer messages"
                      : `Show all messages (${conversationsList.length})`}
                  </button>
                )}
              </div>
            )}
          </section>

          <section>
            <button
              type="button"
              onClick={() => setShowDiscovery((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-bc-xl border border-bc-border bg-bc-surface p-4 text-left shadow-bc-sm transition hover:border-bc-primary/40 hover:bg-bc-surface-muted"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
                  <Search size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-bc-text">Find people & groups</div>
                  <div className="truncate text-[12px] text-bc-subtext">Search readers or discover public circles.</div>
                </div>
              </div>
              <span className="shrink-0 rounded-bc-md border border-bc-border bg-bc-surface px-3 py-1.5 text-[12px] font-bold text-bc-text-soft">
                {showDiscovery ? "Close" : "Open"}
              </span>
            </button>

            {showDiscovery && currentUserId && (
              <form onSubmit={handlePeopleSearch} className="mt-3 flex gap-2">
                <Input
                  value={peopleSearchDraft}
                  onChange={(event) => setPeopleSearchDraft(event.target.value)}
                  placeholder="Search groups, usernames, or email..."
                  leftIcon={<Search size={16} />}
                  inputSize="sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={pendingMemberSearch.length < 2}
                  leftIcon={loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={14} />}
                >
                  Search
                </Button>
              </form>
            )}

            {showDiscovery && (
              <div className="mt-3 rounded-bc-xl border border-bc-border bg-bc-surface-2 p-3 shadow-bc-sm">
                {!currentUserId ? (
                  <EmptyCard text="Sign in to browse members and groups." />
                ) : (
                  <div className="grid gap-5">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3 rounded-bc-lg border border-bc-border bg-bc-surface px-3 py-2">
                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-bc-text-soft">
                          <Users size={14} className="text-bc-primary" />
                          Groups
                        </div>
                        <div className="text-[11.5px] font-medium text-bc-subtext">
                          {memberSearch.length >= 2 ? `Matching "${memberSearch}"` : "Suggested"}
                        </div>
                      </div>
                      {loadingCircles ? (
                        <LoadingBlock />
                      ) : discoveredCircles.length === 0 ? (
                        <EmptyCard
                          text={
                            memberSearch.length >= 2
                              ? `No groups found for "${memberSearch}".`
                              : "No groups to discover right now."
                          }
                        />
                      ) : (
                        <div className="grid gap-2">
                          {discoveredCircles.map((circle) => {
                            const isJoined = myCircles.some((item) => String(item.id) === String(circle.id));
                            const isActive =
                              activeThread?.type === "group" && String(activeThread.id) === String(circle.id);

                            return (
                              <div
                                key={circle.id}
                                className={[
                                  "overflow-hidden rounded-bc-xl border bg-bc-surface text-left shadow-bc-xs transition hover:border-bc-primary/40 hover:shadow-bc-sm",
                                  isActive ? "border-bc-primary" : "border-bc-border",
                                ].join(" ")}
                              >
                                <button
                                  type="button"
                                  onClick={() => openGroup(circle)}
                                  className="flex w-full min-w-0 items-start gap-3 p-4 text-left"
                                >
                                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-bc-lg bg-bc-primary-soft text-bc-primary">
                                    <Users size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <div className="truncate text-[13.5px] font-bold text-bc-text">
                                        {circle.name}
                                      </div>
                                      {isJoined && (
                                        <span className="shrink-0 rounded-full bg-bc-primary-soft px-2 py-0.5 text-[10.5px] font-bold text-bc-primary">
                                          Joined
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-bc-subtext">
                                      {circle.description || `${circle.member_count || 1} members`}
                                    </p>
                                  </div>
                                </button>
                                <div className="flex items-center justify-between gap-3 border-t border-bc-border bg-bc-surface-2 px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-bc-subtext">
                                    <Users size={12} />
                                    {circle.member_count || 1} members
                                  </span>
                                  <Button
                                    size="sm"
                                    variant={isJoined ? "ghost" : "secondary"}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (isJoined) {
                                        openGroup(circle);
                                        return;
                                      }
                                      void handleJoinGroup(circle);
                                    }}
                                  >
                                    {isJoined ? "Open" : "Join"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3 rounded-bc-lg border border-bc-border bg-bc-surface px-3 py-2">
                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-bc-text-soft">
                          <MessageCircle size={14} className="text-bc-primary" />
                          People
                        </div>
                        {memberSearch.length >= 2 && (
                          <div className="text-[11.5px] font-medium text-bc-subtext">
                            Matching "{memberSearch}"
                          </div>
                        )}
                      </div>
                      {memberSearch.length < 2 ? (
                        <FindPeoplePrompt hasDraft={pendingMemberSearch.length >= 2} />
                      ) : loadingUsers ? (
                        <LoadingBlock />
                      ) : users.length === 0 ? (
                        <EmptyCard text={`No people found for "${memberSearch}".`} />
                      ) : (
                        <div className="grid gap-2">
                          {users.slice(0, 5).map((user) => (
                            <div
                              key={user.id}
                              className={[
                                "flex w-full items-center gap-3 rounded-bc-xl border bg-bc-surface p-3 text-left shadow-bc-xs transition hover:border-bc-primary/40 hover:shadow-bc-sm",
                                activeThread?.type === "dm" && activeThread.participantId === user.id
                                  ? "border-bc-primary bg-bc-primary-soft/60"
                                  : "border-bc-border",
                              ].join(" ")}
                            >
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bc-primary-soft text-sm font-bold text-bc-primary">
                                {getInitials(user.username)}
                              </div>
                              <button
                                type="button"
                                onClick={() => openPerson(user)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="truncate text-[13.5px] font-bold text-bc-text">{user.username}</div>
                                <div className="truncate text-[12px] text-bc-subtext">{user.email}</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => openPerson(user)}
                                className="shrink-0 rounded-bc-md border border-bc-border bg-bc-surface px-3 py-1.5 text-[12px] font-bold text-bc-text-soft transition hover:border-bc-primary/40 hover:text-bc-primary"
                              >
                                Message
                              </button>
                            </div>
                          ))}
                          {users.length > 5 && (
                            <div className="px-1 pt-1 text-[12px] font-medium text-bc-subtext">
                              Showing the best 5 matches. Refine the search for more specific results.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 xl:self-start">
          <ChatPanel
            activeThread={activeThread}
            messages={threadMessages}
            loading={loadingThread}
            sending={sendingMessage}
            value={newMessage}
            error={chatError}
            currentUserId={currentUserId || ""}
            messagesContainerRef={messagesContainerRef}
            onChange={setNewMessage}
            onSubmit={handleSendMessage}
            showEmojiPicker={showEmojiPicker}
            selectedAttachment={selectedAttachment}
            imageInputRef={imageInputRef}
            documentInputRef={documentInputRef}
            onToggleEmojiPicker={() => setShowEmojiPicker((current) => !current)}
            onAppendEmoji={appendEmoji}
            onAttachmentSelection={handleAttachmentSelection}
            onClearAttachment={clearSelectedAttachment}
          />
        </div>
      </div>
    </PageLayout>
  );
}

function ThreadCard({
  title,
  subtitle,
  meta,
  initials,
  icon,
  actionLabel,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  initials?: string;
  icon?: ReactNode;
  actionLabel?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "bc-card bc-card-hover flex w-full items-center gap-3 p-4 text-left transition",
        active ? "border-bc-primary bg-bc-primary-soft/60" : "",
      ].join(" ")}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary font-bold">
        {icon || getInitials(initials)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[13.5px] font-bold text-bc-text">{title}</div>
          {meta && <div className="shrink-0 text-[11px] text-bc-subtext">{meta}</div>}
        </div>
        <div className="mt-1 truncate text-[12px] text-bc-subtext">{subtitle}</div>
      </div>
      {actionLabel && (
        <span className="rounded-bc-md border border-bc-border bg-bc-surface px-3 py-1.5 text-[12px] font-bold text-bc-text-soft">
          {actionLabel}
        </span>
      )}
    </button>
  );
}

function ChatPanel({
  activeThread,
  messages,
  loading,
  sending,
  value,
  error,
  currentUserId,
  messagesContainerRef,
  showEmojiPicker,
  selectedAttachment,
  imageInputRef,
  documentInputRef,
  onChange,
  onSubmit,
  onToggleEmojiPicker,
  onAppendEmoji,
  onAttachmentSelection,
  onClearAttachment,
}: {
  activeThread: ActiveThread | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  value: string;
  error: string;
  currentUserId: string;
  messagesContainerRef: RefObject<HTMLDivElement>;
  showEmojiPicker: boolean;
  selectedAttachment: File | null;
  imageInputRef: RefObject<HTMLInputElement>;
  documentInputRef: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleEmojiPicker: () => void;
  onAppendEmoji: (emoji: string) => void;
  onAttachmentSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearAttachment: () => void;
}) {
  const memberCount =
    activeThread?.type === "group"
      ? activeThread.group.member_count || activeThread.group.members?.length || 1
      : undefined;

  return (
    <section className="bc-card sticky top-24 z-0 flex h-[calc(100vh-8rem)] min-h-[560px] overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-bc-border bg-bc-surface px-5 py-4">
          {activeThread ? (
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-bc-lg bg-bc-primary-soft text-bc-primary">
                {activeThread.type === "group" ? <Users size={18} /> : getInitials(activeThread.title)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-bc-text">{activeThread.title}</h2>
                <p className="truncate text-[12.5px] text-bc-subtext">
                  {activeThread.type === "group"
                    ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                    : activeThread.subtitle || "Direct message"}
                </p>
              </div>
              <span className="rounded-full bg-bc-surface-muted px-2.5 py-1 text-[11px] font-bold text-bc-text-soft">
                {activeThread.type === "group" ? "Group" : "DM"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-bc-lg bg-bc-primary-soft text-bc-primary">
                <MessageCircle size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-bc-text">Choose a conversation</h2>
                <p className="text-[12.5px] text-bc-subtext">Open a group or message a reader.</p>
              </div>
            </div>
          )}
        </div>

        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-y-auto bg-bc-surface-2 px-4 py-5 sm:px-6"
        >
          {!activeThread ? (
            <ChatEmpty
              title="Everything happens here"
              text="Select a circle, a direct conversation, or a person from the left to start chatting."
            />
          ) : loading ? (
            <div className="grid h-full place-items-center">
              <div className="flex items-center gap-3 rounded-full border border-bc-border bg-bc-surface px-4 py-2 text-sm font-semibold text-bc-text-soft shadow-bc-xs">
                <Loader2 className="h-4 w-4 animate-spin text-bc-primary" />
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <ChatEmpty
              title={activeThread.type === "group" ? "Start this circle" : "Start the conversation"}
              text={
                activeThread.type === "group"
                  ? "Ask what everyone is reading, share a thought, or post the first prompt."
                  : "Send a friendly note and begin the exchange."
              }
            />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMe = message.sender_id === currentUserId;
                const senderName = message.sender_name || message.sender_id;
                const attachmentUrl = message.attachment_url || message.attachment || "";
                const isImageAttachment = (message.attachment_type || "").startsWith("image/");

                return (
                  <div
                    key={message.id}
                    className={["flex items-end gap-2", isMe ? "justify-end" : "justify-start"].join(" ")}
                  >
                    {!isMe && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-bc-border bg-bc-surface text-[11px] font-bold text-bc-primary shadow-bc-xs">
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
                      {!isMe && activeThread.type === "group" && (
                        <div className="mb-1 text-[11.5px] font-bold text-bc-primary">{senderName}</div>
                      )}
                      {attachmentUrl ? (
                        isImageAttachment ? (
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-3 block overflow-hidden rounded-bc-lg"
                          >
                            <img
                              src={attachmentUrl}
                              alt={message.attachment_name || "Shared image"}
                              className="max-h-72 w-full rounded-bc-lg object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={[
                              "mb-3 flex items-center justify-between gap-3 rounded-bc-lg border px-3 py-3 transition",
                              isMe
                                ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                                : "border-bc-border bg-bc-surface-2 text-bc-text hover:bg-bc-surface-muted",
                            ].join(" ")}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <FileText className="h-5 w-5 shrink-0" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {message.attachment_name || "Attachment"}
                                </p>
                                <p className={["text-xs", isMe ? "text-white/75" : "text-bc-subtext"].join(" ")}>
                                  {formatFileSize(message.attachment_size)}
                                </p>
                              </div>
                            </div>
                            <Download className="h-4 w-4 shrink-0" />
                          </a>
                        )
                      ) : null}
                      {message.content ? (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                      ) : null}
                      <div
                        className={[
                          "mt-1.5 text-right text-[11px] font-medium",
                          isMe ? "text-white/75" : "text-bc-subtext",
                        ].join(" ")}
                      >
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-bc-border bg-bc-surface p-4">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={onAttachmentSelection}
            className="hidden"
          />
          <input
            ref={documentInputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={onAttachmentSelection}
            className="hidden"
          />
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-bc-md border border-bc-danger/30 bg-bc-danger/10 px-3 py-2 text-[13px] text-bc-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {selectedAttachment && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-bc-lg border border-bc-border bg-bc-surface-2 px-3 py-2 shadow-bc-xs">
              <div className="flex min-w-0 items-center gap-3">
                {selectedAttachment.type.startsWith("image/") ? (
                  <ImageIcon className="h-5 w-5 shrink-0 text-bc-primary" />
                ) : (
                  <FileText className="h-5 w-5 shrink-0 text-bc-primary" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-bc-text">{selectedAttachment.name}</div>
                  <div className="text-[12px] text-bc-subtext">{formatFileSize(selectedAttachment.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearAttachment}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-bc-subtext transition hover:bg-bc-surface-muted hover:text-bc-text"
                aria-label="Remove attachment"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-bc-lg border border-bc-border bg-bc-surface-2 p-2 shadow-bc-xs transition focus-within:border-bc-primary focus-within:shadow-bc-glow">
            <div className="relative flex shrink-0 items-center gap-1 pb-0.5">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 z-20 mb-3 flex w-56 flex-wrap gap-1 rounded-bc-lg border border-bc-border bg-bc-surface p-2 shadow-bc-lg">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onAppendEmoji(emoji)}
                      className="grid h-9 w-9 place-items-center rounded-bc-md text-xl transition hover:bg-bc-surface-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={onToggleEmojiPicker}
                disabled={!activeThread || sending}
                className="grid h-10 w-10 place-items-center rounded-bc-md text-bc-text-soft transition hover:bg-bc-surface-muted hover:text-bc-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Open emoji picker"
                title="Emoji"
              >
                <Smile size={17} />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={!activeThread || sending}
                className="grid h-10 w-10 place-items-center rounded-bc-md text-bc-text-soft transition hover:bg-bc-surface-muted hover:text-bc-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Attach image"
                title="Attach image"
              >
                <ImageIcon size={17} />
              </button>
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                disabled={!activeThread || sending}
                className="grid h-10 w-10 place-items-center rounded-bc-md text-bc-text-soft transition hover:bg-bc-surface-muted hover:text-bc-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Attach file"
                title="Attach file"
              >
                <Paperclip size={17} />
              </button>
            </div>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={activeThread ? "Write a message, add an emoji, or share a file..." : "Choose a conversation first..."}
              disabled={!activeThread || sending}
              rows={2}
              className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-bc-text outline-none placeholder:text-bc-subtext disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              size="md"
              className="h-11 w-11 px-0"
              disabled={!activeThread || (!value.trim() && !selectedAttachment) || sending}
              aria-label="Send message"
              title="Send message"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function ChatEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid h-full place-items-center px-4 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-bc-2xl bg-bc-primary-soft text-bc-primary shadow-bc-xs">
          <MessageCircle size={28} />
        </div>
        <h3 className="mt-5 text-lg font-bold text-bc-text">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-bc-subtext">{text}</p>
      </div>
    </div>
  );
}

function FindPeoplePrompt({ hasDraft }: { hasDraft: boolean }) {
  return (
    <div className="rounded-bc-xl border border-dashed border-bc-border bg-bc-surface p-5 shadow-bc-xs">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-bc-lg bg-bc-primary-soft text-bc-primary">
          <Search size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-bc-text">
            {hasDraft ? "Ready when you are" : "Find a reader by name or email"}
          </div>
          <p className="mt-1 text-[13px] leading-5 text-bc-subtext">
            {hasDraft
              ? "Press Search to look up matching readers."
              : "Type at least 2 characters, then press Search to look up someone specific."}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-6 w-6 animate-spin text-bc-primary" />
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="bc-card p-5 text-sm text-bc-subtext">{text}</div>;
}
