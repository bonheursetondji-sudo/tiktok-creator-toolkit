/**
 * Logique pure — Éligibilité au Creator Rewards Program (section 4.3).
 *
 * Seuils vérifiés sur creators.tiktok.com en 2026 : ils évoluent, à
 * re-vérifier périodiquement (voir README). Ne PAS considérer ce module
 * comme une source officielle — c'est une estimation basée sur des
 * critères publics.
 */

export const MIN_FOLLOWERS = 10_000;
export const MIN_VIEWS_30_DAYS = 100_000;
export const MIN_AGE = 18;

// Liste non-exhaustive des marchés où le programme est documenté par
// TikTok. À re-vérifier : la disponibilité par pays change et TikTok
// publie parfois des informations localisées différentes.
export const KNOWN_ELIGIBLE_COUNTRIES = [
  "US",
  "GB",
  "FR",
  "DE",
  "JP",
  "KR",
  "BR",
] as const;

export interface EligibilityInput {
  accountType: "PERSONAL" | "BUSINESS" | null;
  followerCount: number | null;
  viewsLast30Days: number | null;
  ageOver18: boolean; // déclaratif — TikTok ne partage pas l'âge via l'API publique
  countryCode: string | null; // code ISO 3166-1 alpha-2, ex. "FR"
  noRecentInfraction: boolean; // déclaratif
}

export interface EligibilityCriterion {
  label: string;
  met: boolean;
  detail: string;
}

export interface EligibilityResult {
  eligible: boolean;
  criteria: EligibilityCriterion[];
}

export function computeEligibility(input: EligibilityInput): EligibilityResult {
  const criteria: EligibilityCriterion[] = [];

  const isPersonal = input.accountType === "PERSONAL";
  criteria.push({
    label: "Type de compte personnel",
    met: isPersonal,
    detail:
      input.accountType === null
        ? "Type de compte inconnu — à renseigner ou à synchroniser."
        : isPersonal
          ? "Compte personnel."
          : "Compte Business : basculez en compte personnel dans les paramètres TikTok pour être éligible.",
  });

  const hasEnoughFollowers = (input.followerCount ?? 0) >= MIN_FOLLOWERS;
  criteria.push({
    label: `Au moins ${MIN_FOLLOWERS.toLocaleString("fr-FR")} abonnés`,
    met: hasEnoughFollowers,
    detail:
      input.followerCount === null
        ? "Nombre d'abonnés inconnu."
        : `${input.followerCount.toLocaleString("fr-FR")} abonné(s) actuellement.`,
  });

  const hasEnoughViews = (input.viewsLast30Days ?? 0) >= MIN_VIEWS_30_DAYS;
  criteria.push({
    label: `Au moins ${MIN_VIEWS_30_DAYS.toLocaleString("fr-FR")} vues sur 30 jours`,
    met: hasEnoughViews,
    detail:
      input.viewsLast30Days === null
        ? "Vues des 30 derniers jours inconnues."
        : `${input.viewsLast30Days.toLocaleString("fr-FR")} vue(s) déclarée(s) sur 30 jours.`,
  });

  criteria.push({
    label: `${MIN_AGE} ans ou plus`,
    met: input.ageOver18,
    detail: "Déclaratif — TikTok ne communique pas l'âge via l'API publique.",
  });

  const countryKnown =
    !!input.countryCode &&
    (KNOWN_ELIGIBLE_COUNTRIES as readonly string[]).includes(input.countryCode.toUpperCase());
  criteria.push({
    label: "Pays éligible",
    met: countryKnown,
    detail: input.countryCode
      ? countryKnown
        ? `${input.countryCode.toUpperCase()} figure sur la liste connue.`
        : `${input.countryCode.toUpperCase()} n'est pas confirmé — statut "à vérifier" sur creators.tiktok.com.`
      : "Pays non renseigné.",
  });

  criteria.push({
    label: "Aucune infraction récente aux règles communautaires",
    met: input.noRecentInfraction,
    detail: "Déclaratif — non vérifiable via l'API publique.",
  });

  return {
    eligible: criteria.every((c) => c.met),
    criteria,
  };
}
