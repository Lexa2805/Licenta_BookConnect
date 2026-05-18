"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Highlighter, Loader2, MessageSquare, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { manuscriptsService } from "@/lib/services/manuscripts";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PublicManuscriptReaderPage() {
  const params = useParams();
  const manuscriptId = String(params.id);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [selectedText, setSelectedText] = useState("");
  const [comment, setComment] = useState("");

  const { data: manuscript, isLoading, error } = useQuery({
    queryKey: ["public-manuscript", manuscriptId],
    queryFn: () => manuscriptsService.getManuscript(manuscriptId),
    enabled: Boolean(manuscriptId),
  });

  const feedback = useMemo(() => manuscript?.feedback ?? [], [manuscript?.feedback]);

  const feedbackMutation = useMutation({
    mutationFn: () =>
      manuscriptsService.createFeedback(manuscriptId, {
        user_id: String(session?.user?.id ?? "anonymous"),
        user_name:
          session?.user?.username ||
          session?.user?.email ||
          "Anonymous reader",
        selected_text: selectedText.trim(),
        comment: comment.trim(),
      }),
    onSuccess: () => {
      setComment("");
      setSelectedText("");
      queryClient.invalidateQueries({ queryKey: ["public-manuscript", manuscriptId] });
      queryClient.invalidateQueries({ queryKey: ["public-manuscripts"] });
    },
  });

  function captureSelection() {
    const selection = window.getSelection()?.toString().trim() ?? "";
    if (selection) setSelectedText(selection.slice(0, 1200));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    feedbackMutation.mutate();
  }

  if (isLoading) {
    return (
      <PageLayout active="manuscripts" pageTitle="Public Works">
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error || !manuscript) {
    return (
      <PageLayout active="manuscripts" pageTitle="Manuscript not found">
        <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-8 text-center shadow-bc-sm">
          <p className="text-bc-subtext">
            This manuscript is private, unpublished, or no longer available.
          </p>
          <Link href="/manuscripts" className="mt-5 inline-flex">
            <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>
              Back to public works
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      active="manuscripts"
      pageTitle={manuscript.title}
      pageSubtitle={`By ${manuscript.author_name || "Unknown author"} - updated ${formatDate(manuscript.updated_at)}.`}
      headerActions={
        <Link href="/manuscripts">
          <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>
            Back
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-bc-lg border border-bc-border bg-bc-surface shadow-bc-sm">
          {manuscript.cover_url && (
            <div className="flex flex-wrap items-center gap-5 border-b border-bc-border bg-bc-surface-muted px-5 py-5">
              <img
                src={manuscript.cover_url}
                alt={`${manuscript.title} cover`}
                className="h-44 w-28 rounded-bc-md border border-bc-border object-cover shadow-bc-md"
              />
              <div className="min-w-0">
                <Badge variant="soft">Cover</Badge>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-bc-text">
                  {manuscript.cover_tagline || manuscript.title}
                </p>
              </div>
            </div>
          )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bc-border px-5 py-4">
            <div>
              <Badge variant="soft">Reader</Badge>
              <p className="mt-2 text-sm font-semibold text-bc-text">
                {manuscript.title}
              </p>
              <p className="text-xs text-bc-subtext">
                by {manuscript.author_name || "Unknown author"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Highlighter size={14} />}
              onClick={captureSelection}
            >
              Add selected text
            </Button>
          </div>
          <div
            onMouseUp={captureSelection}
            className="prose prose-sm max-w-none px-5 py-6 text-bc-text prose-p:leading-8 prose-p:text-bc-text-soft"
          >
            {manuscript.content.trim() ? (
              manuscript.content.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="mb-5 whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-bc-subtext">This manuscript does not have text yet.</p>
            )}
          </div>
        </article>

        <aside className="flex flex-col gap-5">
          <section className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={17} className="text-bc-primary" />
              <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-bc-text-soft">
                Leave Feedback
              </h2>
            </div>

            {selectedText && (
              <div className="mb-4 rounded-bc-md border border-bc-border bg-bc-surface-muted p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-bc-subtext">
                  Selected text
                </div>
                <p className="line-clamp-5 text-xs leading-5 text-bc-text-soft">
                  {selectedText}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedText("")}
                  className="mt-2 text-xs font-semibold text-bc-primary hover:underline"
                >
                  Clear selection
                </button>
              </div>
            )}

            {session?.user ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={5}
                  required
                  placeholder="Share what worked, what confused you, or what you want to read next..."
                  className="w-full resize-none rounded-bc-md border border-bc-border bg-bc-surface p-3 text-sm text-bc-text outline-none transition focus:border-bc-primary focus:shadow-bc-glow"
                />
                <Button
                  type="submit"
                  disabled={feedbackMutation.isPending || !comment.trim()}
                  leftIcon={
                    feedbackMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send size={14} />
                    )
                  }
                  fullWidth
                >
                  Send feedback
                </Button>
              </form>
            ) : (
              <div className="rounded-bc-md bg-bc-surface-muted p-4 text-sm text-bc-subtext">
                Log in to leave feedback on this manuscript.
                <Link href="/login" className="ml-1 font-semibold text-bc-primary hover:underline">
                  Log in
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-bc-text-soft">
              Reader Feedback
            </h2>
            {feedback.length === 0 ? (
              <p className="text-sm text-bc-subtext">No feedback yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-bc-md border border-bc-border bg-bc-surface-muted p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-bc-text">
                        {item.user_name}
                      </span>
                      <span className="text-[11px] text-bc-subtext">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    {item.selected_text && (
                      <blockquote className="mb-2 border-l-2 border-bc-primary pl-3 text-xs leading-5 text-bc-subtext">
                        {item.selected_text}
                      </blockquote>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-6 text-bc-text-soft">
                      {item.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </PageLayout>
  );
}
