import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, generatePkcePair, generateState } from "@/lib/tiktok";
import { sign } from "@/lib/session";

export const OAUTH_STATE_COOKIE = "tct_oauth_state";

export async function GET(request: NextRequest) {
  let authorizeUrl: string;
  let state: string;
  let verifier: string;

  try {
    state = generateState();
    const pkce = generatePkcePair();
    verifier = pkce.verifier;
    authorizeUrl = buildAuthorizeUrl(state, pkce.challenge);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de configuration TikTok.";
    const url = new URL("/connexion-tiktok", request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }

  const cookieValue = await sign(JSON.stringify({ state, verifier }));
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes — le temps de l'aller-retour OAuth
  });
  return response;
}
