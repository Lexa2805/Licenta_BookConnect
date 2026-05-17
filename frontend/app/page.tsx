"use client";

import Link from "next/link";
import { BookOpen, LayoutGrid, Store } from "lucide-react";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Hero } from "@/components/home/Hero";
import { StatsStrip } from "@/components/home/StatsStrip";
import { ContinueReading } from "@/components/home/ContinueReading";
import { Recommended } from "@/components/home/Recommended";
import { CommunityPulse } from "@/components/home/CommunityPulse";
import { canReadLibrary, canUseStudio } from "@/lib/roles";

export default function HomePage() {
  const { data: session } = useSession();
  const username = session?.user?.username || session?.user?.email?.split("@")[0] || "";
  const showReaderHome = canReadLibrary(session?.user?.role);
  const showWriterHome = !showReaderHome && canUseStudio(session?.user?.role);

  return (
    <PageLayout
      active="home"
      pageTitle={username ? `Welcome back, ${username}` : "Welcome back"}
      pageSubtitle={
        showWriterHome
          ? "Your writing tools and marketplace are ready."
          : "A few stories chose you this week. Take a moment."
      }
    >
      {showReaderHome ? (
        <>
          <Hero />
          <StatsStrip />
          <ContinueReading />
          <Recommended />
        </>
      ) : (
        <WriterHome />
      )}
      <CommunityPulse />
    </PageLayout>
  );
}

function WriterHome() {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      <Link href="/studio" className="bc-card bc-card-hover p-6">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
          <LayoutGrid size={22} />
        </div>
        <h2 className="font-display text-2xl font-semibold text-bc-text">Studio</h2>
        <p className="mt-2 text-sm leading-6 text-bc-subtext">
          Draft, upload, polish, and publish manuscripts from your writing workspace.
        </p>
      </Link>
      <Link href="/marketplace" className="bc-card bc-card-hover p-6">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
          <Store size={22} />
        </div>
        <h2 className="font-display text-2xl font-semibold text-bc-text">Marketplace</h2>
        <p className="mt-2 text-sm leading-6 text-bc-subtext">
          Manage listings and connect with people interested in your books.
        </p>
      </Link>
      <div className="bc-card border-dashed bg-transparent p-6 md:col-span-2">
        <div className="flex items-start gap-4">
          <BookOpen className="mt-1 h-5 w-5 text-bc-subtext" />
          <p className="text-sm leading-6 text-bc-subtext">
            Reader-only areas are hidden for this account. Switch to a reader and writer account if you want Library and Public Works access too.
          </p>
        </div>
      </div>
    </section>
  );
}
