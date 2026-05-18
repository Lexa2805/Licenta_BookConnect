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
  fallbackImageUrl?: string;
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

type OpenRouterMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: OpenRouterMessageContent;
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
  const fallback = createFallbackCoverResult(title, genre, description, visualDirection, uniqueSeed);

  if (!OPENROUTER_API_KEY) {
    return fallback;
  }

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

  let parsed: {
    prompt: string;
    tagline: string;
    palette: string[];
  };

  try {
    const raw = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      0.92,
    );

    parsed = parseJsonFromLLM<{
      prompt: string;
      tagline: string;
      palette: string[];
    }>(raw);
  } catch {
    return fallback;
  }
  const safePrompt = parsed.prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[^a-zA-Z0-9\s.,:;'"()-]/g, "")
    .slice(0, 520);
  const prompt = `${safePrompt}, premium book cover illustration, no text, no typography, no logo, centered composition, print-ready, cinematic lighting, high detail`;

  const palette = Array.isArray(parsed.palette) ? parsed.palette.slice(0, 5) : [];

  return {
    imageUrl: getPollinationsImageUrl(prompt, 768, 1152, uniqueSeed),
    fallbackImageUrl: createCoverDataUrl(title, parsed.tagline, palette, parsed.prompt, uniqueSeed),
    prompt: parsed.prompt,
    tagline: parsed.tagline,
    palette,
  };
}

function createFallbackCoverResult(
  title: string,
  genre: string,
  description: string,
  visualDirection: string,
  seed: number,
): CustomCoverResult {
  const source = `${title} ${genre} ${description} ${visualDirection}`.toLowerCase();
  const palette = source.match(/romance|love|heart/)
    ? ["#8f2f56", "#f0a6b4", "#f7d6a7", "#263238"]
    : source.match(/fantasy|magic|kingdom|dragon/)
      ? ["#263a73", "#7b5cc9", "#d7b56d", "#14213d"]
      : source.match(/thriller|crime|murder|mystery|dark/)
        ? ["#111827", "#7f1d1d", "#d6a84f", "#6b7280"]
        : source.match(/sci|space|future|alien/)
          ? ["#0f172a", "#0ea5e9", "#a3e635", "#e2e8f0"]
          : ["#1f4a3a", "#c46a2b", "#f2c078", "#234f68"];
  const subject = description
    .replace(/[\r\n]+/g, " ")
    .replace(/[^a-zA-Z0-9\s.,:;'"()-]/g, "")
    .split(/\s+/)
    .slice(0, 42)
    .join(" ");
  const prompt = [
    genre ? `${genre} book cover illustration` : "literary book cover illustration",
    title ? `inspired by a manuscript titled ${title}` : "for an untitled manuscript",
    subject ? `story mood and symbols: ${subject}` : "evocative symbolic composition",
    visualDirection || "cinematic lighting, clear focal subject, layered background",
    `palette ${palette.join(", ")}`,
    "no text, no typography, no logo, print-ready, high detail",
  ].join(", ");

  const tagline = title ? `A cover concept for ${title}` : "A cover concept for your manuscript";
  const imageUrl = createCoverDataUrl(title, tagline, palette, prompt, seed);

  return {
    imageUrl,
    fallbackImageUrl: imageUrl,
    prompt,
    tagline,
    palette,
  };
}

function createCoverDataUrl(
  title: string,
  tagline: string,
  palette: string[],
  prompt: string,
  seed: number,
) {
  const colors = normalizePalette(palette);
  const titleLines = wrapSvgText(title || "Untitled Manuscript", 18, 3);
  const taglineLines = wrapSvgText(tagline || "A generated cover concept", 28, 2);
  const promptWords = prompt
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 8);
  const hash = Math.abs(seed || hashString(`${title}${tagline}${prompt}`));
  const offsetA = 80 + (hash % 120);
  const offsetB = 360 + (hash % 180);

  const titleMarkup = titleLines
    .map((line, index) => `<tspan x="70" y="${152 + index * 42}">${escapeXml(line)}</tspan>`)
    .join("");
  const taglineMarkup = taglineLines
    .map((line, index) => `<tspan x="70" y="${690 + index * 24}">${escapeXml(line)}</tspan>`)
    .join("");
  const keywordMarkup = promptWords
    .map((word, index) => {
      const x = 74 + (index % 2) * 190;
      const y = 470 + Math.floor(index / 2) * 42;
      return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff" opacity="0.78">${escapeXml(word.toUpperCase())}</text>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1152" viewBox="0 0 768 1152">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors[0]}"/>
    <stop offset="0.55" stop-color="${colors[1]}"/>
    <stop offset="1" stop-color="${colors[2]}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="35%" r="65%">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
    <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.16"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000000" flood-opacity="0.28"/>
  </filter>
</defs>
<rect width="768" height="1152" fill="url(#bg)"/>
<rect width="768" height="1152" fill="url(#glow)"/>
<path d="M0 ${offsetA} C170 ${offsetA + 70} 230 ${offsetA - 80} 410 ${offsetA + 12} S650 ${offsetA + 105} 768 ${offsetA + 22} V0 H0Z" fill="#ffffff" opacity="0.18"/>
<path d="M0 ${offsetB} C190 ${offsetB - 80} 300 ${offsetB + 90} 520 ${offsetB} S690 ${offsetB - 70} 768 ${offsetB + 20}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.34"/>
<g opacity="0.24">
  <path d="M96 320 H672 M96 384 H672 M96 448 H672 M96 512 H672 M96 576 H672 M96 640 H672" stroke="#ffffff" stroke-width="1"/>
  <path d="M160 266 V696 M256 266 V696 M352 266 V696 M448 266 V696 M544 266 V696 M640 266 V696" stroke="#ffffff" stroke-width="1"/>
</g>
<g filter="url(#shadow)">
  <rect x="88" y="286" width="592" height="360" rx="38" fill="#ffffff" opacity="0.16"/>
  <circle cx="384" cy="466" r="122" fill="${colors[3]}" opacity="0.46"/>
  <circle cx="384" cy="466" r="84" fill="#ffffff" opacity="0.8"/>
  <circle cx="384" cy="466" r="46" fill="${colors[0]}" opacity="0.9"/>
  <path d="M234 530 C308 442 458 442 534 530" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" opacity="0.68"/>
  <path d="M244 408 C316 494 454 494 526 408" fill="none" stroke="${colors[2]}" stroke-width="16" stroke-linecap="round" opacity="0.7"/>
</g>
<text x="70" y="94" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#ffffff" opacity="0.76">BOOKCONNECT GENERATED COVER</text>
<text font-family="Georgia, serif" font-size="38" font-weight="700" fill="#ffffff">${titleMarkup}</text>
${keywordMarkup}
<rect x="70" y="794" width="180" height="4" rx="2" fill="#ffffff" opacity="0.82"/>
<text font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff" opacity="0.88">${taglineMarkup}</text>
<circle cx="592" cy="866" r="22" fill="${colors[0]}"/>
<circle cx="642" cy="866" r="22" fill="${colors[1]}"/>
<circle cx="692" cy="866" r="22" fill="${colors[2]}"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function normalizePalette(palette: string[]) {
  const valid = (Array.isArray(palette) ? palette : [])
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .slice(0, 4);
  return [...valid, "#0f172a", "#38546b", "#ffffff", "#c46a2b"].slice(0, 4);
}

function wrapSvgText(value: string, maxChars: number, maxLines: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  const limited = lines.slice(0, maxLines);
  if (lines.length > maxLines && limited.length > 0) {
    limited[limited.length - 1] = `${limited[limited.length - 1].replace(/\.*$/, "")}...`;
  }

  return limited.length ? limited : ["Untitled"];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
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

export async function findMovieMatchesFromImage(
  imageUrl: string,
  title: string = "",
  genre: string = "",
): Promise<MovieMatchResult> {
  const systemPrompt = `You are a film comparison assistant for readers.
Given an image of a book cover, page, or synopsis, first infer any readable title, author, genre clues, and visible text. Then recommend real movies that share tone, themes, setting, character dynamics, or story signals.

Important:
- Do not claim the book is copied from a movie.
- Do not invent movies. Recommend real, known films only.
- If the image has little readable story information, say the matches are tentative.
- Return only JSON in this exact shape:
{
  "summary": "Brief comparison summary that mentions what you could infer from the image",
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

  const raw = await callOpenRouter(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Book/manuscript title hint: ${title || "Unknown"}
Genre hint: ${genre || "Unknown"}

Scan this image and find 5 movie matches.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    0.45,
  );

  const parsed = parseJsonFromLLM<MovieMatchResult>(raw);
  const movies = Array.isArray(parsed.movies) ? parsed.movies : [];

  return {
    summary: parsed.summary || "Movie matches generated from the uploaded image.",
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
