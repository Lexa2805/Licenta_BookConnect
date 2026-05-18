"use client";

import Link from "next/link";
import { ArrowRight, FileText, Loader2, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { manuscriptsService } from "@/lib/services/manuscripts";

function excerpt(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return "This public manuscript does not have text yet.";
  return cleaned.length > 190 ? `${cleaned.slice(0, 190)}...` : cleaned;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PublicManuscriptsPage() {
  const { data: manuscripts = [], isLoading } = useQuery({
    queryKey: ["public-manuscripts"],
    queryFn: () => manuscriptsService.getManuscripts(),
  });

  return (
    <PageLayout
      active="manuscripts"
      pageTitle="Public Works"
      pageSubtitle="Read manuscripts shared by the community and leave thoughtful feedback for the author."
    >
      {isLoading ? (
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : manuscripts.length === 0 ? (
        <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-10 text-center shadow-bc-sm">
          <FileText className="mx-auto mb-4 h-10 w-10 text-bc-subtext" />
          <h2 className="font-display text-2xl font-semibold text-bc-text">
            No public manuscripts yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-bc-subtext">
            When writers publish work from Studio, it will appear here for other readers.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {manuscripts.map((manuscript) => (
            <article
              key={manuscript.id}
              className="bc-card bc-card-hover flex min-h-[250px] flex-col gap-5 p-5"
            >
              <div className="flex items-start gap-4">
                {manuscript.cover_url ? (
                  <img
                    src={manuscript.cover_url}
                    alt=""
                    className="h-32 w-20 shrink-0 rounded-bc-md border border-bc-border object-cover shadow-bc-sm"
                  />
                ) : (
                  <div className="grid h-32 w-20 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
                    <FileText size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <Badge variant="soft">Public manuscript</Badge>
                  <h2 className="mt-3 line-clamp-2 font-display text-2xl font-semibold leading-tight text-bc-text">
                    {manuscript.title}
                  </h2>
                  <p className="mt-1 truncate text-sm font-semibold text-bc-subtext">
                    by {manuscript.author_name || "Unknown author"}
                  </p>
                </div>
              </div>

              <p className="line-clamp-4 text-sm leading-6 text-bc-text-soft">
                {excerpt(manuscript.content)}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-bc-border pt-4">
                <div className="flex flex-col gap-1 text-xs text-bc-subtext">
                  <span>Updated {formatDate(manuscript.updated_at)}</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={12} />
                    {manuscript.feedback?.length ?? 0} feedback note
                    {(manuscript.feedback?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <Link href={`/manuscripts/${manuscript.id}`}>
                  <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                    Read
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </PageLayout>
  );
}
