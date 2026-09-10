import { prisma } from "@/lib/db";
import { IdeesGenerator } from "@/components/IdeesGenerator";

export const dynamic = "force-dynamic";

export default async function IdeesPage() {
  const history = await prisma.ideeContenu.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const serialized = history.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Idées de contenu</h1>
      <p className="mt-1 text-sm text-muted">
        Génère des idées adaptées à ta niche via un modèle de langage (clé API côté serveur).
      </p>

      <div className="mt-6">
        <IdeesGenerator initialHistory={serialized} />
      </div>
    </div>
  );
}
