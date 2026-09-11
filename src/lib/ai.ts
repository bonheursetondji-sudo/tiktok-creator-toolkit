/**
 * Génération d'idées de contenu par IA (section 4.2). La clé API reste
 * strictement côté serveur — ce module n'est jamais importé côté client.
 *
 * AI_PROVIDER="anthropic" (défaut) ou "openai" — au choix, comme prévu
 * dans le cahier des charges. Le modèle est configurable via
 * ANTHROPIC_MODEL / OPENAI_MODEL car ces identifiants évoluent ; vérifiez
 * les valeurs courantes sur https://docs.claude.com/en/docs/about-claude/models
 * ou https://platform.openai.com/docs/models avant de déployer.
 *
 * Gemini (Google AI Studio) fonctionne aussi, via sa couche de
 * compatibilité OpenAI : AI_PROVIDER="openai", OPENAI_API_KEY=<clé Gemini>,
 * OPENAI_MODEL="gemini-3.8-flash" (ou autre modèle Gemini), et
 * OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions".
 * Voir https://ai.google.dev/gemini-api/docs/openai pour les détails.
 */

export interface IdeeGeneree {
  accroche: string;
  angle: string;
  format: string;
  dureeSuggeree: string;
}

const SYSTEM_PROMPT = `Tu es un assistant de brainstorming pour un créateur de contenu TikTok.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après, sans balises markdown.
Chaque élément du tableau doit avoir exactement ces clés : "accroche" (string, les 3 premières secondes),
"angle" (string, l'angle éditorial), "format" (string, ex. "talking head", "voix off + b-roll", "tutoriel rapide"),
"dureeSuggeree" (string, ex. "15-30s").`;

function buildUserPrompt(niche: string, nombreIdees: number): string {
  return `Niche du créateur : "${niche}".
Génère ${nombreIdees} idées de vidéos TikTok distinctes et concrètes pour cette niche, adaptées au format court.
Réponds uniquement avec le tableau JSON.`;
}

function extractJsonArray(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Réessaie automatiquement en cas de surcharge temporaire du fournisseur
 * (503 "UNAVAILABLE" / 429 "rate limited") — fréquent sur les niveaux
 * gratuits d'API, et transitoire par nature. 2 tentatives supplémentaires
 * avec un court délai croissant avant d'abandonner.
 */
async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  let lastResponse: Response;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResponse = await fetch(url, init);
    if (lastResponse.status !== 503 && lastResponse.status !== 429) return lastResponse;
    if (attempt < maxRetries) await sleep(1000 * (attempt + 1));
  }
  return lastResponse!;
}

async function generateWithAnthropic(niche: string, nombreIdees: number): Promise<IdeeGeneree[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquant dans .env.");
  const model = (process.env.ANTHROPIC_MODEL || "claude-sonnet-5").trim();

  const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(niche, nombreIdees) }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API Anthropic (${res.status}) : ${text}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((block: { type: string }) => block.type === "text");
  if (!textBlock) throw new Error("Réponse Anthropic sans contenu texte.");
  return extractJsonArray(textBlock.text) as IdeeGeneree[];
}

async function generateWithOpenAI(niche: string, nombreIdees: number): Promise<IdeeGeneree[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY manquant dans .env.");
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  // Permet de pointer vers n'importe quel endpoint compatible OpenAI (ex.
  // Gemini : https://generativelanguage.googleapis.com/v1beta/openai/chat/completions)
  // sans dupliquer cette fonction — seule la clé, le modèle et cette URL changent.
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions").trim();

  const res = await fetchWithRetry(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(niche, nombreIdees) },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const provider = baseUrl.includes("googleapis.com") ? "Gemini" : "OpenAI";
    throw new Error(`Erreur API ${provider} (${res.status}) : ${text}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse OpenAI sans contenu texte.");
  return extractJsonArray(text) as IdeeGeneree[];
}

export async function generateIdeas(niche: string, nombreIdees = 9): Promise<IdeeGeneree[]> {
  const provider = (process.env.AI_PROVIDER || "anthropic").trim().toLowerCase();
  if (provider === "openai") return generateWithOpenAI(niche, nombreIdees);
  return generateWithAnthropic(niche, nombreIdees);
}