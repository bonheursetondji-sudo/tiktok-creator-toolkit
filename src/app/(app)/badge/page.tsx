import { prisma } from "@/lib/db";
import { BadgeChecklist } from "@/components/BadgeChecklist";

export const dynamic = "force-dynamic";

export default async function BadgePage() {
  const latest = await prisma.checklistBadge.findFirst({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold">Checklist badge de vérification</h1>
      <p className="mt-1 text-sm text-muted">
        Purement déclaratif — aucune connexion API pour ce module, TikTok ne partage aucune donnée
        à ce sujet.
      </p>

      <div className="mt-6">
        <BadgeChecklist initial={latest} />
      </div>
    </div>
  );
}
