import {
  Home,
  BookOpen,
  Store,
  PenSquare,
  LayoutGrid,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "home"
  | "library"
  | "marketplace"
  | "create"
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
  { key: "marketplace", label: "Marketplace", href: "/marketplace", Icon: Store },
  { key: "create", label: "Create", href: "/create", Icon: PenSquare },
  { key: "studio", label: "Studio", href: "/studio", Icon: LayoutGrid },
  { key: "community", label: "Community", href: "/community", Icon: Users },
  { key: "profile", label: "Profile", href: "/profile", Icon: User },
];
