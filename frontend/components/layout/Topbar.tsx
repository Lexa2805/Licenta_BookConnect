"use client";

import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Input } from "../ui/Input";
import { ThemeToggle } from "../theme/ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { canReadLibrary } from "@/lib/roles";

export function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const username =
    session?.user?.username || session?.user?.email?.split("@")[0] || "BookConnect";
  const initials = username.substring(0, 2).toUpperCase();
  const searchLibrary = canReadLibrary(session?.user?.role);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();

    if (query) {
      router.push(
        searchLibrary
          ? `/library?search=${encodeURIComponent(query)}`
          : `/marketplace?search=${encodeURIComponent(query)}`,
      );
    } else {
      router.push(searchLibrary ? "/library" : "/marketplace");
    }
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bc-bg/80 border-b border-bc-border">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-[68px]">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
          <Input
            inputSize="sm"
            placeholder={searchLibrary ? "Search books, authors, members..." : "Search listings, authors, members..."}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={15} />}
            rightSlot={
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10.5px] font-semibold text-bc-subtext bg-bc-surface-muted border border-bc-border">
                ⌘K
              </kbd>
            }
          />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => router.push("/notifications")}
            className="relative grid place-items-center w-10 h-10 rounded-bc-md bg-bc-surface border border-bc-border text-bc-text-soft hover:text-bc-primary hover:border-bc-primary/40 hover:-translate-y-0.5 hover:shadow-bc-md transition-all duration-300 ease-bc-ease"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-bc-primary" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => router.push("/settings")}
            className="grid place-items-center w-10 h-10 rounded-bc-md bg-bc-surface border border-bc-border text-bc-text-soft hover:text-bc-primary hover:border-bc-primary/40 hover:-translate-y-0.5 hover:shadow-bc-md transition-all duration-300 ease-bc-ease"
          >
            <Settings size={16} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-bc-primary-grad text-white grid place-items-center font-semibold text-[13px] shadow-bc-primary hover:scale-105 transition-transform"
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-bc-surface border border-bc-border rounded-bc-md shadow-bc-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-bc-border">
                  <p className="text-sm font-semibold text-bc-text truncate">{username}</p>
                  <p className="text-xs text-bc-subtext truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text"
                >
                  View profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-bc-text-soft hover:bg-bc-surface-muted hover:text-bc-text"
                >
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full text-left px-4 py-2 text-sm text-bc-danger hover:bg-bc-surface-muted flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
