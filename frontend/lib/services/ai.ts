const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ?? "";
const AI_MODEL = "google/gemini-2.5-flash";

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

export interface CustomCoverResult {
  imageUrl: string;
  prompt: string;
  tagline: string;
  palette: string[];
}

export interface MovieMatch {
  title: string;
  year?: string;
  match_score: number;
  reason: string;
  shared_elements: string[];
}

export interface MovieMatchResult {
  summary: string;
  movies: MovieMatch[];
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

function generateUniqueSeed(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] ^ Date.now()) >>> 0;
}

async function callOpenRouter(
  messages: OpenRouterMessage[],
  temperature = 0.7,
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is not configured. Set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local",
    );
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      "X-Title": "BookConnect",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature,
      max_tokens: 2048,
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

function parseJsonFromLLM<T>(raw: string): T {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").trim();
  }

  const tryParse = (value: string): T | null => {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  let result = tryParse(cleaned);
  if (result) {
    return result;
  }

  result = tryParse(`${cleaned}}`);
  if (result) {
    return result;
  }

  result = tryParse(`${cleaned}"}`);
  if (result) {
    return result;
  }

  throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`);
}

export async function generateBookmarkSuggestion(
  selectedText: string,
  bookTitle: string,
  bookAuthor: string,
  pageContext: string = "",
  pageNumber?: number,
): Promise<BookmarkSuggestion> {
  const systemPrompt = `You are a literary analysis assistant for a book-reading app called BookConnect.
When given a selected passage and optional surrounding page text from the real book page, you produce:
1. A concise, insightful note (2-3 sentences) about the passage, highlighting theme, symbolism, character insight, or emotional resonance.
2. A highlight color choice based on the passage type:
   - "yellow" -> Key quote, important fact, or memorable line
   - "green"  -> Character development, dialogue, or growth moment
   - "blue"   -> World-building, setting, or descriptive prose
   - "pink"   -> Emotional, romantic, or heartfelt passage
   - "purple" -> Philosophical, thematic, or thought-provoking idea

Be honest and grounded. Use only the selected passage and page context provided.
Do not invent plot, character relationships, or themes that are not supported by the text.
If the selected passage is short or ambiguous, say that the suggestion is based on limited context and choose the safest color.

Respond only with a JSON object in this exact format:
{
  "note": "Your insightful note here...",
  "color": "yellow|green|blue|pink|purple",
  "reasoning": "Brief explanation of why you chose this color"
}`;

  const pageContextBlock = pageContext
    ? `Page ${pageNumber ?? "current"} context:
"${pageContext.slice(0, 5000)}"`
    : "Page context was not available from the PDF text layer.";

  const userPrompt = `Book: "${bookTitle}" by ${bookAuthor}
${pageNumber ? `Page: ${pageNumber}` : ""}

Selected passage:
"${selectedText}"

${pageContextBlock}

Analyze the selected passage using the page context. Return an honest bookmark note, color, and reasoning.`;

  const raw = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const result = parseJsonFromLLM<BookmarkSuggestion>(raw);
  const validColors = ["yellow", "green", "blue", "pink", "purple"] as const;
  if (!validColors.includes(result.color)) {
    result.color = "yellow";
  }

  return result;
}

export async function generateVibeCardPrompt(
  selectedText: string,
  bookTitle: string,
  bookAuthor: string,
  highlightColor: string = "yellow",
  emoji: string = "",
  variationHint: string = "",
): Promise<VibeCardResult> {
  const uniqueSeed = generateUniqueSeed();

  const colorMoods: Record<string, string> = {
    yellow: "warm golden tones, sunlit amber, honey hues, radiant warmth, with teal and rose accents",
    green: "lush emerald greens, forest tones, natural earth palette, verdant life, with coral and gold accents",
    blue: "deep ocean blues, twilight sky, cerulean and navy, cool serenity, with saffron and magenta accents",
    pink: "soft rose pinks, blush tones, warm coral, romantic pastels, with sage and sky blue accents",
    purple: "rich violet and amethyst, deep plum, mystical indigo, regal tones, with gold and turquoise accents",
  };
  const colorMood = colorMoods[highlightColor] || colorMoods.yellow;

  const emojiMoods: Record<string, string> = {
    "\u{1F4D6}": "an open ancient book in a cozy reading nook",
    "\u{1F4A1}": "a glowing lightbulb moment, eureka inspiration",
    "\u{2764}\u{FE0F}": "deep passionate love, red hearts, warmth",
    "\u{1F525}": "blazing fire, intense flames, burning passion",
    "\u{1F622}": "melancholy rain, tears, bittersweet sadness",
    "\u{1F60D}": "overwhelming admiration, starry eyes, romance",
    "\u{1F914}": "contemplative thinker, mystery, philosophical depth",
    "\u{2B50}": "a brilliant star in the night sky, celestial glow",
    "\u{2728}": "sparkling magic dust, enchantment, wonder",
    "\u{1F339}": "a single red rose, romance, beauty in thorns",
    "\u{1F319}": "a luminous crescent moon, nighttime serenity",
    "\u{2600}\u{FE0F}": "radiant sunrise, golden dawn light",
    "\u{1F98B}": "a delicate butterfly in flight, metamorphosis",
    "\u{1F3AD}": "theatrical drama masks, duality, performance",
    "\u{1F48E}": "a shimmering diamond, crystalline beauty, luxury",
    "\u{1F5E1}\u{FE0F}": "a gleaming sword, battle-ready, conflict",
    "\u{1F3F0}": "a majestic castle on a hilltop, grandeur",
    "\u{1F30A}": "powerful ocean waves crashing, the sea",
    "\u{1F342}": "falling autumn leaves, seasonal change, nostalgia",
    "\u{1F338}": "cherry blossoms in spring breeze, fleeting beauty",
    "\u{1F3B5}": "musical notes floating in air, melody, harmony",
    "\u{1F480}": "a skull, mortality, dark gothic atmosphere",
    "\u{1F451}": "a royal golden crown, majesty, power",
    "\u{1F54A}\u{FE0F}": "a white dove in flight, peace, freedom",
    "\u{1F4AB}": "swirling cosmic stardust, dizzying wonder",
    "\u{1FAF6}": "heart-shaped hands, tenderness, affection",
    "\u{1F608}": "devilish mischief, dark temptation, danger",
  };
  const emojiHint = emoji && emojiMoods[emoji] ? emojiMoods[emoji] : "";
  const emojiDirection = emojiHint
    ? `\nEMOJI MOOD: The user selected the ${emoji} emoji. Strongly incorporate this mood into the scene: "${emojiHint}".`
    : "";

  const artStyles = [
    "oil painting with rich impasto texture",
    "soft watercolor with bleeding edges",
    "cinematic film still with dramatic lighting",
    "dreamy ethereal digital art with soft bokeh",
    "vintage 35mm film photograph",
    "Japanese ukiyo-e woodblock print style",
    "moody chiaroscuro like Caravaggio",
    "art nouveau poster with flowing organic lines",
    "surrealist scene inspired by Salvador Dali",
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
  const compositionDirections = [
    "a dramatic close-up with tactile details and expressive light",
    "a wide cinematic scene with strong foreground and deep background layers",
    "an atmospheric portrait-like composition with one clear focal subject",
    "a dreamlike collage composition with floating symbolic objects",
    "a moody interior scene with glowing practical lights and shadow play",
    "a windswept outdoor scene with motion, weather, and rich texture",
    "a minimalist composition with bold negative space and one striking motif",
    "a lush ornamental scene with layered flora, fabric, and architectural forms",
  ];

  const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
  const compositionDirection =
    compositionDirections[Math.floor(Math.random() * compositionDirections.length)];
  const variationDirection = variationHint
    ? `\nVISUAL PRESENTATION: The social card will use this presentation style: "${variationHint}". Build the image to feel at home in that style.`
    : "";

  const systemPrompt = `You are a visual art director for a book-reading social media app.
Given a book passage, you create:
1. An artistic image prompt for an AI image generator that captures the mood, atmosphere, and emotion of the passage. The prompt should describe a vivid, colorful scene, rich color palette, and artistic style, not literal text or typography. Keep it under 120 words.
2. A short social-media caption, 1 line, under 15 words.

COLOR DIRECTION: The dominant palette must favor ${colorMood}.
BACKGROUND DIRECTION: Avoid plain black, gray, or empty backgrounds. Use layered color, visible scenery, luminous atmosphere, and at least three distinct accent colors.
ART STYLE: You must use this art style: "${randomStyle}".
COMPOSITION: You must use this composition direction: "${compositionDirection}".${emojiDirection}${variationDirection}
Each generation must feel like a completely different artwork.
Unique generation seed: ${uniqueSeed}. Use this seed to vary your creative choices.

Respond only with a JSON object:
{
  "prompt": "Your detailed visual art prompt...",
  "caption": "A short poetic caption for social media"
}`;

  const emojiUserHint = emoji ? ` Mood emoji: ${emoji}.` : "";
  const variationUserHint = variationHint ? ` Card presentation: ${variationHint}.` : "";
  const userPrompt = `Book: "${bookTitle}" by ${bookAuthor}

Passage:
"${selectedText}"

Create a unique, ${randomStyle}-inspired artwork in ${colorMood} palette for this passage. Composition direction: ${compositionDirection}.${emojiUserHint}${variationUserHint} Unique generation #${uniqueSeed}`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.97,
  );

  const parsed = parseJsonFromLLM<{ prompt: string; caption: string }>(raw);
  const cleanPrompt = parsed.prompt.replace(/[\r\n]+/g, " ").replace(/[^a-zA-Z0-9\s.,-]/g, "");
  const safePrompt = cleanPrompt.slice(0, 350);
  const emojiImageHint = emojiHint ? `, ${emojiHint}` : "";
  const variationImageHint = variationHint ? `, ${variationHint}` : "";
  const uniquePrompt = `${safePrompt}, ${randomStyle}, ${compositionDirection}${emojiImageHint}${variationImageHint}, vibrant colorful background, layered luminous atmosphere, rich saturated color palette, visible scenery, cinematic color contrast, hyper-detailed, high quality`;
  const imageUrl = getPollinationsImageUrl(uniquePrompt, 1080, 1080, uniqueSeed);

  return {
    imageUrl,
    prompt: parsed.prompt,
    caption: parsed.caption,
  };
}

export async function generateCustomCover(
  title: string,
  genre: string,
  description: string,
  visualDirection: string = "",
): Promise<CustomCoverResult> {
  const uniqueSeed = generateUniqueSeed();
  const systemPrompt = `You are a senior book cover art director for independent writers.
Create a professional custom book cover concept from the writer's title, genre, and synopsis.

Rules:
- The image prompt must describe cover art only. Do not ask the image model to render readable text, typography, author names, or title lettering.
- Make the concept specific to the story instead of generic stock imagery.
- Use a clear focal subject, background, color palette, lighting, and style.
- Avoid copyrighted characters, logos, celebrity likenesses, and existing franchise styles.
- Return only JSON in this exact shape:
{
  "prompt": "AI image prompt under 140 words",
  "tagline": "Short marketing tagline under 14 words",
  "palette": ["#123456", "#abcdef", "#789abc"]
}`;

  const userPrompt = `Title: ${title || "Untitled manuscript"}
Genre: ${genre || "Unknown"}
Synopsis or excerpt:
${description.slice(0, 7000)}

Writer visual direction:
${visualDirection || "No extra direction provided."}

Create a distinctive cover concept. Unique generation seed: ${uniqueSeed}.`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.92,
  );

  const parsed = parseJsonFromLLM<{
    prompt: string;
    tagline: string;
    palette: string[];
  }>(raw);
  const safePrompt = parsed.prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[^a-zA-Z0-9\s.,:;'"()-]/g, "")
    .slice(0, 520);
  const prompt = `${safePrompt}, premium book cover illustration, no text, no typography, no logo, centered composition, print-ready, cinematic lighting, high detail`;

  return {
    imageUrl: getPollinationsImageUrl(prompt, 768, 1152, uniqueSeed),
    prompt: parsed.prompt,
    tagline: parsed.tagline,
    palette: Array.isArray(parsed.palette) ? parsed.palette.slice(0, 5) : [],
  };
}

export async function findMovieMatches(
  title: string,
  bookText: string,
  genre: string = "",
): Promise<MovieMatchResult> {
  const systemPrompt = `You are a film comparison assistant for writers.
Given a manuscript excerpt, synopsis, or full pasted text, recommend real movies that share tone, themes, structure, character dynamics, or setting.

Important:
- Do not claim the manuscript is copied from a movie.
- Do not invent movies. Recommend real, known films only.
- Prefer useful creative comparisons over shallow genre matches.
- If the text is too short, say the matches are tentative.
- Return only JSON in this exact shape:
{
  "summary": "Brief comparison summary",
  "movies": [
    {
      "title": "Movie title",
      "year": "YYYY",
      "match_score": 0-100,
      "reason": "Why this movie matches",
      "shared_elements": ["element", "element", "element"]
    }
  ]
}`;

  const userPrompt = `Book/manuscript title: ${title || "Untitled"}
Genre: ${genre || "Unknown"}
Text to scan:
${bookText.slice(0, 10000)}

Find 5 movie matches for this work.`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    0.45,
  );

  const parsed = parseJsonFromLLM<MovieMatchResult>(raw);
  const movies = Array.isArray(parsed.movies) ? parsed.movies : [];

  return {
    summary: parsed.summary || "Movie matches generated from the supplied text.",
    movies: movies.slice(0, 5).map((movie) => ({
      title: movie.title,
      year: movie.year,
      match_score: Math.max(0, Math.min(100, Number(movie.match_score) || 0)),
      reason: movie.reason,
      shared_elements: Array.isArray(movie.shared_elements)
        ? movie.shared_elements.slice(0, 4)
        : [],
    })),
  };
}

export function getPollinationsImageUrl(
  prompt: string,
  width = 1080,
  height = 1080,
  seed?: number,
): string {
  const finalSeed = seed ?? generateUniqueSeed();
  const nonce = generateUniqueSeed();
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${finalSeed}&nonce=${nonce}&nologo=true&enhance=true`;
}
