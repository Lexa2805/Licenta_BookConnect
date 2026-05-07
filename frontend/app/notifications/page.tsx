"use client";

import { Bell, BookOpen, MessageSquare, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";

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
