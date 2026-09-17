import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { VideosList } from "@/components/VideosList";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const user = await getCurrentUser();
  const videos = user
    ? await prisma.video.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Vérificateur de vidéos</h1>
      <p className="mt-1 text-sm text-muted">
        La durée est vérifiée automatiquement si connecté. Le reste reste déclaratif : TikTok ne
        partage pas ces signaux via API publique.
      </p>

      <div className="mt-6">
        <VideosList initialVideos={videos} />
      </div>
    </div>
  );
}
