/**
 * Checklist de préparation au badge de vérification (section 4.5).
 * Purement déclaratif — aucune donnée TikTok ne confirme ces points.
 * Le score n'est qu'un indicateur de préparation personnel, jamais une
 * probabilité d'obtention du badge (décision humaine interne à TikTok).
 */

export interface ChecklistInput {
  profilComplet: boolean;
  activiteReguliere: boolean;
  authenticite: boolean;
  signalNotoriete: boolean;
  absenceInfraction: boolean;
}

export function computeChecklistScore(input: ChecklistInput): number {
  return Object.values(input).filter(Boolean).length;
}
