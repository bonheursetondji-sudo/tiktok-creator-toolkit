import { prisma } from "@/lib/db";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function ConnexionTikTokPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const profil = await prisma.profil.findFirst({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold">Connexion TikTok</h1>
      <p className="mt-1 text-sm text-muted">
        Connecte ton compte pour pré-remplir automatiquement les autres modules. Ce n&rsquo;est pas
        obligatoire : la saisie manuelle reste disponible partout.
      </p>

      {connected === "1" && (
        <p className="mt-4 rounded bg-success-bg px-3 py-2 text-sm text-success">
          Compte connecté avec succès.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded bg-warning-bg px-3 py-2 text-sm text-warning">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="panel mt-6 p-5">
        {profil ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted">Compte : </span>
              <span className="font-medium">{profil.displayName ?? "(nom indisponible)"}</span>
            </p>
            <p>
              <span className="text-muted">Abonnés : </span>
              <span className="font-medium">
                {profil.followerCount?.toLocaleString("fr-FR") ?? "inconnu"}
              </span>
            </p>
            <p>
              <span className="text-muted">Dernière synchro : </span>
              <span className="font-medium">
                {profil.lastSyncAt ? new Date(profil.lastSyncAt).toLocaleString("fr-FR") : "jamais"}
              </span>
            </p>
            <div className="pt-3">
              <SyncButton />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted">Aucun compte connecté pour le moment.</p>
            <a href="/api/tiktok/authorize" className="btn-primary mt-4 inline-flex">
              Connecter mon compte TikTok
            </a>
          </div>
        )}
      </div>

      <div className="panel mt-4 p-5 text-sm text-muted">
        <p className="font-medium text-ink">Ce que cette connexion peut et ne peut pas faire</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Récupère les données publiques du profil et la liste des vidéos (durée, vues, date).</li>
          <li>Ne donne jamais accès au statut de monétisation interne de TikTok.</li>
          <li>Ne prédit ni n&rsquo;accélère l&rsquo;attribution du badge de vérification.</li>
        </ul>
      </div>
    </div>
  );
}
