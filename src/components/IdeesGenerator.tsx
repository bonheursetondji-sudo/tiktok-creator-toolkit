"use client";

import { useState } from "react";

interface Idee {
  id: number;
  niche: string;
  accroche: string;
  angle: string;
  format: string | null;
  dureeSuggeree: string | null;
  statut: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  proposee: "Proposée",
  gardee: "Gardée",
  utilisee: "Utilisée",
};

export function IdeesGenerator({ initialHistory }: { initialHistory: Idee[] }) {
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<Idee[]>([]);
  const [history, setHistory] = useState<Idee[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/idees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec de la génération.");
        return;
      }
      setIdeas(data);
      setHistory((prev) => [...data, ...prev]);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id: number, statut: Idee["statut"]) {
    const res = await fetch(`/api/idees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setHistory((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  return (
    <div>
      <form onSubmit={handleGenerate} className="panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="field-label">Niche</label>
          <input
            className="field-input"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="ex. cuisine végétarienne rapide"
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? "Génération…" : "Générer des idées"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-warning">{error}</p>}

      {ideas.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ideas.map((idee) => (
            <IdeeCard key={idee.id} idee={idee} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Historique</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {history
            .filter((i) => !ideas.some((cur) => cur.id === i.id))
            .map((idee) => (
              <IdeeCard key={idee.id} idee={idee} onStatusChange={updateStatus} />
            ))}
          {history.length === 0 && (
            <p className="text-sm text-muted">Aucune idée générée pour l&rsquo;instant.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IdeeCard({
  idee,
  onStatusChange,
}: {
  idee: Idee;
  onStatusChange: (id: number, statut: Idee["statut"]) => void;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted">{idee.niche}</p>
        <span className="pill-ok">{STATUS_LABEL[idee.statut]}</span>
      </div>
      <p className="mt-2 font-medium">{idee.accroche}</p>
      <p className="mt-1 text-sm text-muted">{idee.angle}</p>
      <p className="mt-2 text-xs text-muted">
        {idee.format ? idee.format : "Format libre"}
        {idee.dureeSuggeree ? ` · ${idee.dureeSuggeree}` : ""}
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onStatusChange(idee.id, "gardee")} className="btn-secondary text-xs">
          Garder
        </button>
        <button onClick={() => onStatusChange(idee.id, "utilisee")} className="btn-secondary text-xs">
          Marquer utilisée
        </button>
      </div>
    </div>
  );
}
