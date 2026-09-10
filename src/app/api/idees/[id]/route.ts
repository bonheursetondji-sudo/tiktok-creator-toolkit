import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["proposee", "gardee", "utilisee"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const body = await request.json();
  const statut = body.statut;

  if (!VALID_STATUSES.includes(statut)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const idee = await prisma.ideeContenu.update({ where: { id }, data: { statut } });
  return NextResponse.json(idee);
}
