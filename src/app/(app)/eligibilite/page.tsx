import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { EligibiliteForm } from "@/components/EligibiliteForm";

export const dynamic = "force-dynamic";

export default async function EligibilitePage() {
  const user = await getCurrentUser();
  const profil = user ? await prisma.profil.findUnique({ where: { userId: user.id } }) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Éligibilité Creator Rewards</h1>
      <p className="mt-1 text-sm text-muted">
        Estimation basée sur les critères publics du programme. Ces seuils évoluent — à
        re-vérifier périodiquement sur creators.tiktok.com.
      </p>

      <div className="mt-6">
        <EligibiliteForm
          initialFollowerCount={profil?.followerCount ?? null}
          initialAccountType={(profil?.accountType as "PERSONAL" | "BUSINESS" | null) ?? null}
        />
      </div>
    </div>
  );
}
