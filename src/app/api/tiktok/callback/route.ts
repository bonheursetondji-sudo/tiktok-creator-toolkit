import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchUserInfo } from "@/lib/tiktok";
import { unsign } from "@/lib/session";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { OAUTH_STATE_COOKIE } from "../authorize/route";

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL("/connexion-tiktok", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tiktokError = searchParams.get("error");
  if (tiktokError) {
    return redirectWithError(request, `TikTok a refusé la connexion : ${tiktokError}`);
  }

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  if (!code || !returnedState) {
    return redirectWithError(request, "Réponse TikTok incomplète (code ou state manquant).");
  }

  const cookieValue = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const unsigned = cookieValue ? await unsign(cookieValue) : null;
  if (!unsigned) {
    return redirectWithError(request, "Session OAuth expirée, réessayez la connexion.");
  }

  let saved: { state: string; verifier: string; userId: number };
  try {
    saved = JSON.parse(unsigned);
  } catch {
    return redirectWithError(request, "Cookie OAuth invalide, réessayez la connexion.");
  }

  if (saved.state !== returnedState) {
    return redirectWithError(request, "Paramètre state invalide (protection anti-CSRF).");
  }

  // Toujours connecté, et toujours la même personne qui a démarré le flux
  // (défense en profondeur, en plus de la vérification du state).
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== saved.userId) {
    return redirectWithError(request, "Session expirée pendant la connexion, réessayez.");
  }

  try {
    const token = await exchangeCodeForToken(code, saved.verifier);
    const userInfo = await fetchUserInfo(token.access_token);

    // Ce compte TikTok est-il déjà rattaché à un autre utilisateur de
    // l'outil ? (tiktokUserId est unique en base — deux personnes ne
    // peuvent pas connecter le même compte TikTok).
    const existingForOtherUser = await prisma.profil.findUnique({
      where: { tiktokUserId: token.open_id },
    });
    if (existingForOtherUser && existingForOtherUser.userId !== currentUser.id) {
      return redirectWithError(
        request,
        "Ce compte TikTok est déjà connecté à un autre utilisateur de l'outil."
      );
    }

    const data = {
      displayName: userInfo.display_name ?? null,
      followerCount: userInfo.follower_count ?? null,
      accessTokenEnc: encrypt(token.access_token),
      refreshTokenEnc: encrypt(token.refresh_token),
      tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      lastSyncAt: new Date(),
    };

    await prisma.profil.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id, tiktokUserId: token.open_id, ...data },
      update: { tiktokUserId: token.open_id, ...data },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la connexion TikTok.";
    return redirectWithError(request, message);
  }

  const response = NextResponse.redirect(new URL("/connexion-tiktok?connected=1", request.url));
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
