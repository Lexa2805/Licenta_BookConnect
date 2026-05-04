"use client";

import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Input } from "../ui/Input";
import { ThemeToggle } from "../theme/ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const username = session?.user?.username || "Guest";
  const initials = username.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bc-bg/80 border-b border-bc-border">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-[68px]">
        <div className="flex-1 max-w-xl">
          <Input
            inputSize="sm"
            placeholder="Search books, authors, members..."
            leftIcon={<Search size={15} />}
            rightSlot={
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10.5px] font-semibold text-bc-subtext bg-bc-surface-muted border border-bc-border">
                ⌘K
              </kbd>
            }
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid place-items-center w-10 h-10 rounded-bc-md bg-bc-surface border border-bc-border text-bc-text-soft hover:text-bc-primary hover:border-bc-primary/40 hover:-translate-y-0.5 hover:shadow-bc-md transition-all duration-300 ease-bc-ease"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-bc-primary" />
          </button>
          <button
            type="button"
            aria-label="Settings"
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
