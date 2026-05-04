"use client";

import { useState } from "react";
import { DollarSign, Package, RefreshCw, Star, Plus, Book, FileText, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

export default function StudioPage() {
  const [range, setRange] = useState("30d");
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id as string | undefined;

  const { data: manuscripts = [], isLoading: loadingManuscripts } = useQuery({
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
  const activeListings = myListings.filter((l: any) => l.status === "AVAILABLE" || l.status === "available").length;
  
  const loading = loadingManuscripts || loadingListings;

  return (
    <PageLayout
      active="studio"
      pageTitle="Studio"
      pageSubtitle="Manage your listings, swaps, earnings, and self-published works."
      headerActions={
        <>
          <Button variant="secondary" onClick={() => router.push("/marketplace/create")}>New Listing</Button>
          <Button leftIcon={<Plus size={15} />} onClick={() => router.push("/studio/editor/new")}>New release</Button>
        </>
      }
    >
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
              manuscripts.slice(0, 4).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-4 px-5 hover:bg-bc-surface-muted transition-colors cursor-pointer" onClick={() => router.push(`/studio/editor/${m.id}`)}>
                  <div>
                    <div className="text-[14px] font-semibold text-bc-text">{m.title}</div>
                    <div className="text-[12.5px] text-bc-subtext flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${m.status === 'PUBLISHED' ? 'bg-bc-success' : 'bg-bc-warning'}`}></span>
                      {m.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12.5px] text-bc-subtext">Updated {new Date(m.updated_at).toLocaleDateString()}</div>
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
                    <div className="text-[12.5px] text-bc-subtext">${l.price} • {l.condition}</div>
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
