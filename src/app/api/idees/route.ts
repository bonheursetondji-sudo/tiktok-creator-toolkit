import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateIdeas } from "@/lib/ai";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const idees = await prisma.ideeContenu.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(idees);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json();
  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  if (!niche) {
    return NextResponse.json({ error: "La niche est requise." }, { status: 400 });
  }

  let generated;
  try {
    generated = await generateIdeas(niche, 9);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la génération d'idées.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const created = await prisma.$transaction(
    generated.map((idee) =>
      prisma.ideeContenu.create({
        data: {
          userId: user.id,
          niche,
          accroche: idee.accroche,
          angle: idee.angle,
          format: idee.format,
          dureeSuggeree: idee.dureeSuggeree,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}
