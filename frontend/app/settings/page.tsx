"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, LogOut, Moon, Sparkles, Upload, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { userService } from "@/lib/services/users";
import { normalizeRole } from "@/lib/roles";

const AVATAR_STYLES = [
  {
    label: "Warm reader",
    bg: ["#F2C078", "#C46A2B"],
    skin: "#8F5132",
    hair: "#2F241D",
    shirt: "#1F4A3A",
    accent: "#F7E4C2",
    accessory: "book",
  },
  {
    label: "Blue glasses",
    bg: ["#8BB7C9", "#234F68"],
    skin: "#C98F67",
    hair: "#473223",
    shirt: "#F4D6A0",
    accent: "#17384C",
    accessory: "glasses",
  },
  {
    label: "Rose writer",
    bg: ["#E8A9A9", "#7A3F4F"],
    skin: "#A8654A",
    hair: "#211B24",
    shirt: "#3D355F",
    accent: "#F4D6A0",
    accessory: "pen",
  },
  {
    label: "Green scarf",
    bg: ["#77A3A3", "#2F4D5C"],
    skin: "#D2A077",
    hair: "#5C3520",
    shirt: "#F7E4C2",
    accent: "#1F4A3A",
    accessory: "scarf",
  },
  {
    label: "Gold reader",
    bg: ["#D2A85F", "#8A5A24"],
    skin: "#6F3E2F",
    hair: "#1E1714",
    shirt: "#6B2F35",
    accent: "#FFF1CF",
    accessory: "book",
  },
  {
    label: "Purple notes",
    bg: ["#8D7AB8", "#3D355F"],
    skin: "#B87A56",
    hair: "#322234",
    shirt: "#F4D6A0",
    accent: "#FFFFFF",
    accessory: "stars",
  },
  {
    label: "Classic scholar",
    bg: ["#C66F58", "#6B2F35"],
    skin: "#E1B083",
    hair: "#6B4228",
    shirt: "#234F68",
    accent: "#F7E4C2",
    accessory: "glasses",
  },
  {
    label: "Quiet pages",
    bg: ["#A8B8C8", "#2D4C3B"],
    skin: "#9C6042",
    hair: "#26211D",
    shirt: "#BA9747",
    accent: "#FFFFFF",
    accessory: "pages",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { data: session, update } = useSession();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [message, setMessage] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: userService.getMe,
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || "");
    setEmail(profile.email || "");
    setAbout(profile.profile?.about || "");
    setAvatarUrl(profile.profile?.avatar_url || "");
  }, [profile]);

  const initials = useMemo(() => getInitials(username || email || "BC"), [username, email]);
  const generatedAvatars = useMemo(
    () =>
      AVATAR_STYLES.map((style, index) => ({
        label: style.label,
        url: createGeneratedAvatar(initials, style, index),
      })),
    [initials],
  );

  useEffect(() => {
    if (!avatarFile) {
      setFilePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const previewUrl = filePreviewUrl || avatarUrl;

  const mutation = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      data.append("username", username);
      data.append("email", email);
      data.append("about", about);
      data.append("avatar_url", avatarUrl);
      if (avatarFile) data.append("avatar", avatarFile);
      return userService.updateMe(data);
    },
    onSuccess: async (updated) => {
      setAvatarFile(null);
      setAvatarUrl(updated.profile?.avatar_url || "");
      setMessage("Profile updated.");
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
      setMessage(error instanceof Error ? error.message : "Could not update profile.");
    },
  });

  function handleAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl("");
    setMessage("");
  }

  function chooseGeneratedAvatar(nextUrl: string) {
    setAvatarFile(null);
    setAvatarUrl(nextUrl);
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    mutation.mutate();
  }

  return (
    <PageLayout
      active="profile"
      pageTitle="Edit profile"
      pageSubtitle="Choose how your BookConnect profile appears to other readers and writers."
      headerActions={
        <Button variant="secondary" onClick={() => router.push("/profile")}>
          View profile
        </Button>
      }
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
        <form onSubmit={handleSubmit} className="bc-card p-6 space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarPreview src={previewUrl} initials={initials} />
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<Upload size={14} />}
                  onClick={() => fileRef.current?.click()}
                >
                  Upload avatar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  leftIcon={<Sparkles size={14} />}
                  onClick={() => chooseGeneratedAvatar(generatedAvatars[0].url)}
                >
                  Create one
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {generatedAvatars.map((avatar) => (
                  <button
                    key={avatar.label}
                    type="button"
                    onClick={() => chooseGeneratedAvatar(avatar.url)}
                    className={[
                      "relative aspect-square overflow-hidden rounded-full border transition hover:-translate-y-0.5",
                      avatarUrl === avatar.url && !avatarFile
                        ? "border-bc-primary ring-2 ring-bc-primary/20"
                        : "border-bc-border",
                    ].join(" ")}
                    aria-label={`Choose ${avatar.label} avatar`}
                    title={avatar.label}
                  >
                    <img src={avatar.url} alt="" className="h-full w-full object-cover" />
                    {avatarUrl === avatar.url && !avatarFile && (
                      <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-bc-primary text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-bc-text">Username</span>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-bc-text">Email</span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-bc-text">About me</span>
            <textarea
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              maxLength={260}
              placeholder="A short note about what you read, write, or love."
              className="h-32 w-full resize-none rounded-bc-md border border-bc-border bg-bc-surface px-4 py-3 text-sm leading-6 text-bc-text shadow-bc-xs outline-none transition placeholder:text-bc-subtext focus:border-bc-primary"
            />
            <span className="mt-1 block text-right text-xs text-bc-subtext">{about.length}/260</span>
          </label>

          {message && (
            <div className="rounded-bc-md border border-bc-border bg-bc-surface-muted px-3 py-2 text-sm text-bc-text-soft">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={mutation.isPending || isLoading}
              leftIcon={mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <User size={14} />}
            >
              {mutation.isPending ? "Saving..." : "Save profile"}
            </Button>
            {session?.user ? (
              <Button
                type="button"
                variant="ghost"
                leftIcon={<LogOut size={15} />}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-5">
          <div className="bc-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-bc-md bg-bc-primary-soft text-bc-primary">
                <ImagePlus size={17} />
              </span>
              <div>
                <h2 className="text-base font-bold text-bc-text">Public preview</h2>
                <p className="text-[13px] text-bc-subtext">This is visible on your profile.</p>
              </div>
            </div>
            <div className="rounded-bc-lg border border-bc-border bg-bc-surface-muted p-4">
              <div className="flex items-center gap-3">
                <AvatarPreview src={previewUrl} initials={initials} compact />
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-semibold text-bc-text">
                    {username || "Your username"}
                  </div>
                  <div className="truncate text-xs text-bc-subtext">{email || "email@example.com"}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-bc-text-soft">
                {about || "Your short description will appear here."}
              </p>
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
        </div>
      </section>
    </PageLayout>
  );
}

function AvatarPreview({
  src,
  initials,
  compact = false,
}: {
  src?: string;
  initials: string;
  compact?: boolean;
}) {
  const size = compact ? "h-16 w-16 text-xl" : "h-28 w-28 text-3xl";
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-bc-primary-grad font-display font-semibold text-white shadow-bc-primary ${size}`}>
      {src ? <img src={src} alt="Profile avatar" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const source = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : value.slice(0, 2);
  return source.toUpperCase() || "BC";
}

function createGeneratedAvatar(
  initials: string,
  style: (typeof AVATAR_STYLES)[number],
  index: number,
) {
  const [from, to] = style.bg;
  const sideHair =
    index % 3 === 0
      ? `<path d="M76 111 C62 72 83 39 126 39 C167 39 192 68 180 113 C172 88 157 74 128 74 C98 74 83 88 76 111Z" fill="${style.hair}"/>`
      : index % 3 === 1
        ? `<path d="M71 129 C60 91 67 53 105 42 C134 32 170 43 184 75 C197 104 184 136 176 153 C170 104 156 75 127 75 C99 75 83 96 71 129Z" fill="${style.hair}"/>`
        : `<path d="M80 100 C81 62 101 40 132 40 C163 40 184 62 185 100 C168 84 152 76 128 76 C105 76 91 84 80 100Z" fill="${style.hair}"/>`;
  const accessory =
    style.accessory === "glasses"
      ? `<circle cx="109" cy="116" r="13" fill="none" stroke="${style.accent}" stroke-width="5"/><circle cx="147" cy="116" r="13" fill="none" stroke="${style.accent}" stroke-width="5"/><path d="M122 116 H134" stroke="${style.accent}" stroke-width="4" stroke-linecap="round"/>`
      : style.accessory === "book"
        ? `<g transform="translate(158 164) rotate(-10)"><rect x="0" y="0" width="42" height="34" rx="4" fill="${style.accent}"/><path d="M21 3 V32" stroke="${to}" stroke-width="2"/><path d="M7 10 H17 M26 10 H36 M7 17 H17 M26 17 H35" stroke="${to}" stroke-width="2" stroke-linecap="round"/></g>`
        : style.accessory === "pen"
          ? `<g transform="translate(166 160) rotate(35)"><rect x="0" y="0" width="8" height="48" rx="4" fill="${style.accent}"/><path d="M0 42 L4 56 L8 42Z" fill="${style.hair}"/></g>`
          : style.accessory === "scarf"
            ? `<path d="M91 164 C112 179 145 179 166 164 L174 199 C143 219 112 219 82 199Z" fill="${style.accent}" opacity="0.95"/>`
            : style.accessory === "stars"
              ? `<path d="M55 74 L61 86 L74 88 L64 97 L67 110 L55 103 L43 110 L46 97 L36 88 L49 86Z" fill="${style.accent}" opacity="0.9"/><path d="M190 52 L194 61 L204 62 L197 69 L199 79 L190 74 L181 79 L183 69 L176 62 L186 61Z" fill="${style.accent}" opacity="0.8"/>`
              : `<path d="M163 163 C179 157 195 158 207 168 L207 204 C192 194 178 191 163 197Z" fill="${style.accent}" opacity="0.9"/><path d="M163 163 V197" stroke="${to}" stroke-width="2"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="256" height="256" rx="128" fill="url(#g)"/>
<circle cx="${54 + index * 10}" cy="56" r="42" fill="${style.accent}" opacity="0.18"/>
<circle cx="${198 - index * 6}" cy="201" r="62" fill="#fff" opacity="0.12"/>
<path d="M50 218 C68 174 96 153 128 153 C160 153 188 174 206 218Z" fill="${style.shirt}"/>
<path d="M105 151 H151 V178 C139 187 117 187 105 178Z" fill="${style.skin}"/>
${sideHair}
<circle cx="128" cy="112" r="49" fill="${style.skin}"/>
<path d="M82 107 C95 69 153 58 181 102 C160 95 142 84 126 68 C115 86 96 99 82 107Z" fill="${style.hair}"/>
<circle cx="110" cy="118" r="5" fill="#241B18"/>
<circle cx="146" cy="118" r="5" fill="#241B18"/>
<path d="M116 141 C124 148 137 148 145 141" fill="none" stroke="#241B18" stroke-width="5" stroke-linecap="round"/>
${accessory}
<circle cx="128" cy="217" r="24" fill="#fff" opacity="0.16"/>
<text x="128" y="226" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="700" fill="white">${initials}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
