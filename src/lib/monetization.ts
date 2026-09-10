/**
 * Logique pure — Vérificateur de monétisabilité par vidéo (section 4.4).
 *
 * Une seule règle est objective et calculable automatiquement à partir des
 * données synchronisées : la durée minimale. Tout le reste reste
 * déclaratif par nature (voir section 2 du cahier des charges — TikTok ne
 * partage pas ces signaux via API publique).
 */

export const MIN_DURATION_SECONDS = 60;

export interface MonetizationInput {
  dureeSecondes: number | null;
  contenuOriginal: boolean;
  pasDuoOuStitch: boolean;
  pasModePhoto: boolean;
  pasContenuSponsorise: boolean;
  conformeReglesEtDroits: boolean;
}

export interface MonetizationResult {
  eligible: boolean;
  raisonsBlocage: string[];
}

export function computeMonetization(input: MonetizationInput): MonetizationResult {
  const raisons: string[] = [];

  if (input.dureeSecondes === null) {
    raisons.push(`Durée inconnue (minimum requis : ${MIN_DURATION_SECONDS} s).`);
  } else if (input.dureeSecondes < MIN_DURATION_SECONDS) {
    raisons.push(
      `Vidéo trop courte : ${input.dureeSecondes}s, minimum ${MIN_DURATION_SECONDS}s pour le palier de rémunération le plus élevé.`
    );
  }

  if (!input.contenuOriginal) raisons.push("Contenu non déclaré comme original.");
  if (!input.pasDuoOuStitch) raisons.push("Vidéo signalée comme Duo ou Stitch.");
  if (!input.pasModePhoto) raisons.push("Vidéo signalée comme publiée en mode Photo.");
  if (!input.pasContenuSponsorise) raisons.push("Contenu signalé comme sponsorisé.");
  if (!input.conformeReglesEtDroits) {
    raisons.push("Conformité aux règles communautaires / droits d'auteur non confirmée.");
  }

  return {
    eligible: raisons.length === 0,
    raisonsBlocage: raisons,
  };
}
