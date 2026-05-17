"use client";

import { useState } from "react";
import { ArrowRight, MapPin, Repeat, Search, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BookCover } from "@/components/books/BookCover";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/lib/services/marketplace";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const FILTERS = ["All", "Wishlist", "Swap-friendly", "Under 10 Lei", "Like new", "Near me"];

export default function MarketplacePage() {
  const [filter, setFilter] = useState("All");
  const router = useRouter();
  const { data: session } = useSession();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: () => marketplaceService.getListings(),
  });

  const { data: wishlist = [], isLoading: loadingWishlist } = useQuery({
    queryKey: ["marketplace-wishlist", session?.user?.id],
    queryFn: () => marketplaceService.getWishlist(session!.user.id as string),
    enabled: !!session?.user?.id && filter === "Wishlist",
  });

  const getGradientSeed = (id: string | number) => {
    if (typeof id === "number") return id;
    return String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  };

  const getGradientForBook = (id: string | number) => {
    const gradients = [
      "linear-gradient(135deg, #1E3B4D, #4A6B7C)",
      "linear-gradient(135deg, #D45B4B, #E68A7C)",
      "linear-gradient(135deg, #3E4B3E, #6B7A6B)",
      "linear-gradient(135deg, #9C5A33, #C88B62)",
      "linear-gradient(135deg, #2B2C30, #5B5C62)",
      "linear-gradient(135deg, #4B2A3B, #7A4A5C)",
    ];
    return gradients[getGradientSeed(id) % gradients.length];
  };

  const sourceListings = filter === "Wishlist" ? wishlist : listings;
  const filteredListings = sourceListings.filter((book) => {
    if (filter === "All") return true;
    if (filter === "Wishlist") return true;
    if (filter === "Under 10 Lei") return parseFloat(book.price) < 10;
    if (filter === "Like new") return book.condition.toLowerCase().includes("like new");
    if (filter === "Swap-friendly") return parseFloat(book.price) === 0; // Assuming 0 price means swap
    return true; // "Near me" logic would require geolocation, show all for now
  });

  return (
    <PageLayout
      active="marketplace"
      pageTitle="Marketplace"
      pageSubtitle="Swap, sell, and find your next read from neighbors near you."
      headerActions={<Button onClick={() => router.push("/marketplace/create")}>List a book</Button>}
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
        <Input
          placeholder="Search by title, author, or ISBN..."
          leftIcon={<Search size={16} />}
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Pill key={f} active={f === filter} onClick={() => setFilter(f)}>
              {f}
            </Pill>
          ))}
        </div>
      </div>

      {isLoading || loadingWishlist ? (
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="grid place-items-center py-20 text-bc-subtext">
          <p>{filter === "Wishlist" ? "No marketplace books in your wishlist yet." : "No listings found matching your criteria."}</p>
        </div>
      ) : (
        <div className="bc-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredListings.map((book) => (
            <article
              key={book.id}
              className="bc-card bc-card-hover overflow-hidden flex flex-col"
              style={{ padding: 0 }}
            >
              <div className="p-5 pb-3 grid place-items-center bg-bc-surface-muted">
                <BookCover
                  title={book.title}
                  author={book.author}
                  gradient={book.image_url ? undefined : getGradientForBook(book.id)}
                  coverUrl={book.image_url || undefined}
                  width={130}
                  height={195}
                />
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-semibold text-bc-text leading-tight truncate">
                      {book.title}
                    </h4>
                    <p className="text-[12px] text-bc-subtext truncate">
                      {book.author}
                    </p>
                  </div>
                  <span className="font-display text-[18px] font-semibold text-bc-text shrink-0">
                    {book.price} Lei
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{book.condition}</Badge>
                  {parseFloat(book.price) === 0 && (
                    <Badge variant="soft">
                      <Repeat size={10} />
                      Swap OK
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-bc-border">
                  <span className="inline-flex items-center gap-1 text-[12px] text-bc-subtext">
                    <MapPin size={12} /> {book.seller_name}
                  </span>
                  <button 
                    onClick={() => router.push(`/marketplace/${book.id}`)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-bc-primary hover:gap-2 transition-all"
                  >
                    View <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
