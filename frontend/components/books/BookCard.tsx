import { BookCover } from "./BookCover";
import { Badge } from "../ui/Badge";
import Link from "next/link";
import { Heart } from "lucide-react";

export interface BookCardProps {
  title: string;
  author: string;
  gradient?: string;
  coverUrl?: string;
  badge?: string;
  meta?: string;
  className?: string;
  href?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

export function BookCard({
  title,
  author,
  gradient,
  coverUrl,
  badge,
  meta,
  className = "",
  href,
  isWishlisted,
  onToggleWishlist,
}: BookCardProps) {
  const content = (
    <div
      className={[
        "group relative cursor-pointer transition-transform duration-300 ease-bc-ease h-full",
        className,
      ].join(" ")}
    >
      {badge && (
        <div className="absolute top-2 left-2 z-10">
          <Badge
            variant={
              badge === "New" || badge === "Editor's pick" ? "primary" : "default"
            }
          >
            {badge}
          </Badge>
        </div>
      )}

      {onToggleWishlist && (
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist();
          }}
          className={[
            "absolute top-2 right-2 z-10 grid place-items-center w-9 h-9 rounded-full border border-bc-border",
            "bg-bc-surface/80 backdrop-blur transition-colors",
            isWishlisted
              ? "text-bc-danger hover:bg-bc-surface"
              : "text-bc-subtext hover:text-bc-text hover:bg-bc-surface",
          ].join(" ")}
        >
          <Heart
            size={16}
            className="transition-transform group-hover:scale-105"
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
      )}
      <div className="grid place-items-center transition-transform duration-300 ease-bc-ease group-hover:-translate-y-1.5 group-hover:-rotate-1">
        <BookCover
          title={title}
          author={author}
          gradient={gradient}
          coverUrl={coverUrl}
          width="min(100%, 168px)"
          height={235}
        />
      </div>
      <div className="pt-3 px-1">
        <div className="text-[13px] font-semibold text-bc-text leading-tight mb-0.5 line-clamp-2">
          {title}
        </div>
        <div className="text-[11.5px] text-bc-subtext truncate mt-1">{author}</div>
        {meta && (
          <div className="text-[11px] text-bc-subtext mt-1.5">{meta}</div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
