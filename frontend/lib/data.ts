/* Sample data — replace with your data layer (API, DB, etc.) */

export interface Book {
  id: string;
  title: string;
  author: string;
  gradient: string;
  badge?: string;
}

export interface ProgressBook extends Book {
  progress: number;
  pageLabel: string;
}

export interface LibraryBook extends Book {
  status: "Reading" | "Finished" | "Wishlist" | "On loan" | "On swap shelf";
  meta: string;
}

export interface MarketplaceBook extends Book {
  condition: "Like new" | "Very good" | "Good" | "Acceptable";
  price: string;
  swap?: boolean;
  city: string;
}

export const HERO_BOOKS: Book[] = [
  {
    id: "h1",
    title: "Norwegian Wood",
    author: "Murakami",
    gradient: "linear-gradient(135deg, #2A3B32, #4A5B42)",
  },
  {
    id: "h2",
    title: "Kafka on the Shore",
    author: "Murakami",
    gradient: "linear-gradient(135deg, #5C3A21, #8B5A33)",
  },
  {
    id: "h3",
    title: "1Q84",
    author: "Murakami",
    gradient: "linear-gradient(135deg, #1C2331, #3A4B62)",
  },
];

export const CONTINUE_READING: ProgressBook[] = [
  {
    id: "c1",
    title: "Pachinko",
    author: "Min Jin Lee",
    gradient: "linear-gradient(135deg, #7C2A31, #B24552)",
    progress: 48,
    pageLabel: "142 of 296",
  },
  {
    id: "c2",
    title: "The Overstory",
    author: "Richard Powers",
    gradient: "linear-gradient(135deg, #2D4C3B, #5A7B68)",
    progress: 82,
    pageLabel: "410 of 502",
  },
  {
    id: "c3",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    gradient: "linear-gradient(135deg, #A88B52, #D4B679)",
    progress: 15,
    pageLabel: "45 of 307",
  },
];

export const RECOMMENDED: Book[] = [
  { id: "r1", title: "Sea of Tranquility", author: "Emily St. John Mandel", gradient: "linear-gradient(135deg, #1E3B4D, #4A6B7C)", badge: "Trending" },
  { id: "r2", title: "Tomorrow x3", author: "Gabrielle Zevin", gradient: "linear-gradient(135deg, #D45B4B, #E68A7C)", badge: "New" },
  { id: "r3", title: "Trust", author: "Hernan Diaz", gradient: "linear-gradient(135deg, #3E4B3E, #6B7A6B)", badge: "Editor's pick" },
  { id: "r4", title: "Demon Copperhead", author: "Barbara Kingsolver", gradient: "linear-gradient(135deg, #9C5A33, #C88B62)", badge: "Free swap" },
  { id: "r5", title: "The Secret History", author: "Donna Tartt", gradient: "linear-gradient(135deg, #2B2C30, #5B5C62)" },
  { id: "r6", title: "Babel", author: "R. F. Kuang", gradient: "linear-gradient(135deg, #4B2A3B, #7A4A5C)", badge: "New" },
];

export const READING_CIRCLES = [
  { id: "g1", name: "Gothic Lit Lovers", members: "1.2k", date: "Tomorrow, 8PM", avatars: ["#A8581F", "#E8A9A9", "#8AA98F"] },
  { id: "g2", name: "Sci-Fi Saturdays", members: "840", date: "Saturday, 10AM", avatars: ["#8AA98F", "#A8B8C8", "#D67A3A"] },
  { id: "g3", name: "Contemporary Fiction", members: "3.4k", date: "Next week", avatars: ["#A8B8C8", "#A8581F", "#E8A9A9"] },
];

export const ACTIVITY = [
  { id: "a1", kind: "finished" as const, who: "Marta", what: "Demon Copperhead", time: "2 hours ago" },
  { id: "a2", kind: "thread" as const, who: "Gothic Lit Lovers", what: "started a new thread", time: "5 hours ago" },
  { id: "a3", kind: "listed" as const, who: "Asha", what: "The Idiot for swap", time: "Yesterday" },
  { id: "a4", kind: "wishlist" as const, who: "Theo", what: "added 3 books to wishlist", time: "2 days ago" },
];

export const LIBRARY: LibraryBook[] = [
  { id: "l1", title: "Trust", author: "Hernan Diaz", gradient: "linear-gradient(135deg, #1B2638, #3B4860)", status: "Reading", meta: "Page 142 / 296" },
  { id: "l2", title: "Demon Copperhead", author: "Barbara Kingsolver", gradient: "linear-gradient(135deg, #7C3F22, #B26845)", status: "Reading", meta: "Page 89 / 546" },
  { id: "l3", title: "Tomorrow, and Tomorrow", author: "Gabrielle Zevin", gradient: "linear-gradient(135deg, #1F4A3A, #3D7A60)", status: "Reading", meta: "Page 230 / 416" },
  { id: "l4", title: "The Bee Sting", author: "Paul Murray", gradient: "linear-gradient(135deg, #BA9747, #D4B679)", status: "Finished", meta: "Finished · 2 days ago" },
  { id: "l5", title: "North Woods", author: "Daniel Mason", gradient: "linear-gradient(135deg, #2D4C3B, #5A7B68)", status: "Wishlist", meta: "Wishlist · added Jul 2" },
  { id: "l6", title: "Birnam Wood", author: "Eleanor Catton", gradient: "linear-gradient(135deg, #5C3A21, #8B5A33)", status: "On loan", meta: "Loaned to Mira" },
  { id: "l7", title: "The Idiot", author: "Elif Batuman", gradient: "linear-gradient(135deg, #4B2A3B, #7A4A5C)", status: "On swap shelf", meta: "Listed for swap" },
  { id: "l8", title: "Open Throat", author: "Henry Hoke", gradient: "linear-gradient(135deg, #1C2331, #3A4B62)", status: "Reading", meta: "Page 38 / 168" },
];

export const MARKETPLACE: MarketplaceBook[] = [
  { id: "m1", title: "Lessons in Chemistry", author: "Bonnie Garmus", gradient: "linear-gradient(135deg, #BC4F3E, #E37A6A)", condition: "Like new", price: "$8", city: "Brooklyn", swap: true },
  { id: "m2", title: "Bunny", author: "Mona Awad", gradient: "linear-gradient(135deg, #4B2A3B, #7A4A5C)", condition: "Very good", price: "$6", city: "Queens" },
  { id: "m3", title: "The Vegetarian", author: "Han Kang", gradient: "linear-gradient(135deg, #2D4C3B, #5A7B68)", condition: "Good", price: "$5", city: "Manhattan", swap: true },
  { id: "m4", title: "Severance", author: "Ling Ma", gradient: "linear-gradient(135deg, #1C2331, #3A4B62)", condition: "Like new", price: "$7", city: "Brooklyn" },
  { id: "m5", title: "Real Life", author: "Brandon Taylor", gradient: "linear-gradient(135deg, #5C3A21, #8B5A33)", condition: "Very good", price: "$6", city: "Bronx" },
  { id: "m6", title: "If We Were Villains", author: "M. L. Rio", gradient: "linear-gradient(135deg, #2B2C30, #5B5C62)", condition: "Good", price: "$5", city: "Queens", swap: true },
  { id: "m7", title: "Piranesi", author: "Susanna Clarke", gradient: "linear-gradient(135deg, #1E3B4D, #4A6B7C)", condition: "Like new", price: "$9", city: "Manhattan" },
  { id: "m8", title: "Crying in H Mart", author: "Michelle Zauner", gradient: "linear-gradient(135deg, #7C2A31, #B24552)", condition: "Acceptable", price: "$4", city: "Brooklyn", swap: true },
];

export const STUDIO_KPIS = [
  { id: "k1", label: "Total earnings", value: "$1,284.50", trend: "+12.4% MoM", trendKind: "success" as const },
  { id: "k2", label: "Active listings", value: "18", trend: "2 added this week", trendKind: "muted" as const },
  { id: "k3", label: "Pending swaps", value: "5", trend: "3 require action", trendKind: "warning" as const },
  { id: "k4", label: "Avg rating", value: "4.8", trend: "Based on 42 reviews", trendKind: "muted" as const },
];

export const COMMUNITY_THREADS = [
  { id: "t1", circle: "Gothic Lit Lovers", title: "Is Mexican Gothic actually scary, or just atmospheric?", author: "Mira", replies: 24, time: "1h ago" },
  { id: "t2", circle: "Sci-Fi Saturdays", title: "Hyperion Cantos — start with book 1 or skip ahead?", author: "Jonas", replies: 12, time: "3h ago" },
  { id: "t3", circle: "Contemporary Fiction", title: "Quiet recommendation: A Little Life is heavier than I expected", author: "Asha", replies: 38, time: "Yesterday" },
  { id: "t4", circle: "Slow Reads", title: "Reading one chapter of Middlemarch a day — anyone joining?", author: "Theo", replies: 9, time: "2d ago" },
];

export const PROFILE_STATS = [
  { id: "p1", label: "Books this year", value: "34" },
  { id: "p2", label: "Pages read", value: "11,402" },
  { id: "p3", label: "Swaps completed", value: "16" },
  { id: "p4", label: "Reviews written", value: "21" },
];
