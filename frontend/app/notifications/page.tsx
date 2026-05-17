"use client";

import { Bell, Bookmark, BookOpen, Loader2, MessageCircle, MessageSquare, Plus, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { chatService } from "@/lib/services/chat";
import { libraryService } from "@/lib/services/library";
import { marketplaceService } from "@/lib/services/marketplace";
import type { ReactNode } from "react";

type ActivityKind = "finished" | "thread" | "listed" | "wishlist";

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  date: string;
  content: ReactNode;
};

const ACTIVITY_META: Record<ActivityKind, { icon: ReactNode; bg: string }> = {
  finished: { icon: <BookOpen size={14} className="text-white" />, bg: "var(--bc-success)" },
  thread: { icon: <MessageCircle size={14} className="text-white" />, bg: "var(--bc-accent-sky)" },
  listed: { icon: <Plus size={14} className="text-white" />, bg: "var(--bc-primary)" },
  wishlist: { icon: <Bookmark size={14} className="text-white" />, bg: "var(--bc-accent-plum)" },
};

const notifications = [
  {
    title: "Library is ready",
    body: "Browse the catalog and open any book details page.",
    href: "/library",
    Icon: BookOpen,
  },
  {
    title: "Marketplace updates",
    body: "Check listings, reviews, and seller conversations.",
    href: "/marketplace",
    Icon: Store,
  },
  {
    title: "Community messages",
    body: "Open your groups or direct messages from the community area.",
    href: "/community",
    Icon: MessageSquare,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const { data: circles = [] } = useQuery({
    queryKey: ["notifications-my-circles", userId],
    queryFn: () => chatService.getMyGroups(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: activities = [], isLoading: loadingActivity } = useQuery({
    queryKey: ["notifications-real-activity", userId, circles.map((circle) => circle.id).join(",")],
    queryFn: async () => {
      const [userLibrary, listings, groupMessages] = await Promise.all([
        libraryService.getUserLibrary(userId!),
        marketplaceService.getMyListings(userId!),
        Promise.all(circles.slice(0, 5).map((circle) => chatService.getMessages(circle.id))),
      ]);

      const circleById = new Map(circles.map((circle) => [String(circle.id), circle.name]));
      const libraryActivities: ActivityItem[] = userLibrary
        .filter((entry) => entry.status === "FINISHED" || entry.status === "WANT_TO_READ")
        .map((entry) => ({
          id: `library-${entry.id}-${entry.status}`,
          kind: entry.status === "FINISHED" ? "finished" : "wishlist",
          date: entry.updated_at,
          content:
            entry.status === "FINISHED" ? (
              <span>
                You finished <em>{entry.book.title}</em>
              </span>
            ) : (
              <span>
                You added <em>{entry.book.title}</em> to wishlist
              </span>
            ),
        }));

      const listingActivities: ActivityItem[] = listings.map((listing) => ({
        id: `listing-${listing.id}`,
        kind: "listed",
        date: listing.created_at,
        content: (
          <span>
            You listed <em>{listing.title}</em>
            {Number.parseFloat(listing.price) === 0 ? " for swap" : " on the marketplace"}
          </span>
        ),
      }));

      const messageActivities: ActivityItem[] = groupMessages
        .flat()
        .filter((message: any) => message.group && message.timestamp)
        .map((message: any) => ({
          id: `message-${message.id}`,
          kind: "thread",
          date: message.timestamp,
          content: (
            <span>
              <strong>{message.sender_name || "Someone"}</strong> posted in{" "}
              <strong>{circleById.get(String(message.group)) || "a circle"}</strong>
            </span>
          ),
        }));

      return [...libraryActivities, ...listingActivities, ...messageActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return (
    <PageLayout
      active="profile"
      pageTitle="Notifications"
      pageSubtitle="Recent activity and quick paths through BookConnect."
      headerActions={
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back home
        </Button>
      }
    >
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold tracking-tight text-bc-text">Recent activity</h2>
        </div>
        <div className="bc-card p-6">
          {!userId ? (
            <div className="py-10 text-center text-sm text-bc-subtext">
              Log in to see recent activity from your account and circles.
            </div>
          ) : loadingActivity ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-bc-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-10 text-center text-sm text-bc-subtext">
              No recent activity yet.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-bc-border" />
              <div className="bc-stagger flex flex-col gap-5">
                {activities.map((item) => {
                  const meta = ACTIVITY_META[item.kind];
                  return (
                    <div key={item.id} className="flex gap-3.5 items-start relative z-[1]">
                      <div
                        className="grid place-items-center w-8 h-8 rounded-full shrink-0 ring-4 ring-bc-surface shadow-bc-sm"
                        style={{ background: meta.bg }}
                      >
                        {meta.icon}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm text-bc-text leading-snug mb-0.5">
                          {item.content}
                        </p>
                        <p className="text-[11.5px] text-bc-subtext">
                          {formatRelativeTime(item.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bc-card divide-y divide-bc-border overflow-hidden">
        {notifications.map((item) => {
          const Icon = item.Icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-bc-surface-muted"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-bc-text">{item.title}</span>
                <span className="mt-1 block text-[13px] text-bc-subtext">{item.body}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="bc-card border-dashed bg-transparent p-8 text-center">
        <Bell className="mx-auto mb-3 h-7 w-7 text-bc-primary" />
        <p className="text-sm font-semibold text-bc-text">You are all caught up.</p>
        <p className="mt-1 text-[13px] text-bc-subtext">
          New notifications will appear here when there is more activity.
        </p>
      </section>
    </PageLayout>
  );
}

function formatRelativeTime(value?: string) {
  if (!value) return "No activity yet";

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "No activity yet";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}
