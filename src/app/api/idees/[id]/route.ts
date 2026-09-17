import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

const VALID_STATUSES = ["proposee", "gardee", "utilisee"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);

  const existing = await prisma.ideeContenu.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Idée introuvable." }, { status: 404 });
  }

  const body = await request.json();
  const statut = body.statut;
  if (!VALID_STATUSES.includes(statut)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const idee = await prisma.ideeContenu.update({ where: { id }, data: { statut } });
  return NextResponse.json(idee);
}
