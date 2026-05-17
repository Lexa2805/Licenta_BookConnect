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
import type { RoleCapability } from "@/lib/roles";

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
  requiredCapability?: RoleCapability;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/", Icon: Home },
  { key: "library", label: "Library", href: "/library", Icon: BookOpen, requiredCapability: "read" },
  { key: "manuscripts", label: "Works", href: "/manuscripts", Icon: FileText, requiredCapability: "read" },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", Icon: Store },
  { key: "studio", label: "Studio", href: "/studio", Icon: LayoutGrid, requiredCapability: "write" },
  { key: "community", label: "Community", href: "/community", Icon: Users, requiredCapability: "read" },
  { key: "profile", label: "Profile", href: "/profile", Icon: User },
];
