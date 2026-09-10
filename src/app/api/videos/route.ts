import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeMonetization } from "@/lib/monetization";

export async function GET() {
  const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(videos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const titre = typeof body.titre === "string" && body.titre.trim() ? body.titre.trim() : null;
  const dureeSecondes = Number.isFinite(body.dureeSecondes) ? Number(body.dureeSecondes) : null;

  const verdict = computeMonetization({
    dureeSecondes,
    contenuOriginal: false,
    pasDuoOuStitch: false,
    pasModePhoto: false,
    pasContenuSponsorise: false,
    conformeReglesEtDroits: false,
  });

  const video = await prisma.video.create({
    data: {
      titre,
      dureeSecondes,
      eligible: verdict.eligible,
      raisonsBlocage: JSON.stringify(verdict.raisonsBlocage),
    },
  });

  return NextResponse.json(video, { status: 201 });
}
