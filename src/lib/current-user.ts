import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE, getSessionUserId } from "./session";

export interface CurrentUser {
  id: number;
  email: string;
  isAdmin: boolean;
}

/**
 * Récupère l'utilisateur connecté (Server Components, Route Handlers).
 * Retourne null si personne n'est connecté — le proxy garantit déjà
 * qu'on n'arrive jamais ici sans session valide sur les pages protégées,
 * mais chaque route reste défensive.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const userId = await getSessionUserId(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isAdmin: true },
  });
  return user;
}

/** Variante qui lève une erreur si personne n'est connecté — pour les routes API. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  return user;
}
