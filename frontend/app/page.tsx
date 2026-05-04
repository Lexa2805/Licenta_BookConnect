"use client";

import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Hero } from "@/components/home/Hero";
import { StatsStrip } from "@/components/home/StatsStrip";
import { ContinueReading } from "@/components/home/ContinueReading";
import { Recommended } from "@/components/home/Recommended";
import { CommunityPulse } from "@/components/home/CommunityPulse";

export default function HomePage() {
  const { data: session } = useSession();
  const username = session?.user?.username || "Guest";

  return (
    <PageLayout
      active="home"
      pageTitle={`Welcome back, ${username}`}
      pageSubtitle="A few stories chose you this week. Take a moment."
    >
      <Hero />
      <StatsStrip />
      <ContinueReading />
      <Recommended />
      <CommunityPulse />
    </PageLayout>
  );
}
