import { NextRequest, NextResponse } from "next/server";
import { checkPassword } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionValue } from "@/lib/session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const from = String(formData.get("from") || "/");

  let valid: boolean;
  try {
    valid = checkPassword(password);
  } catch {
    // APP_PASSWORD absent de .env — on ne bloque pas silencieusement.
    return NextResponse.json(
      { error: "APP_PASSWORD n'est pas configuré côté serveur. Voir .env.example." },
      { status: 500 }
    );
  }

  if (!valid) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("from", from);
    return NextResponse.redirect(url, { status: 303 });
  }

  const sessionValue = await createSessionValue();
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
