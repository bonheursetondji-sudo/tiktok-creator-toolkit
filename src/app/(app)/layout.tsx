import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Filet de sécurité en plus du proxy : si jamais on arrive ici sans
  // session valide (edge case), on renvoie proprement vers /login plutôt
  // que de laisser une page planter en cherchant un utilisateur inexistant.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user.email} isAdmin={user.isAdmin} />
      <main className="flex-1 px-8 py-8 md:px-12">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
