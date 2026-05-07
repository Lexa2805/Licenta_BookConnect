"use client";

import { LogOut, Moon, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <PageLayout
      active="profile"
      pageTitle="Settings"
      pageSubtitle="Account shortcuts and display preferences."
      headerActions={
        <Button variant="secondary" onClick={() => router.push("/profile")}>
          View profile
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="bc-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
              <User size={17} />
            </span>
            <div>
              <h2 className="text-base font-bold text-bc-text">Account</h2>
              <p className="text-[13px] text-bc-subtext">
                {session?.user?.email || "You are browsing as a guest."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push("/profile")}>
              Open profile
            </Button>
            {session?.user ? (
              <Button
                variant="ghost"
                leftIcon={<LogOut size={15} />}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            ) : (
              <Button onClick={() => router.push("/login")}>Log in</Button>
            )}
          </div>
        </div>

        <div className="bc-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
              <Moon size={17} />
            </span>
            <div>
              <h2 className="text-base font-bold text-bc-text">Appearance</h2>
              <p className="text-[13px] text-bc-subtext">Switch between light and dark mode.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </PageLayout>
  );
}
