"use client";

import { useMemo } from "react";
import { BookOpen, Loader2, Mail, UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { userService } from "@/lib/services/users";
import { getRoleLabel, normalizeRole } from "@/lib/roles";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });

  const initials = useMemo(() => {
    const value = profile?.username || profile?.email || "BC";
    return value.slice(0, 2).toUpperCase();
  }, [profile?.email, profile?.username]);

  return (
    <PageLayout
      active="profile"
      pageTitle="Profile"
      pageSubtitle="A BookConnect member profile."
      headerActions={
        <Button variant="secondary" onClick={() => router.push("/community")}>
          Back to community
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isError || !profile ? (
        <div className="bc-card grid place-items-center p-12 text-center">
          <UserRound className="mb-3 h-9 w-9 text-bc-subtext" />
          <h2 className="font-display text-2xl font-semibold text-bc-text">Profile not found</h2>
          <p className="mt-2 text-sm text-bc-subtext">This user may no longer be available.</p>
        </div>
      ) : (
        <section className="bc-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-bc-primary-grad font-display text-4xl font-semibold text-white shadow-bc-primary">
              {profile.profile?.avatar_url ? (
                <img src={profile.profile.avatar_url} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold leading-tight text-bc-text">
                {profile.username}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-bc-subtext">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} />
                  {profile.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {getRoleLabel(normalizeRole(profile.role))}
                </span>
              </div>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-bc-text-soft">
                {profile.profile?.about || "This member has not added a description yet."}
              </p>
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}
