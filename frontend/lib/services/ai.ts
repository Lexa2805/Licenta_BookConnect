// ─────────────────────────────────────────────────────────
// AI Service — OpenRouter + Pollinations.ai Integration
// ─────────────────────────────────────────────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ?? "";
const AI_MODEL = "google/gemini-2.5-flash";

// ── Types ────────────────────────────────────────────────

export interface BookmarkSuggestion {
  note: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
  reasoning: string;
}

export interface VibeCardResult {
  imageUrl: string;
  prompt: string;
  caption: string;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChoice {
  message: {
    content: string;
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

// ── Helpers ──────────────────────────────────────────────

async function callOpenRouter(messages: OpenRouterMessage[], temperature = 0.7): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured. Set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local");
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      "X-Title": "BookConnect",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as OpenRouterResponse;

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("Empty response from OpenRouter");
  }

  return data.choices[0].message.content;
}

/**
 * Parse a JSON block from an LLM response.
 * Handles responses wrapped in ```json ... ``` fences.
 */
function parseJsonFromLLM<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
  }
}

// ── Public API ───────────────────────────────────────────

/**
 * Magic Suggest — Analyze selected text and produce a smart
 * bookmark note + highlight color recommendation.
 */
export async function generateBookmarkSuggestion(
  selectedText: string,
  bookTitle: string,
  bookAuthor: string
): Promise<BookmarkSuggestion> {
  const systemPrompt = `You are a literary analysis assistant for a book-reading app called BookConnect.
When given a passage from a book, you produce:
1. A concise, insightful note (2-3 sentences) about the passage — highlighting theme, symbolism, character insight, or emotional resonance.
2. A highlight color choice based on the passage type:
   - "yellow" → Key quote, important fact, or memorable line
   - "green"  → Character development, dialogue, or growth moment
   - "blue"   → World-building, setting, or descriptive prose
   - "pink"   → Emotional, romantic, or heartfelt passage
   - "purple" → Philosophical, thematic, or thought-provoking idea

Respond ONLY with a JSON object in this exact format (no extra text):
{
  "note": "Your insightful note here...",
  "color": "yellow|green|blue|pink|purple",
  "reasoning": "Brief explanation of why you chose this color"
}`;

  const userPrompt = `Book: "${bookTitle}" by ${bookAuthor}

Selected passage:
"${selectedText}"

Analyze this passage and suggest a bookmark note and highlight color.`;

  const raw = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const result = parseJsonFromLLM<BookmarkSuggestion>(raw);

  // Validate color is one of the allowed values
  const validColors = ["yellow", "green", "blue", "pink", "purple"] as const;
  if (!validColors.includes(result.color)) {
    result.color = "yellow";
  }

  return result;
}

/**
 * Vibe Card — Generate a visual prompt describing the mood
 * of the selected text, then build a Pollinations.ai image URL.
 * Each call produces a unique style thanks to random art-direction hints.
 * The highlightColor influences the dominant color palette.
 */
export async function generateVibeCardPrompt(
  selectedText: string,
  bookTitle: string,
  bookAuthor: string,
  highlightColor: string = "yellow"
): Promise<VibeCardResult> {
  // Map highlight colors to mood/palette directions
  const colorMoods: Record<string, string> = {
    yellow: "warm golden tones, sunlit amber, honey hues, radiant warmth",
    green: "lush emerald greens, forest tones, natural earth palette, verdant life",
    blue: "deep ocean blues, twilight sky, cerulean and navy, cool serenity",
    pink: "soft rose pinks, blush tones, warm coral, romantic pastels",
    purple: "rich violet and amethyst, deep plum, mystical indigo, regal tones",
  };
  const colorMood = colorMoods[highlightColor] || colorMoods.yellow;

  // Random style hints to ensure each generation is unique
  const artStyles = [
    "oil painting with rich impasto texture",
    "soft watercolor with bleeding edges",
    "cinematic film still with dramatic lighting",
    "dreamy ethereal digital art with soft bokeh",
    "vintage 35mm film photograph",
    "Japanese ukiyo-e woodblock print style",
    "moody chiaroscuro like Caravaggio",
    "art nouveau poster with flowing organic lines",
    "surrealist scene inspired by Dalí",
    "minimalist geometric abstract composition",
    "impressionist landscape like Monet",
    "dark academia aesthetic with warm tones",
    "retro synthwave neon glow",
    "cozy cottagecore illustration",
    "gothic romantic painting with deep shadows",
    "Studio Ghibli anime concept art",
    "photorealistic macro detail shot",
    "expressionist bold brushstrokes",
  ];

  const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
  const randomSeed = Math.floor(Math.random() * 999999);

  const systemPrompt = `You are a visual art director for a book-reading social media app.
Given a book passage, you create:
1. An artistic image prompt (for an AI image generator) that captures the MOOD, ATMOSPHERE, and EMOTION of the passage. The prompt should describe a scene, color palette, and artistic style — NOT literal text or words. Keep it under 120 words. Use evocative, painterly language. IMPORTANT: Do NOT include any text, letters, words, or typography in the image.
2. A short social-media caption (1 line, under 15 words) that pairs with the image.

COLOR DIRECTION: The dominant palette MUST favor ${colorMood}. Weave these tones throughout the composition.
ART STYLE: You MUST use this art style: "${randomStyle}".
Be wildly creative and unique — never repeat the same composition, scene, or mood. Each generation must feel like a completely different artwork.

Respond ONLY with a JSON object:
{
  "prompt": "Your detailed visual art prompt...",
  "caption": "A short poetic caption for social media"
}`;

  const userPrompt = `Book: "${bookTitle}" by ${bookAuthor}

Passage:
"${selectedText}"

Create a unique, ${randomStyle}-inspired artwork in ${colorMood} palette for this passage. Unique generation #${randomSeed}`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.95
  );

  const parsed = parseJsonFromLLM<{ prompt: string; caption: string }>(raw);

  // Clean the prompt to prevent URL encoding issues and truncate to safely avoid 414 errors natively returned as gray placeholder images
  const cleanPrompt = parsed.prompt.replace(/[\r\n]+/g, " ").replace(/[^a-zA-Z0-9\s.,-]/g, "");
  const safePrompt = cleanPrompt.slice(0, 350);
  const uniquePrompt = `${safePrompt}, ${randomStyle}, hyper-detailed, high quality, seed ${Date.now()}`;
  const imageUrl = getPollinationsImageUrl(uniquePrompt);

  return {
    imageUrl,
    prompt: parsed.prompt,
    caption: parsed.caption,
  };
}

/**
 * Build a Pollinations.ai image URL from a text prompt.
 * Free, no API key required. Returns a 1080×1080 image.
 * Uses Date.now() + random seed to guarantee a unique image every single time.
 */
export function getPollinationsImageUrl(
  prompt: string,
  width = 1080,
  height = 1080
): string {
  const seed = Date.now();
  const nonce = Math.floor(Math.random() * 1_000_000);
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nonce=${nonce}&nologo=true`;
}
