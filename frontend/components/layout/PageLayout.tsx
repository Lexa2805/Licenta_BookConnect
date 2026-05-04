import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NavKey } from "@/lib/nav";

export interface PageLayoutProps {
  active: NavKey;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function PageLayout({
  active,
  pageTitle,
  pageSubtitle,
  headerActions,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-bc-bg text-bc-text">
      <Sidebar active={active} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1240px] w-full mx-auto">
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
          <div className="flex flex-col gap-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
