import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, email: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const userCount = await prisma.user.count();
  if (userCount >= 10) {
    return NextResponse.json(
      { error: "Limite de 10 comptes atteinte (plafond du bac à sable TikTok)." },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), isAdmin: false },
    select: { id: true, email: true, isAdmin: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
