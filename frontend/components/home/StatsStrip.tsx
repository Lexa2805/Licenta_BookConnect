"use client";

import { BookOpen, Clock, Flame, TrendingUp, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "../stats/StatCard";
import { libraryService } from "@/lib/services/library";
import { marketplaceService } from "@/lib/services/marketplace";

type UserLibraryEntries = Awaited<ReturnType<typeof libraryService.getAllUserLibrary>>;

function buildCommunityRank(userId?: string, allEntries: UserLibraryEntries = []) {
  if (!userId || allEntries.length === 0) {
    return "Not ranked";
  }

  const finishedByUser = new Map<string, number>();
  for (const entry of allEntries) {
    if (!finishedByUser.has(entry.user_id)) {
      finishedByUser.set(entry.user_id, 0);
    }
    if (entry.status === "FINISHED") {
      finishedByUser.set(entry.user_id, (finishedByUser.get(entry.user_id) ?? 0) + 1);
    }
  }

  const currentUserFinished = finishedByUser.get(userId);
  if (currentUserFinished === undefined || currentUserFinished === 0 || finishedByUser.size < 2) {
    return "Not ranked";
  }

  const readersAhead = [...finishedByUser.values()].filter((count) => count > currentUserFinished).length;
  const percentile = Math.max(1, Math.round((readersAhead / finishedByUser.size) * 100));
  return `Top ${percentile}%`;
}

export function StatsStrip() {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const { data: userLibrary = [] } = useQuery({
    queryKey: ["home-stats-user-library", userId],
    queryFn: () => libraryService.getUserLibrary(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: allUserLibrary = [] } = useQuery({
    queryKey: ["home-stats-reader-rank"],
    queryFn: () => libraryService.getAllUserLibrary(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ["home-stats-my-listings", userId],
    queryFn: () => marketplaceService.getMyListings(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: streak } = useQuery({
    queryKey: ["reading-streak", userId],
    queryFn: () => libraryService.getReadingStreak(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const booksRead = userLibrary.filter((entry) => entry.status === "FINISHED").length;
  const recentlyFinished = userLibrary.filter((entry) => {
    if (entry.status !== "FINISHED") return false;
    const updatedAt = new Date(entry.updated_at).getTime();
    return Number.isFinite(updatedAt) && Date.now() - updatedAt <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const activeSwaps = myListings.filter(
    (listing) => listing.status === "LISTED" && Number.parseFloat(listing.price) === 0,
  ).length;
  const streakDays = streak?.streak_days ?? 0;
  const communityRank = buildCommunityRank(userId, allUserLibrary);

  return (
    <section className="bc-stagger grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Books read"
        value={userId ? booksRead.toString() : "-"}
        Icon={BookOpen}
        accent="var(--bc-primary)"
        trendColor="success"
        trend={
          <>
            <TrendingUp size={12} /> {recentlyFinished} finished in 30 days
          </>
        }
      />
      <StatCard
        label="Active swaps"
        value={userId ? activeSwaps.toString() : "-"}
        Icon={Clock}
        accent="var(--bc-accent-sky)"
        trend="Free active marketplace listings"
      />
      <StatCard
        label="Reading streak"
        value={userId ? streakDays.toString() : "-"}
        Icon={Flame}
        accent="var(--bc-warning)"
        trendColor="warning"
        trend={
          <span className="inline-flex items-center gap-1">
            <Flame size={12} /> Days in a row
          </span>
        }
      />
      <StatCard
        label="Community rank"
        value={userId ? communityRank : "-"}
        Icon={Users}
        accent="var(--bc-secondary)"
        trend="Based on finished books"
      />
    </section>
  );
}
