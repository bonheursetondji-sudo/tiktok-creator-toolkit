import crypto from "node:crypto";

/**
 * Connexion TikTok (section 4.1) — Login Kit (OAuth 2.0 + PKCE) et Display
 * API. Les noms d'endpoints et de champs ci-dessous correspondent à la
 * documentation TikTok "for Developers" au moment de la rédaction de ce
 * squelette ; TikTok fait évoluer ses scopes et ses champs disponibles,
 * donc vérifiez https://developers.tiktok.com/doc/login-kit-web avant la
 * mise en production, en particulier :
 *  - les scopes réellement accordés à votre app dépendent de sa
 *    validation ("App Review") sur le portail développeur ;
 *  - le champ "type de compte personnel/business" n'est pas garanti par
 *    l'API Display publique — gardez la saisie manuelle en repli (déjà
 *    prévue dans le cahier des charges, section 4.3).
 */

const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

export const TIKTOK_SCOPES = ["user.info.profile", "user.info.stats", "video.list"];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant dans .env — voir .env.example.`);
  return value;
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Génère la paire PKCE (code_verifier / code_challenge S256) requise par TikTok. */
export function generatePkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateState(): string {
  return base64url(crypto.randomBytes(16));
}

export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const clientKey = requireEnv("TIKTOK_CLIENT_KEY");
  const redirectUri = requireEnv("TIKTOK_REDIRECT_URI");
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_SCOPES.join(","),
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // secondes
  open_id: string;
  scope: string;
  token_type: string;
}

async function postForm(url: string, body: URLSearchParams): Promise<TikTokTokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Requête TikTok échouée (${res.status}) : ${text}`);
  }
  return res.json();
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: requireEnv("TIKTOK_REDIRECT_URI"),
    code_verifier: codeVerifier,
  });
  return postForm(TOKEN_URL, body);
}

export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postForm(TOKEN_URL, body);
}

export interface TikTokUserInfo {
  open_id: string;
  display_name?: string;
  follower_count?: number;
}

export async function fetchUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const fields = ["open_id", "display_name", "follower_count"].join(",");
  const res = await fetch(`${USERINFO_URL}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec de récupération du profil TikTok (${res.status}) : ${text}`);
  }
  const data = await res.json();
  return data?.data?.user ?? {};
}

export interface TikTokVideo {
  id: string;
  title?: string;
  duration?: number; // secondes
  view_count?: number;
  create_time?: number; // timestamp unix
}

export async function fetchVideoList(
  accessToken: string,
  cursor = 0
): Promise<{ videos: TikTokVideo[]; hasMore: boolean; nextCursor: number }> {
  const fields = ["id", "title", "duration", "view_count", "create_time"].join(",");
  const res = await fetch(`${VIDEO_LIST_URL}?fields=${fields}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: 20, cursor }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec de récupération des vidéos TikTok (${res.status}) : ${text}`);
  }
  const data = await res.json();
  return {
    videos: data?.data?.videos ?? [],
    hasMore: Boolean(data?.data?.has_more),
    nextCursor: data?.data?.cursor ?? 0,
  };
}
