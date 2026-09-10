"use client";

import { useState } from "react";

interface ChecklistState {
  profilComplet: boolean;
  activiteReguliere: boolean;
  authenticite: boolean;
  signalNotoriete: boolean;
  absenceInfraction: boolean;
}

const ITEMS: { key: keyof ChecklistState; label: string; help: string }[] = [
  {
    key: "profilComplet",
    label: "Profil complet",
    help: "Photo, bio, lien éventuel — tout est renseigné.",
  },
  {
    key: "activiteReguliere",
    label: "Activité régulière récente",
    help: "Publications à un rythme régulier sur les dernières semaines.",
  },
  {
    key: "authenticite",
    label: "Authenticité",
    help: "Le compte représente une personne ou entité réelle et identifiable.",
  },
  {
    key: "signalNotoriete",
    label: "Signal de notoriété publique",
    help: "Couverture médiatique, forte présence ailleurs, recherché fréquemment.",
  },
  {
    key: "absenceInfraction",
    label: "Absence d'infraction",
    help: "Pas de violation récente des règles communautaires.",
  },
];

export function BadgeChecklist({ initial }: { initial: ChecklistState | null }) {
  const [state, setState] = useState<ChecklistState>(
    initial ?? {
      profilComplet: false,
      activiteReguliere: false,
      authenticite: false,
      signalNotoriete: false,
      absenceInfraction: false,
    }
  );
  const [score, setScore] = useState<number | null>(
    initial ? Object.values(initial).filter(Boolean).length : null
  );
  const [isSaving, setIsSaving] = useState(false);

  async function save(next: ChecklistState) {
    setState(next);
    setIsSaving(true);
    try {
      const res = await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="panel p-5">
        <div className="space-y-4">
          {ITEMS.map((item) => (
            <label key={item.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={state[item.key]}
                onChange={(e) => save({ ...state, [item.key]: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-sm text-muted">{item.help}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm">
            Score de préparation :{" "}
            <span className="font-semibold">{score ?? 0} / 5</span>
            {isSaving && <span className="ml-2 text-xs text-muted">enregistrement…</span>}
          </p>
        </div>
      </div>

      <div className="panel mt-4 bg-accent-dim p-4 text-sm">
        <p className="font-medium">La décision finale n&rsquo;appartient qu&rsquo;à TikTok.</p>
        <p className="mt-1 text-muted">
          Cette checklist est purement indicative. TikTok ne communique aucun critère chiffré ni
          aucune donnée d&rsquo;avancement sur les demandes de badge. La demande se fait uniquement
          depuis l&rsquo;app TikTok : Profil → Paramètres → Support &amp; Signalement → Signaler un
          problème → demander la vérification (le chemin exact peut varier selon les versions).
        </p>
      </div>
    </div>
  );
}
