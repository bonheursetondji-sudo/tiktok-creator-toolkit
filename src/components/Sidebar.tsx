"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord" },
  { href: "/connexion-tiktok", label: "Connexion TikTok" },
  { href: "/idees", label: "Idées de contenu" },
  { href: "/eligibilite", label: "Éligibilité Creator Rewards" },
  { href: "/videos", label: "Vérificateur de vidéos" },
  { href: "/badge", label: "Checklist badge" },
];

export function Sidebar({ userEmail, isAdmin }: { userEmail: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, { href: "/admin", label: "Administration" }] : NAV_ITEMS;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-ink text-white">
      <div className="px-5 py-6">
        <p className="font-display text-lg font-bold leading-tight">Creator Toolkit</p>
        <p className="mt-0.5 truncate text-xs text-white/50">{userEmail}</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-3 py-2 text-sm transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="POST" className="border-t border-white/10 px-3 py-4">
        <button
          type="submit"
          className="w-full rounded px-3 py-2 text-left text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Se déconnecter
        </button>
      </form>
    </aside>
  );
}
