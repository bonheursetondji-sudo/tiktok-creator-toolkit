import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { fetchUserInfo, fetchVideoList, refreshAccessToken } from "@/lib/tiktok";
import { computeMonetization } from "@/lib/monetization";

/**
 * Logique de synchro partagée entre :
 *  - POST : déclenché manuellement par le bouton "Rafraîchir maintenant"
 *    (protégé par le cookie de session via le middleware) ;
 *  - GET  : déclenché par le Cron Job Vercel quotidien (protégé par
 *    CRON_SECRET, voir middleware.ts et vercel.json).
 */
async function runSync() {
  const profil = await prisma.profil.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!profil || !profil.accessTokenEnc || !profil.refreshTokenEnc) {
    return { status: 400 as const, body: { error: "Aucun compte TikTok connecté." } };
  }

  let accessToken = decrypt(profil.accessTokenEnc);

  const expiresSoon =
    !profil.tokenExpiresAt || profil.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (expiresSoon) {
    const refreshToken = decrypt(profil.refreshTokenEnc);
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.access_token;
    await prisma.profil.update({
      where: { id: profil.id },
      data: {
        accessTokenEnc: encrypt(refreshed.access_token),
        refreshTokenEnc: encrypt(refreshed.refresh_token),
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
  }

  const [userInfo, videoPage] = await Promise.all([
    fetchUserInfo(accessToken),
    fetchVideoList(accessToken),
  ]);

  await prisma.profil.update({
    where: { id: profil.id },
    data: {
      displayName: userInfo.display_name ?? profil.displayName,
      followerCount: userInfo.follower_count ?? profil.followerCount,
      lastSyncAt: new Date(),
    },
  });

  for (const v of videoPage.videos) {
    const existing = await prisma.video.findUnique({ where: { tiktokVideoId: v.id } });
    const dureeSecondes = v.duration ?? existing?.dureeSecondes ?? null;

    const verdict = computeMonetization({
      dureeSecondes,
      contenuOriginal: existing?.contenuOriginal ?? false,
      pasDuoOuStitch: existing?.pasDuoOuStitch ?? false,
      pasModePhoto: existing?.pasModePhoto ?? false,
      pasContenuSponsorise: existing?.pasContenuSponsorise ?? false,
      conformeReglesEtDroits: existing?.conformeReglesEtDroits ?? false,
    });

    const data = {
      titre: v.title ?? existing?.titre ?? null,
      dureeSecondes,
      vues: v.view_count ?? existing?.vues ?? null,
      datePublication: v.create_time ? new Date(v.create_time * 1000) : existing?.datePublication ?? null,
      eligible: verdict.eligible,
      raisonsBlocage: JSON.stringify(verdict.raisonsBlocage),
      profilId: profil.id,
    };

    if (existing) {
      await prisma.video.update({ where: { id: existing.id }, data });
    } else {
      await prisma.video.create({ data: { tiktokVideoId: v.id, ...data } });
    }
  }

  return { status: 200 as const, body: { ok: true, videosSynced: videoPage.videos.length } };
}

async function handleSync() {
  try {
    const result = await runSync();
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la synchronisation.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Déclenché par le bouton "Rafraîchir maintenant" (session utilisateur). */
export async function POST() {
  return handleSync();
}

/** Déclenché par le Cron Job Vercel quotidien (voir vercel.json). */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return handleSync();
}
