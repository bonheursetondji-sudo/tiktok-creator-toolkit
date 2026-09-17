import { prisma } from "@/lib/db";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from = "/", error } = await searchParams;
  const hasError = error === "1";

  const userCount = await prisma.user.count();
  const isBootstrap = userCount === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm panel bg-surface p-6">
        <h1 className="text-lg font-bold">Creator Toolkit</h1>

        {isBootstrap ? (
          <>
            <p className="mt-1 text-sm text-muted">
              Première mise en route — créez le compte administrateur.
            </p>
            <form action="/api/auth/login" method="POST" className="mt-5 space-y-3">
              <input type="hidden" name="mode" value="bootstrap" />
              <input type="hidden" name="from" value={from} />
              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <input id="email" name="email" type="email" required className="field-input" />
              </div>
              <div>
                <label htmlFor="password" className="field-label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="field-input"
                />
              </div>
              {hasError && <p className="text-sm text-warning">Une erreur est survenue. Réessayez.</p>}
              <button type="submit" className="btn-primary w-full">
                Créer le compte administrateur
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Connectez-vous avec votre compte.</p>
            <form action="/api/auth/login" method="POST" className="mt-5 space-y-3">
              <input type="hidden" name="mode" value="login" />
              <input type="hidden" name="from" value={from} />
              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <input id="email" name="email" type="email" autoFocus required className="field-input" />
              </div>
              <div>
                <label htmlFor="password" className="field-label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="field-input"
                />
              </div>
              {hasError && (
                <p className="text-sm text-warning">Email ou mot de passe incorrect.</p>
              )}
              <button type="submit" className="btn-primary w-full">
                Se connecter
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
