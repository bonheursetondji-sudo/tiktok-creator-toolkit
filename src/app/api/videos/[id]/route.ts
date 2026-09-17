import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeMonetization } from "@/lib/monetization";
import { getCurrentUser } from "@/lib/current-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DECLARATIVE_FIELDS = [
  "contenuOriginal",
  "pasDuoOuStitch",
  "pasModePhoto",
  "pasContenuSponsorise",
  "conformeReglesEtDroits",
] as const;

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Vidéo introuvable." }, { status: 404 });
  }

  const body = await request.json();
  const patch: Record<string, boolean> = {};
  for (const field of DECLARATIVE_FIELDS) {
    if (typeof body[field] === "boolean") patch[field] = body[field];
  }

  const merged = { ...existing, ...patch };
  const verdict = computeMonetization({
    dureeSecondes: merged.dureeSecondes,
    contenuOriginal: merged.contenuOriginal,
    pasDuoOuStitch: merged.pasDuoOuStitch,
    pasModePhoto: merged.pasModePhoto,
    pasContenuSponsorise: merged.pasContenuSponsorise,
    conformeReglesEtDroits: merged.conformeReglesEtDroits,
  });

  const video = await prisma.video.update({
    where: { id },
    data: { ...patch, eligible: verdict.eligible, raisonsBlocage: JSON.stringify(verdict.raisonsBlocage) },
  });

  return NextResponse.json(video);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Vidéo introuvable." }, { status: 404 });
  }

  await prisma.video.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
