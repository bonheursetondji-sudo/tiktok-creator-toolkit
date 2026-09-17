export const metadata = { title: "Politique de confidentialité — TikTok Creator Toolkit" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-muted">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <p>
            TikTok Creator Toolkit est un outil à usage restreint, réservé à un petit nombre de
            personnes explicitement invitées. Cette page décrit quelles données sont traitées et
            comment, pour chaque personne invitée — ses données ne sont jamais visibles des
            autres personnes utilisant l&rsquo;outil.
          </p>

          <section>
            <h2 className="font-semibold">Données collectées via TikTok</h2>
            <p className="mt-1">
              Après connexion OAuth volontaire de chaque personne invitée, l&rsquo;outil récupère
              uniquement des données publiques déjà associées à son propre compte TikTok : nom
              affiché, nombre d&rsquo;abonnés, liste de ses vidéos avec leurs métriques publiques
              (durée, vues, date de publication). Aucune personne invitée n&rsquo;a accès aux
              données d&rsquo;une autre.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Stockage et sécurité</h2>
            <p className="mt-1">
              Les jetons d&rsquo;accès TikTok sont chiffrés (AES-256-GCM) avant stockage en base
              de données. Les données restent dans une base de données privée, non accessible
              publiquement, et ne sont jamais revendues ni partagées avec des tiers autres que
              les services strictement nécessaires au fonctionnement de l&rsquo;outil (l&rsquo;API
              TikTok elle-même, et un fournisseur de modèle de langage pour la génération
              d&rsquo;idées de contenu).
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Suppression des données</h2>
            <p className="mt-1">
              L&rsquo;utilisateur peut révoquer l&rsquo;accès de l&rsquo;outil à tout moment
              depuis les paramètres de son compte TikTok. Les données stockées localement par
              l&rsquo;outil peuvent être supprimées directement depuis sa base de données.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Aucun usage publicitaire</h2>
            <p className="mt-1">
              Cet outil n&rsquo;affiche aucune publicité et ne partage aucune donnée à des fins
              publicitaires.
            </p>
          </section>

          <section>
            <h2 className="font-semibold">Contact</h2>
            <p className="mt-1">
              Pour toute question concernant cette politique, contactez le propriétaire de
              l&rsquo;outil directement.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
