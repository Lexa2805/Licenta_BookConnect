"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Book,
  FileText,
  Globe2,
  Lock,
  Loader2,
  MessageSquare,
  Package,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/stats/StatCard";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { manuscriptsService } from "@/lib/services/manuscripts";
import { marketplaceService } from "@/lib/services/marketplace";
import { useRouter } from "next/navigation";

const RANGES = ["7d", "30d", "90d", "All"];
const AI_ENDPOINT = "http://127.0.0.1:8000/ai/generate/";

type AiMode = "correct" | "continue";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

type ChatConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const AI_MODES: Record<AiMode, { label: string; promptPrefix: string; Icon: typeof Wand2 }> = {
  correct: {
    label: "Correct Text",
    promptPrefix: "Correct this text grammatically: ",
    Icon: Wand2,
  },
  continue: {
    label: "Continue Text",
    promptPrefix: "Continue this story naturally: ",
    Icon: RefreshCcw,
  },
};

export default function StudioPage() {
  const [range, setRange] = useState("30d");
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id as string | undefined;
  const manuscriptUploadRef = useRef<HTMLInputElement | null>(null);
  const [uploadingManuscript, setUploadingManuscript] = useState(false);

  const { data: manuscripts = [], isLoading: loadingManuscripts, refetch: refetchManuscripts } = useQuery({
    queryKey: ["manuscripts", userId],
    queryFn: () => manuscriptsService.getManuscripts(userId),
    enabled: !!userId,
  });

  const { data: myListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["my-listings", userId],
    queryFn: () => marketplaceService.getMyListings(userId!),
    enabled: !!userId,
  });

  const publishedManuscripts = manuscripts.filter((m: any) => m.status === "published" || m.status === "PUBLISHED");
  const draftManuscripts = manuscripts.filter((m: any) => m.status === "draft" || m.status === "DRAFT");
  
  const totalListings = myListings.length;
  const activeListings = myListings.filter((l: any) => l.status === "LISTED" || l.status === "listed" || l.status === "AVAILABLE" || l.status === "available").length;
  
  const loading = loadingManuscripts || loadingListings;

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
  }

  function getTitleFromFileName(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, "").trim() || "Untitled manuscript";
  }

  async function handleNewManuscript() {
    if (!userId) {
      alert("Please sign in before creating a manuscript.");
      return;
    }

    try {
      const manuscript = await manuscriptsService.createManuscript({
        title: "Untitled manuscript",
        content: "",
        author_id: userId,
        status: "DRAFT",
      });
      await refetchManuscripts();
      router.push(`/studio/editor/${manuscript.id}`);
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err, "Failed to create manuscript."));
    }
  }

  async function handleManuscriptUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!userId) {
      alert("Please sign in before uploading a manuscript.");
      return;
    }

    setUploadingManuscript(true);

    try {
      const data = new FormData();
      data.append("title", getTitleFromFileName(file.name));
      data.append("author_id", userId);
      data.append("status", "DRAFT");
      data.append("file", file);

      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        data.append("content", await file.text());
      } else {
        data.append("content", "");
      }

      const manuscript = await manuscriptsService.createManuscript(data);
      await refetchManuscripts();
      router.push(`/studio/editor/${manuscript.id}`);
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err, "Failed to upload manuscript."));
    } finally {
      setUploadingManuscript(false);
    }
  }

  async function handleToggleVisibility(manuscript: any) {
    if (!userId) {
      alert("Please sign in to update manuscripts.");
      return;
    }

    const nextStatus = manuscript.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const label = nextStatus === "PUBLISHED" ? "public" : "private";

    try {
      await manuscriptsService.updateManuscript(manuscript.id, { status: nextStatus }, userId);
      await refetchManuscripts();
    } catch (err) {
      console.error(err);
      alert(`Failed to make manuscript ${label}.`);
    }
  }

  return (
    <PageLayout
      active="studio"
      pageTitle="Studio"
      pageSubtitle="Shape ideas with AI, then manage your listings, swaps, earnings, and self-published works."
      headerActions={
        <>
          <input
            ref={manuscriptUploadRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
            onChange={handleManuscriptUpload}
            className="hidden"
          />
          <Button variant="secondary" onClick={() => router.push("/marketplace/create")}>New Listing</Button>
          <Button
            variant="secondary"
            leftIcon={uploadingManuscript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={15} />}
            disabled={uploadingManuscript}
            onClick={() => manuscriptUploadRef.current?.click()}
          >
            Upload Manuscript
          </Button>
          <Button leftIcon={<Plus size={15} />} onClick={handleNewManuscript}>New Manuscript</Button>
        </>
      }
    >
      <StudioAiChat userId={userId} />

      <section className="bc-stagger grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active listings"
          value={loading ? "..." : activeListings.toString()}
          Icon={Package}
          trendColor="muted"
          trend={`${totalListings} total listings`}
        />
        <StatCard
          label="Published Works"
          value={loading ? "..." : publishedManuscripts.length.toString()}
          Icon={Book}
          trendColor="success"
          trend="Live in library"
        />
        <StatCard
          label="Drafts"
          value={loading ? "..." : draftManuscripts.length.toString()}
          Icon={FileText}
          trendColor="warning"
          trend="In progress"
        />
        <StatCard
          label="Avg Rating"
          value={loading ? "..." : "0.0"}
          Icon={Star}
          trendColor="muted"
          trend="Not enough data"
        />
      </section>

      <section className="bc-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <SectionHeader title="Earnings over time" />
          <div className="flex gap-1 bg-bc-surface-muted p-1 rounded-full">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={[
                  "px-3.5 h-8 rounded-full text-[12.5px] font-semibold transition-all",
                  r === range
                    ? "bg-bc-surface text-bc-primary shadow-bc-sm"
                    : "text-bc-subtext hover:text-bc-text",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <EarningsChart />
        <div className="flex items-center justify-between mt-4 px-1 text-[11px] text-bc-subtext font-medium">
          {["Aug 1", "Aug 6", "Aug 11", "Aug 16", "Aug 21", "Aug 26", "Aug 31"].map(
            (d) => (
              <span key={d}>{d}</span>
            ),
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Your Manuscripts" />
          <div className="bc-card divide-y divide-bc-border mt-2">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-bc-primary w-6 h-6" /></div>
            ) : manuscripts.length === 0 ? (
              <div className="text-center py-6 text-bc-subtext text-sm">No manuscripts found. Start writing!</div>
            ) : (
              manuscripts.slice(0, 6).map((m: any, i: number) => (
                <div key={m.id ?? i} className="flex items-center justify-between gap-4 py-4 px-5 hover:bg-bc-surface-muted transition-colors">
                  <div className="min-w-0 cursor-pointer" onClick={() => router.push(`/studio/editor/${m.id}`)}>
                    <div className="truncate text-[14px] font-semibold text-bc-text">{m.title}</div>
                    <div className="text-[12.5px] text-bc-subtext flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${m.status === "PUBLISHED" ? "bg-bc-success" : "bg-bc-warning"}`}></span>
                      {m.status === "PUBLISHED" ? "Public" : "Private"}
                      {m.file_url && (
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="font-semibold text-bc-primary hover:underline"
                        >
                          File
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleVisibility(m)}
                      className={[
                        "inline-flex h-9 items-center gap-1.5 rounded-bc-md border px-3 text-[12px] font-bold transition",
                        m.status === "PUBLISHED"
                          ? "border-bc-success/30 bg-bc-success/10 text-bc-success hover:bg-bc-success/15"
                          : "border-bc-border bg-bc-surface text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text",
                      ].join(" ")}
                      title={m.status === "PUBLISHED" ? "Make private" : "Make public"}
                    >
                      {m.status === "PUBLISHED" ? <Globe2 size={14} /> : <Lock size={14} />}
                      {m.status === "PUBLISHED" ? "Public" : "Private"}
                    </button>
                    <div className="hidden text-right sm:block">
                    <div className="text-[12.5px] text-bc-subtext">Updated {new Date(m.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div>
          <SectionHeader title="Your Listings" />
          <div className="bc-card divide-y divide-bc-border mt-2">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-bc-primary w-6 h-6" /></div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-6 text-bc-subtext text-sm">No listings yet.</div>
            ) : (
              myListings.slice(0, 4).map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-4 px-5 hover:bg-bc-surface-muted transition-colors cursor-pointer" onClick={() => router.push(`/marketplace/${l.id}`)}>
                  <div>
                    <div className="text-[14px] font-semibold text-bc-text">{l.title}</div>
                    <div className="text-[12.5px] text-bc-subtext">{l.price} Lei &bull; {l.condition}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12.5px] text-bc-subtext">{l.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function createNewConversation(): ChatConversation {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        role: "ai",
        content:
          "Welcome to your writing studio. Choose a mode, paste or upload text, and I will help you polish or continue it.",
      },
    ],
  };
}

function StudioAiChat({ userId }: { userId?: string }) {
  const storageKey = `bookconnect-studio-chats-${userId ?? "guest"}`;
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [mode, setMode] = useState<AiMode>("correct");
  const [input, setInput] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as ChatConversation[]) : [];
      const nextConversations = Array.isArray(parsed) && parsed.length > 0 ? parsed : [createNewConversation()];

      setConversations(nextConversations);
      setActiveConversationId(nextConversations[0].id);
    } catch {
      const fallback = createNewConversation();
      setConversations([fallback]);
      setActiveConversationId(fallback.id);
    }
  }, [storageKey]);

  useEffect(() => {
    if (conversations.length === 0) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const selectedMode = AI_MODES[mode];
  const hasText = Boolean(input.trim() || uploadedText.trim());

  function updateActiveConversation(updater: (conversation: ChatConversation) => ChatConversation) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId ? updater(conversation) : conversation,
      ),
    );
  }

  function appendMessage(message: ChatMessage) {
    updateActiveConversation((conversation) => {
      const nextMessages = [...conversation.messages, message];
      const firstUserMessage = nextMessages.find((item) => item.role === "user")?.content;

      return {
        ...conversation,
        messages: nextMessages,
        title:
          conversation.title === "New chat" && firstUserMessage
            ? firstUserMessage.replace(/\s+/g, " ").slice(0, 42)
            : conversation.title,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function handleNewChat() {
    const conversation = createNewConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setInput("");
    setUploadedText("");
    setUploadedFileName("");
    setError("");
  }

  function handleDeleteConversation() {
    if (!activeConversation) {
      return;
    }

    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== activeConversation.id);
      const nextConversations = remaining.length > 0 ? remaining : [createNewConversation()];
      setActiveConversationId(nextConversations[0].id);
      return nextConversations;
    });
    setError("");
  }

  async function sendMessage() {
    const sourceText = (input || uploadedText).trim();

    if (!sourceText || isLoading || !activeConversation) {
      return;
    }

    const finalPrompt =
      mode === "correct"
        ? `Correct this text grammatically: ${sourceText}`
        : `Continue this story naturally: ${sourceText}`;
    const visibleUserMessage = `${selectedMode.label}\n\n${sourceText}`;

    appendMessage({ role: "user", content: visibleUserMessage });
    setInput("");
    setUploadedText("");
    setUploadedFileName("");
    setError("");
    setIsLoading(true);

    try {
      console.log("Sending AI request to Django:", {
        endpoint: AI_ENDPOINT,
        mode,
        text: finalPrompt,
      });

      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: finalPrompt }),
      });

      if (!response.ok) {
        let details = "";
        try {
          const data = (await response.json()) as { error?: string };
          details = data.error ? `: ${data.error}` : "";
        } catch {
          details = "";
        }

        throw new Error(`AI request failed with status ${response.status}${details}`);
      }

      const data = (await response.json()) as { result?: string };
      console.log("Django AI response:", data);

      const aiResult = data.result?.trim();

      if (!aiResult) {
        throw new Error("The AI response did not include a result.");
      }

      appendMessage({ role: "ai", content: aiResult });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the AI response.";

      setError(message);
      appendMessage({
        role: "ai",
        content:
          "I could not complete that request. Please make sure the Django backend is running and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    const isTextFile = extension === "txt" || file.type === "text/plain";

    if (!isTextFile) {
      setUploadedFileName(fileName);
      setUploadedText("");
      setError(
        "This browser upload currently extracts plain .txt files. For PDF or DOCX, paste the text into the editor.",
      );
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const cleanedText = text.trim();

      if (!cleanedText) {
        throw new Error("The uploaded file did not contain readable text.");
      }

      setUploadedText(cleanedText);
      setUploadedFileName(fileName);
      setInput(cleanedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the uploaded file.");
    } finally {
      event.target.value = "";
    }
  }

  function clearUpload() {
    setUploadedText("");
    setUploadedFileName("");
    setInput("");
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <section className="bc-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-bc-border bg-bc-surface-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-bc-text">AI Chat Studio</h2>
            <p className="text-[13px] text-bc-subtext">
              Draft, refine, summarize, and brainstorm with your local AI endpoint.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-bc-border bg-bc-surface px-3 py-1.5 text-[12px] font-semibold text-bc-text-soft">
          <span className="h-2 w-2 rounded-full bg-bc-success" />
          Django AI
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-bc-border bg-bc-surface px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:pb-0">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
                className={[
                  "inline-flex h-9 max-w-[220px] shrink-0 items-center gap-2 rounded-bc-md border px-3 text-[12.5px] font-semibold transition",
                  isActive
                    ? "border-bc-primary bg-bc-primary-soft text-bc-primary"
                    : "border-bc-border bg-bc-surface-2 text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text",
                ].join(" ")}
                title={conversation.title}
              >
                <MessageSquare size={14} />
                <span className="truncate">{conversation.title}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-bc-md border border-bc-border bg-bc-surface-2 px-3 text-[12.5px] font-bold text-bc-text transition hover:bg-bc-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={14} />
            New chat
          </button>
          <button
            type="button"
            onClick={handleDeleteConversation}
            disabled={isLoading || conversations.length === 0}
            className="flex h-9 w-9 items-center justify-center rounded-bc-md border border-bc-border bg-bc-surface-2 text-bc-text-soft transition hover:bg-bc-danger/10 hover:text-bc-danger disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex h-[640px] flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((message, index) => (
            <ChatBubble key={`${message.role}-${index}`} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bc-primary-soft text-bc-primary">
                <Bot size={16} />
              </div>
              <div className="rounded-bc-lg border border-bc-border bg-bc-surface-muted px-4 py-3 shadow-bc-xs">
                <div className="flex items-center gap-2 text-sm font-medium text-bc-text-soft">
                  <Loader2 className="h-4 w-4 animate-spin text-bc-primary" />
                  Thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-bc-border bg-bc-surface p-4">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-bc-lg border border-bc-border bg-bc-surface-2 p-1.5 shadow-bc-xs">
            {(Object.keys(AI_MODES) as AiMode[]).map((modeKey) => {
              const option = AI_MODES[modeKey];
              const Icon = option.Icon;
              const isActive = mode === modeKey;

              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setMode(modeKey)}
                  disabled={isLoading}
                  className={[
                    "flex h-10 items-center justify-center gap-2 rounded-bc-md text-[13px] font-bold transition-all",
                    isActive
                      ? "bg-bc-primary text-white shadow-bc-primary"
                      : "text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text",
                    isLoading ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                >
                  <Icon size={15} />
                  {option.label}
                </button>
              );
            })}
          </div>

          {uploadedText && (
            <div className="mb-3 rounded-bc-lg border border-bc-border bg-bc-surface-2 p-3 shadow-bc-xs">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-bc-text">
                  <FileText className="h-4 w-4 shrink-0 text-bc-primary" />
                  <span className="truncate">{uploadedFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={clearUpload}
                  disabled={isLoading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-bc-subtext transition hover:bg-bc-surface-muted hover:text-bc-text disabled:cursor-not-allowed"
                  aria-label="Clear uploaded text"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-[12.5px] leading-5 text-bc-subtext">
                {uploadedText}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-bc-md border border-bc-danger/30 bg-bc-danger/10 px-3 py-2 text-[13px] text-bc-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-end gap-2 rounded-bc-lg border border-bc-border bg-bc-surface-2 p-2 shadow-bc-xs transition-all focus-within:border-bc-primary focus-within:shadow-bc-glow">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-bc-md text-bc-text-soft transition hover:bg-bc-surface-muted hover:text-bc-primary disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Upload text file"
              title="Upload text file"
            >
              <Upload size={17} />
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
              placeholder={
                mode === "correct"
                  ? "Paste text to correct, or upload a .txt file..."
                  : "Paste the beginning of a story, or upload a .txt file..."
              }
              className="max-h-40 min-h-20 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-bc-text outline-none placeholder:text-bc-subtext disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              size="md"
              className="h-10 w-10 px-0"
              disabled={!hasText || isLoading}
              aria-label={selectedMode.label}
              title={selectedMode.label}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11.5px] font-medium text-bc-subtext">
            <span>{selectedMode.label} will add the right instruction automatically.</span>
            <span>{input.trim().length} chars</span>
          </div>
        </form>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={["flex items-start gap-3", isUser ? "justify-end" : "justify-start"].join(" ")}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bc-primary-soft text-bc-primary">
          <Bot size={16} />
        </div>
      )}

      <div
        className={[
          "max-w-[82%] whitespace-pre-wrap rounded-bc-lg px-4 py-3 text-sm leading-6 shadow-bc-xs sm:max-w-[72%]",
          isUser
            ? "bg-bc-primary text-white"
            : "border border-bc-border bg-bc-surface-muted text-bc-text",
        ].join(" ")}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bc-surface-muted text-bc-text-soft">
          <User size={16} />
        </div>
      )}
    </div>
  );
}

/* Inline SVG line chart */
function EarningsChart() {
  // y values 0-100, x evenly spaced
  const points = [22, 28, 24, 36, 30, 42, 50, 46, 58, 54, 62, 70, 66, 78];
  const w = 100;
  const h = 40;
  const stepX = w / (points.length - 1);
  const max = 100;
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - (p / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <div className="w-full h-56 relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="bcEarnArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bc-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--bc-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bcEarnLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--bc-primary-grad-from)" />
            <stop offset="100%" stopColor="var(--bc-primary-grad-to)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#bcEarnArea)" />
        <path
          d={path}
          fill="none"
          stroke="url(#bcEarnLine)"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 2.2 }}
        />
      </svg>
    </div>
  );
}
