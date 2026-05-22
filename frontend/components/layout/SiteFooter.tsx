import Link from "next/link";
import type { ReactNode } from "react";
import {
  CircleHelp,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import { BookLogoMark } from "@/components/brand/BookLogoMark";

const aboutLinks = [
  { label: "About BookConnect", href: "/" },
  { label: "Library", href: "/library" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Community", href: "/community" },
];

const supportLinks = [
  { label: "Contact us", href: "mailto:support@bookconnect.local", Icon: Mail },
  { label: "Support center", href: "/settings", Icon: CircleHelp },
  { label: "Community help", href: "/community", Icon: MessageCircle },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com", Icon: Instagram },
  { label: "Twitter", href: "https://www.twitter.com", Icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com", Icon: Linkedin },
];

export function SiteFooter() {
  return (
    <footer className="overflow-hidden rounded-bc-3xl border border-bc-border bg-bc-surface shadow-bc-sm">
      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <BookLogoMark size="sm" />
            <div>
              <div className="font-display text-xl font-bold text-bc-text">BookConnect</div>
              <div className="text-xs text-bc-subtext">Read - Trade - Belong</div>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-6 text-bc-text-soft">
            A calm space to discover books, share public works, trade stories,
            and stay connected with readers and writers.
          </p>
        </div>

        <FooterColumn title="About Site">
          {aboutLinks.map((link) => (
            <FooterLink key={link.label} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact & Support">
          {supportLinks.map(({ label, href, Icon }) => (
            <FooterLink key={label} href={href} className="inline-flex items-center gap-2">
              <Icon size={14} />
              {label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Find Us Online">
          <p className="text-sm leading-6 text-bc-subtext">
            Follow BookConnect and stay close to new books, updates, and reader circles.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-bc-border bg-bc-surface-muted text-bc-text-soft transition hover:-translate-y-0.5 hover:border-bc-primary hover:text-bc-primary hover:shadow-bc-md"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
          <Link
            href="/notifications"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-bc-primary hover:text-bc-primary-hover"
          >
            <Send size={14} />
            Stay updated
          </Link>
        </FooterColumn>
      </div>

      <div className="border-t border-bc-border bg-bc-surface-muted px-6 py-4 text-center text-xs text-bc-subtext">
        (c) {new Date().getFullYear()} BookConnect. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-bc-text">{title}</h2>
      <div className="flex flex-col items-start gap-2">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = [
    "text-sm leading-6 text-bc-text-soft transition hover:text-bc-primary",
    className,
  ].join(" ");

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
