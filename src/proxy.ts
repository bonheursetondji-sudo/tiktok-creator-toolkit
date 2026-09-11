import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { SESSION_COOKIE, isSessionValid } from "@/lib/session";

// Next.js 16 renamed the middleware.ts convention to proxy.ts (same role:
// runs before every request, gates access). It now runs on the Node.js
// runtime rather than Edge — session.ts still uses Web Crypto rather than
// node:crypto, which works fine under both, so nothing else needed to change.
// (node:crypto is used below too, now that proxy.ts is Node.js-runtime.)

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/terms", "/privacy"];

function timingSafeStringEqual(a: string, b: string): boolean {
  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Fichiers statiques de vérification à la racine (robots.txt, fichier de
  // preuve de propriété TikTok, futur sitemap.xml...) — placés dans public/
  // précisément pour être récupérables sans authentification, sinon les
  // vérificateurs externes (TikTok, moteurs de recherche) reçoivent une
  // redirection vers /login au lieu du contenu attendu.
  if (/^\/[^/]+\.(txt|xml)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Rafraîchissement automatique quotidien (section 4.1) via Vercel Cron :
  // Vercel invoque cette route en GET avec un header Authorization signé
  // automatiquement à partir de CRON_SECRET (voir vercel.json + README).
  // Secret étroitement scopé à cette seule route — volontairement distinct
  // de APP_API_KEY ci-dessous.
  if (pathname === "/api/tiktok/sync" && request.method === "GET") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader && authHeader.startsWith("Bearer ")) {
      const provided = authHeader.slice("Bearer ".length);
      if (timingSafeStringEqual(provided, cronSecret)) {
        return NextResponse.next();
      }
    }
  }

  // Accès programmatique (scripts, automatisations, Shortcuts, curl...) à
  // n'importe quelle route /api/* via une clé API personnelle, en
  // complément — pas en remplacement — du cookie de session utilisé par
  // le navigateur. Voir .env.example / README pour la générer.
  if (pathname.startsWith("/api/")) {
    const apiKey = process.env.APP_API_KEY;
    const authHeader = request.headers.get("authorization");
    if (apiKey && authHeader && authHeader.startsWith("Bearer ")) {
      const provided = authHeader.slice("Bearer ".length);
      if (timingSafeStringEqual(provided, apiKey)) {
        return NextResponse.next();
      }
    }
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isSessionValid(cookie);

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// S'applique à tout sauf les assets Next.js et les fichiers statiques.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};