"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Calendar,
  Loader2,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { SectionTitle } from "../ui/SectionTitle";
import { chatService, type ChatGroup } from "@/lib/services/chat";
import { libraryService } from "@/lib/services/library";
import { marketplaceService } from "@/lib/services/marketplace";

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

const AVATAR_COLORS = ["#A8581F", "#E8A9A9", "#8AA98F", "#A8B8C8", "#D67A3A", "#9B6A7A"];

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

function avatarColors(groupId: number) {
  return Array.from({ length: 3 }, (_, index) => AVATAR_COLORS[(groupId + index) % AVATAR_COLORS.length]);
}

function groupActivityDate(group: ChatGroup) {
  return group.last_message_time || group.created_at;
}

export function CommunityPulse() {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const { data: circles = [], isLoading: loadingCircles } = useQuery({
    queryKey: ["home-my-circles", userId],
    queryFn: () => chatService.getMyGroups(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: activities = [], isLoading: loadingActivity } = useQuery({
    queryKey: ["home-real-activity", userId, circles.map((circle) => circle.id).join(",")],
    queryFn: async () => {
      const [userLibrary, listings, groupMessages] = await Promise.all([
        libraryService.getUserLibrary(userId!),
        marketplaceService.getMyListings(userId!),
        Promise.all(circles.slice(0, 5).map((circle) => chatService.getMessages(circle.id))),
      ]);

      const circleById = new Map(circles.map((circle) => [circle.id, circle.name]));
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
              <strong>{circleById.get(message.group) || "a circle"}</strong>
            </span>
          ),
        }));

      return [...libraryActivities, ...listingActivities, ...messageActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return (
    <section className="grid lg:grid-cols-2 gap-8">
      <div>
        <div className="mb-5">
          <SectionTitle>Reading circles you follow</SectionTitle>
        </div>
        <div className="bc-stagger flex flex-col gap-3">
          {!userId ? (
            <div className="bc-card border-dashed bg-transparent p-6 text-center text-sm text-bc-subtext">
              Log in to see the circles you follow.
            </div>
          ) : loadingCircles ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-bc-primary" />
            </div>
          ) : circles.length === 0 ? (
            <div className="bc-card border-dashed bg-transparent p-6 text-center text-sm text-bc-subtext">
              You have not joined any reading circles yet.
            </div>
          ) : (
            circles.slice(0, 3).map((circle) => (
              <Link
                key={circle.id}
                href={`/community/chat/${circle.id}`}
                className="bc-card bc-card-hover p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="text-[15px] font-semibold text-bc-text mb-1.5">
                    {circle.name}
                  </h4>
                  <div className="text-[12.5px] text-bc-subtext flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {circle.member_count ?? circle.members?.length ?? 0}
                    </span>
                    <span className="w-[3px] h-[3px] rounded-full bg-bc-border-strong" />
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {formatRelativeTime(groupActivityDate(circle))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {avatarColors(circle.id).map((color, index) => (
                      <span
                        key={color}
                        className="w-[30px] h-[30px] rounded-full border-2 border-bc-surface shadow-bc-sm"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                          marginLeft: index > 0 ? -10 : 0,
                        }}
                      />
                    ))}
                  </div>
                  <ArrowUpRight size={16} className="text-bc-subtext" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="mb-5">
          <SectionTitle>Recent activity</SectionTitle>
        </div>
        <div className="bc-card p-6 relative">
          {!userId ? (
            <div className="py-10 text-center text-sm text-bc-subtext">
              Log in to see real activity from your account and circles.
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
      </div>
    </section>
  );
}
