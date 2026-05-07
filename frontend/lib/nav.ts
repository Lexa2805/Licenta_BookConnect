import {
  Home,
  BookOpen,
  FileText,
  Store,
  LayoutGrid,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "home"
  | "library"
  | "manuscripts"
  | "marketplace"
  | "studio"
  | "community"
  | "profile";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/", Icon: Home },
  { key: "library", label: "Library", href: "/library", Icon: BookOpen },
  { key: "manuscripts", label: "Works", href: "/manuscripts", Icon: FileText },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", Icon: Store },
  { key: "studio", label: "Studio", href: "/studio", Icon: LayoutGrid },
  { key: "community", label: "Community", href: "/community", Icon: Users },
  { key: "profile", label: "Profile", href: "/profile", Icon: User },
];
