export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from = "/", error } = await searchParams;
  const hasError = error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm panel bg-surface p-6">
        <h1 className="text-lg font-bold">Creator Toolkit</h1>
        <p className="mt-1 text-sm text-muted">Accès personnel — entrez le mot de passe.</p>

        <form action="/api/auth/login" method="POST" className="mt-5 space-y-3">
          <input type="hidden" name="from" value={from} />
          <div>
            <label htmlFor="password" className="field-label">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="field-input"
            />
          </div>
          {hasError && (
            <p className="text-sm text-warning">Mot de passe incorrect. Réessayez.</p>
          )}
          <button type="submit" className="btn-primary w-full">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
