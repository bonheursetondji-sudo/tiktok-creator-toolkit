import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeChecklistScore } from "@/lib/checklist";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const latest = await prisma.checklistBadge.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(latest);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json();
  const input = {
    profilComplet: Boolean(body.profilComplet),
    activiteReguliere: Boolean(body.activiteReguliere),
    authenticite: Boolean(body.authenticite),
    signalNotoriete: Boolean(body.signalNotoriete),
    absenceInfraction: Boolean(body.absenceInfraction),
  };

  const score = computeChecklistScore(input);
  const entry = await prisma.checklistBadge.create({ data: { userId: user.id, ...input, score } });
  return NextResponse.json(entry, { status: 201 });
}
