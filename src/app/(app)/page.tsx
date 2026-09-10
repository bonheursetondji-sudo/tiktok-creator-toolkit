import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profil = await prisma.profil.findFirst({ orderBy: { updatedAt: "desc" } });

  const cards = [
    {
      href: "/connexion-tiktok",
      title: "Connexion TikTok",
      description: profil
        ? `Connecté — dernière synchro ${profil.lastSyncAt ? new Date(profil.lastSyncAt).toLocaleString("fr-FR") : "jamais"}.`
        : "Pas encore connecté. Les autres modules fonctionnent aussi en saisie manuelle.",
    },
    {
      href: "/idees",
      title: "Idées de contenu",
      description: "Génère des idées de vidéos adaptées à ta niche via un modèle de langage.",
    },
    {
      href: "/eligibilite",
      title: "Éligibilité Creator Rewards",
      description: "Vérifie où tu en es par rapport aux critères publics du programme.",
    },
    {
      href: "/videos",
      title: "Vérificateur de vidéos",
      description: "Checklist par vidéo avant publication : durée, règles déclaratives.",
    },
    {
      href: "/badge",
      title: "Checklist badge",
      description: "Prépare ta demande de badge de vérification — purement indicatif.",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-muted">
        Vue d&rsquo;ensemble de ton compte et de tes outils de préparation.
      </p>

      <div className="mt-8 grid gap-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="panel block px-5 py-4 hover:border-accent">
            <p className="font-medium">{card.title}</p>
            <p className="mt-1 text-sm text-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
