import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeChecklistScore } from "@/lib/checklist";

export async function GET() {
  const latest = await prisma.checklistBadge.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(latest);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const input = {
    profilComplet: Boolean(body.profilComplet),
    activiteReguliere: Boolean(body.activiteReguliere),
    authenticite: Boolean(body.authenticite),
    signalNotoriete: Boolean(body.signalNotoriete),
    absenceInfraction: Boolean(body.absenceInfraction),
  };

  const score = computeChecklistScore(input);
  const entry = await prisma.checklistBadge.create({ data: { ...input, score } });
  return NextResponse.json(entry, { status: 201 });
}
