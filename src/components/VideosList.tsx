"use client";

import { useState } from "react";

interface VideoDTO {
  id: number;
  titre: string | null;
  dureeSecondes: number | null;
  vues: number | null;
  contenuOriginal: boolean;
  pasDuoOuStitch: boolean;
  pasModePhoto: boolean;
  pasContenuSponsorise: boolean;
  conformeReglesEtDroits: boolean;
  eligible: boolean;
  raisonsBlocage: string | null;
}

const CHECKS: { key: keyof VideoDTO; label: string }[] = [
  { key: "contenuOriginal", label: "Contenu original" },
  { key: "pasDuoOuStitch", label: "Pas de Duo / Stitch" },
  { key: "pasModePhoto", label: "Pas de mode Photo" },
  { key: "pasContenuSponsorise", label: "Pas de contenu sponsorisé" },
  { key: "conformeReglesEtDroits", label: "Conforme aux règles et droits d'auteur" },
];

export function VideosList({ initialVideos }: { initialVideos: VideoDTO[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [newTitre, setNewTitre] = useState("");
  const [newDuree, setNewDuree] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function toggleCheck(video: VideoDTO, key: keyof VideoDTO) {
    const res = await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: !video[key] }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    }
  }

  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: newTitre || null,
          dureeSecondes: newDuree ? Number(newDuree) : null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setVideos((prev) => [created, ...prev]);
        setNewTitre("");
        setNewDuree("");
      }
    } finally {
      setIsAdding(false);
    }
  }

  async function removeVideo(id: number) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <form onSubmit={addVideo} className="panel flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px] flex-1">
          <label className="field-label">Titre (facultatif)</label>
          <input
            className="field-input"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            placeholder="Ma prochaine vidéo"
          />
        </div>
        <div className="w-32">
          <label className="field-label">Durée (s)</label>
          <input
            type="number"
            min={0}
            className="field-input"
            value={newDuree}
            onChange={(e) => setNewDuree(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isAdding} className="btn-secondary">
          {isAdding ? "Ajout…" : "Ajouter une vidéo"}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {videos.length === 0 && (
          <p className="text-sm text-muted">
            Aucune vidéo pour l&rsquo;instant. Connecte ton compte TikTok ou ajoute une vidéo manuellement.
          </p>
        )}

        {videos.map((video) => {
          const raisons: string[] = video.raisonsBlocage ? JSON.parse(video.raisonsBlocage) : [];
          return (
            <div key={video.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{video.titre || `Vidéo #${video.id}`}</p>
                  <p className="text-sm text-muted">
                    {video.dureeSecondes !== null ? `${video.dureeSecondes}s` : "durée inconnue"}
                    {video.vues !== null ? ` · ${video.vues.toLocaleString("fr-FR")} vues` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={video.eligible ? "pill-ok" : "pill-blocked"}>
                    {video.eligible ? "Monétisable" : "Bloquée"}
                  </span>
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="text-xs text-muted hover:text-warning"
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {CHECKS.map((c) => (
                  <label key={String(c.key)} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(video[c.key])}
                      onChange={() => toggleCheck(video, c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>

              {raisons.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warning">
                  {raisons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
