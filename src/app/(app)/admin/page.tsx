import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { AdminUsers } from "@/components/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const serialized = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Administration</h1>
      <p className="mt-1 text-sm text-muted">
        Invitez des personnes (email + mot de passe temporaire à leur communiquer). Pensez à
        ajouter aussi leur compte TikTok comme testeur dans le bac à sable TikTok pour qu&rsquo;ils
        puissent connecter leur profil.
      </p>

      <div className="mt-6">
        <AdminUsers initialUsers={serialized} />
      </div>
    </div>
  );
}
