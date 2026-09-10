import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateIdeas } from "@/lib/ai";

export async function GET() {
  const idees = await prisma.ideeContenu.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(idees);
}

export async function POST(request: NextRequest) {
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
