"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { userService } from "@/lib/services/users";
import {
  getRoleLabel,
  normalizeRole,
  SELECTABLE_ACCOUNT_ROLES,
  type SelectableAccountRole,
} from "@/lib/roles";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();
  const [role, setRole] = useState<SelectableAccountRole>("reader");
  const [message, setMessage] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    const nextRole = normalizeRole(profile.role);
    setRole(nextRole === "admin" ? "reader" : nextRole);
  }, [profile]);

  const username =
    profile?.username || session?.user?.username || session?.user?.email?.split("@")[0] || "";
  const email = profile?.email || session?.user?.email || "";
  const avatarUrl = profile?.profile?.avatar_url || "";
  const currentRole = normalizeRole(profile?.role || session?.user?.role);
  const initials = useMemo(() => getInitials(username || email || "BC"), [username, email]);
  const hasRoleChange = role !== currentRole && currentRole !== "admin";

  const roleMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile is still loading.");

      const data = new FormData();
      data.append("username", profile.username);
      data.append("email", profile.email);
      data.append("about", profile.profile?.about || "");
      data.append("role", role);
      data.append("avatar_url", profile.profile?.avatar_url || "");

      return userService.updateMe(data);
    },
    onSuccess: async (updated) => {
      setMessage("Account type updated.");
      queryClient.setQueryData(["me"], updated);
      await update({
        user: {
          username: updated.username,
          email: updated.email,
          role: normalizeRole(updated.role),
        },
      });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Could not update account type.");
    },
  });

  return (
    <PageLayout
      active="settings"
      pageTitle="Settings"
      pageSubtitle="Control how BookConnect looks and how your account behaves."
      headerActions={
        <Button variant="secondary" onClick={() => router.push("/profile")}>
          View profile
        </Button>
      }
    >
      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="bc-card p-6">
            <SettingHeading
              icon={<Moon size={18} />}
              title="Appearance"
              description="Choose the theme you want to use across the app."
            />
            <div className="mt-5">
              <ThemeToggle />
            </div>
          </div>

          <div className="bc-card p-6">
            <SettingHeading
              icon={<ShieldCheck size={18} />}
              title="Security and session"
              description="Password recovery and sign-out actions for this account."
            />
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<KeyRound size={15} />}
                onClick={() => router.push("/reset-password")}
              >
                Reset password
              </Button>
              <Button
                type="button"
                variant="ghost"
                leftIcon={<LogOut size={15} />}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bc-card p-6">
            <SettingHeading
              icon={<User size={18} />}
              title="Account"
              description="Your signed-in account and public identity."
            />
            <div className="mt-5 rounded-bc-lg border border-bc-border bg-bc-surface-muted p-4">
              <div className="flex items-center gap-3">
                <AvatarPreview src={avatarUrl} initials={initials} />
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-semibold text-bc-text">
                    {username || "Your username"}
                  </div>
                  <div className="truncate text-xs text-bc-subtext">{email || "No email"}</div>
                  <div className="mt-1 text-xs font-semibold text-bc-primary">
                    {getRoleLabel(currentRole)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bc-card p-6">
            <SettingHeading
              icon={<Check size={18} />}
              title="Account type"
              description="Choose which parts of BookConnect should be available to you."
            />

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {SELECTABLE_ACCOUNT_ROLES.map((option) => {
                const selected = role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setRole(option);
                      setMessage("");
                    }}
                    className={[
                      "rounded-bc-md border px-3 py-3 text-left text-sm transition",
                      selected
                        ? "border-bc-primary bg-bc-primary-soft text-bc-primary shadow-bc-xs"
                        : "border-bc-border bg-bc-surface text-bc-text-soft hover:border-bc-primary hover:text-bc-text",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <span className="block font-bold">{getRoleLabel(option)}</span>
                    <span className="mt-1 block text-xs text-bc-subtext">
                      {option === "reader"
                        ? "Read books and public works."
                        : option === "writer"
                          ? "Write and manage manuscripts."
                          : "Read, write, and sell books."}
                    </span>
                  </button>
                );
              })}
            </div>

            {message && (
              <div className="mt-4 rounded-bc-md border border-bc-border bg-bc-surface-muted px-3 py-2 text-sm text-bc-text-soft">
                {message}
              </div>
            )}

            <div className="mt-5">
              <Button
                type="button"
                disabled={!hasRoleChange || roleMutation.isPending || isLoading}
                leftIcon={
                  roleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check size={14} />
                  )
                }
                onClick={() => roleMutation.mutate()}
              >
                {roleMutation.isPending ? "Saving..." : "Save account type"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function SettingHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-bold text-bc-text">{title}</h2>
        <p className="mt-1 text-[13px] text-bc-subtext">{description}</p>
      </div>
    </div>
  );
}

function AvatarPreview({ src, initials }: { src?: string; initials: string }) {
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-bc-primary-grad font-display text-xl font-semibold text-white shadow-bc-primary">
      {src ? <img src={src} alt="Profile avatar" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const source = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : value.slice(0, 2);
  return source.toUpperCase() || "BC";
}
