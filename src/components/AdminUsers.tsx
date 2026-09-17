"use client";

import { useState } from "react";

interface UserRow {
  id: number;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminUsers({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec de la création du compte.");
        return;
      }
      setUsers((prev) => [...prev, data]);
      setEmail("");
      setPassword("");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="panel space-y-3 p-5">
        <p className="font-medium">Inviter une personne</p>
        <div>
          <label className="field-label">Email</label>
          <input
            type="email"
            required
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Mot de passe temporaire</label>
          <input
            type="text"
            required
            minLength={8}
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 8 caractères — à communiquer à la personne"
          />
        </div>
        {error && <p className="text-sm text-warning">{error}</p>}
        <button type="submit" disabled={isCreating} className="btn-primary">
          {isCreating ? "Création…" : "Créer le compte"}
        </button>
      </form>

      <div className="mt-6">
        <p className="font-medium">
          Comptes existants ({users.length} / 10 — limite du bac à sable TikTok)
        </p>
        <div className="mt-3 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="panel flex items-center justify-between px-4 py-3 text-sm">
              <span>{u.email}</span>
              <span className="flex items-center gap-2">
                {u.isAdmin && <span className="pill-ok">Admin</span>}
                <span className="text-muted">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
