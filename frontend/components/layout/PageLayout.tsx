"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NAV_ITEMS, type NavKey } from "@/lib/nav";
import { getDefaultPathForRole, hasCapability } from "@/lib/roles";

export interface PageLayoutProps {
  active: NavKey;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: ReactNode;
  showPageHeader?: boolean;
  children: ReactNode;
}

export function PageLayout({
  active,
  pageTitle,
  pageSubtitle,
  headerActions,
  showPageHeader = true,
  children,
}: PageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const activeItem = NAV_ITEMS.find((item) => item.key === active);
  const canAccessActiveArea = hasCapability(
    session?.user?.role,
    activeItem?.requiredCapability,
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = pathname && pathname !== "/" ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${callbackUrl}`);
    }
  }, [pathname, router, status]);

  useEffect(() => {
    if (status === "authenticated" && !canAccessActiveArea) {
      router.replace(getDefaultPathForRole(session?.user?.role));
    }
  }, [canAccessActiveArea, router, session?.user?.role, status]);

  if (status === "loading" || status === "unauthenticated" || !canAccessActiveArea) {
    return (
      <main className="min-h-screen bg-bc-bg text-bc-text grid place-items-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-bc-primary border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-bc-subtext">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-bc-bg text-bc-text">
      <Sidebar active={active} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1240px] w-full mx-auto">
          {showPageHeader && (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-[32px] sm:text-[40px] font-semibold text-bc-text leading-tight tracking-tight">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="text-bc-subtext text-[15px] mt-2 max-w-xl">
                    {pageSubtitle}
                  </p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2 flex-wrap">
                  {headerActions}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
