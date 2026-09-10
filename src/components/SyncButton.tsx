"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function handleSync() {
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/tiktok/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec de la synchronisation.");
        return;
      }
      setLastResult(`${data.videosSynced} vidéo(s) synchronisée(s).`);
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau pendant la synchronisation.");
    }
  }

  return (
    <div>
      <button type="button" onClick={handleSync} disabled={isPending} className="btn-secondary">
        {isPending ? "Synchronisation…" : "Rafraîchir maintenant"}
      </button>
      {error && <p className="mt-2 text-sm text-warning">{error}</p>}
      {lastResult && <p className="mt-2 text-sm text-success">{lastResult}</p>}
    </div>
  );
}
