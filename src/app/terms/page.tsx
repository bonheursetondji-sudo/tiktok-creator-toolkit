export const metadata = { title: "Conditions d'utilisation — TikTok Creator Toolkit" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Conditions d&rsquo;utilisation</h1>
        <p className="mt-1 text-sm text-muted">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <p>
            TikTok Creator Toolkit est un outil personnel, développé et utilisé par un seul
            créateur de contenu pour son propre usage. Il n&rsquo;est pas un service public ni
            commercial, et n&rsquo;est ouvert à aucun autre utilisateur que son propriétaire.
          </p>

          <section>
            <h2 className="font-semibold">Ce que fait l&rsquo;outil</h2>
            <p className="mt-1">
              L&rsquo;outil permet, pour son unique utilisateur : de récupérer ses propres
              données publiques TikTok (profil, liste de vidéos, statistiques) via l&rsquo;API
              officielle TikTok après connexion OAuth ; d&rsquo;estimer son éligibilité à des
              programmes TikTok sur la base de critères publics ; de générer des idées de
              contenu via un modèle de langage ; et de tenir une checklist personnelle de
              préparation. Il ne prétend jamais lire un statut de monétisation officiel ou
              prédire une décision d&rsquo;attribution de badge — ces informations ne sont pas
              partagées par TikTok via API publique.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Absence de garantie</h2>
            <p className="mt-1">
              Cet outil est fourni tel quel, sans garantie d&rsquo;aucune sorte. Son propriétaire
              ne saurait être tenu responsable d&rsquo;éventuelles erreurs, interruptions de
              service, ou pertes de données.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Conformité aux règles TikTok</h2>
            <p className="mt-1">
              L&rsquo;utilisation de l&rsquo;API TikTok par cet outil respecte les conditions
              d&rsquo;utilisation et politiques développeur de TikTok. L&rsquo;accès peut être
              révoqué à tout moment depuis les paramètres du compte TikTok de
              l&rsquo;utilisateur.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Contact</h2>
            <p className="mt-1">
              Pour toute question concernant ces conditions, contactez le propriétaire de
              l&rsquo;outil directement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}