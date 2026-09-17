import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { fetchUserInfo, fetchVideoList, refreshAccessToken } from "@/lib/tiktok";
import { computeMonetization } from "@/lib/monetization";
import { getCurrentUser } from "@/lib/current-user";

/**
 * Logique de synchro pour UN profil donné — partagée entre :
 *  - POST : déclenché manuellement par le bouton "Rafraîchir maintenant"
 *    pour l'utilisateur actuellement connecté ;
 *  - GET  : déclenché par le Cron Job Vercel quotidien (protégé par
 *    CRON_SECRET, voir proxy.ts et vercel.json), qui boucle sur TOUS les
 *    profils de TOUS les utilisateurs.
 */
async function syncProfil(profil: NonNullable<Awaited<ReturnType<typeof prisma.profil.findUnique>>>) {
  if (!profil.accessTokenEnc || !profil.refreshTokenEnc) {
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
      userId: profil.userId,
    };

    if (existing) {
      await prisma.video.update({ where: { id: existing.id }, data });
    } else {
      await prisma.video.create({ data: { tiktokVideoId: v.id, ...data } });
    }
  }

  return { status: 200 as const, body: { ok: true, videosSynced: videoPage.videos.length } };
}

/** Déclenché par le bouton "Rafraîchir maintenant" — l'utilisateur connecté uniquement. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const profil = await prisma.profil.findUnique({ where: { userId: user.id } });
  if (!profil) {
    return NextResponse.json({ error: "Aucun compte TikTok connecté." }, { status: 400 });
  }

  try {
    const result = await syncProfil(profil);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la synchronisation.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Déclenché par le Cron Job Vercel quotidien — boucle sur tous les utilisateurs. */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const profils = await prisma.profil.findMany({ where: { accessTokenEnc: { not: null } } });
  const results = [];
  for (const profil of profils) {
    try {
      const result = await syncProfil(profil);
      results.push({ userId: profil.userId, ...result.body });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec.";
      results.push({ userId: profil.userId, error: message });
    }
  }

  return NextResponse.json({ ok: true, syncedProfiles: profils.length, results });
}
