"use client";

import { useState } from "react";
import type { EligibilityResult } from "@/lib/eligibility";

interface Props {
  initialFollowerCount: number | null;
  initialAccountType: "PERSONAL" | "BUSINESS" | null;
}

export function EligibiliteForm({ initialFollowerCount, initialAccountType }: Props) {
  const [accountType, setAccountType] = useState(initialAccountType ?? "PERSONAL");
  const [followerCount, setFollowerCount] = useState(initialFollowerCount?.toString() ?? "");
  const [views, setViews] = useState("");
  const [ageOver18, setAgeOver18] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [noRecentInfraction, setNoRecentInfraction] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/eligibilite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          followerCount: followerCount ? Number(followerCount) : null,
          viewsLast30Days: views ? Number(views) : null,
          ageOver18,
          countryCode: countryCode || null,
          noRecentInfraction,
        }),
      });
      setResult(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
        <div>
          <label className="field-label">Type de compte</label>
          <select
            className="field-input"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as "PERSONAL" | "BUSINESS")}
          >
            <option value="PERSONAL">Personnel</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>

        <div>
          <label className="field-label">Nombre d&rsquo;abonnés</label>
          <input
            type="number"
            min={0}
            className="field-input"
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Vues sur les 30 derniers jours</label>
          <input
            type="number"
            min={0}
            className="field-input"
            value={views}
            onChange={(e) => setViews(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Code pays (ex. FR, US)</label>
          <input
            type="text"
            maxLength={2}
            className="field-input uppercase"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ageOver18} onChange={(e) => setAgeOver18(e.target.checked)} />
          J&rsquo;ai 18 ans ou plus
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={noRecentInfraction}
            onChange={(e) => setNoRecentInfraction(e.target.checked)}
          />
          Aucune infraction récente aux règles communautaires
        </label>

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Calcul…" : "Vérifier l'éligibilité"}
        </button>
      </form>

      <div className="panel p-5">
        {!result ? (
          <p className="text-sm text-muted">Le résultat s&rsquo;affichera ici après vérification.</p>
        ) : (
          <div>
            <p
              className={`text-sm font-semibold ${result.eligible ? "text-success" : "text-warning"}`}
            >
              {result.eligible ? "Éligible sur la base des critères saisis." : "Non éligible pour l'instant."}
            </p>
            <ul className="mt-4 space-y-3">
              {result.criteria.map((c) => (
                <li key={c.label} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className={c.met ? "pill-ok" : "pill-blocked"}>{c.met ? "OK" : "À revoir"}</span>
                    <span className="font-medium">{c.label}</span>
                  </div>
                  <p className="mt-0.5 pl-1 text-muted">{c.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
