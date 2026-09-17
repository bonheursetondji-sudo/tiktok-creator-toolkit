import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionValue } from "@/lib/session";

function redirectToLoginError(request: NextRequest, from: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "1");
  url.searchParams.set("from", from);
  return NextResponse.redirect(url, { status: 303 });
}

async function setSessionAndRedirect(request: NextRequest, userId: number, from: string) {
  const sessionValue = await createSessionValue(userId);
  const response = NextResponse.redirect(new URL(from, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const mode = String(formData.get("mode") || "login");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const from = String(formData.get("from") || "/");

  if (!email || !password) {
    return redirectToLoginError(request, from);
  }

  if (mode === "bootstrap") {
    // Sécurité : on revérifie côté serveur qu'aucun compte n'existe déjà,
    // plutôt que de faire confiance au formulaire (qui pourrait être
    // rejoué). Si un compte existe déjà, on retombe sur un login normal.
    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      return redirectToLoginError(request, from);
    }
    if (password.length < 8) {
      return redirectToLoginError(request, from);
    }
    const user = await prisma.user.create({
      data: { email, passwordHash: hashPassword(password), isAdmin: true },
    });
    return setSessionAndRedirect(request, user.id, from);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return redirectToLoginError(request, from);
  }
  return setSessionAndRedirect(request, user.id, from);
}
