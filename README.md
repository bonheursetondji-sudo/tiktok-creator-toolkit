# TikTok Creator Toolkit

Outil personnel (mono-utilisateur) pour un créateur TikTok : idées de contenu
par IA, éligibilité au Creator Rewards Program, vérificateur de
monétisabilité par vidéo, checklist de préparation au badge de vérification.

Construit à partir du cahier des charges fourni — voir en particulier sa
section 2 (« Périmètre ») pour ce que l'outil peut et ne peut **pas** faire.
Rien dans cette app ne prétend lire un statut de monétisation officiel ou
prédire une décision de badge : TikTok ne partage aucune de ces deux
informations via API publique.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Prisma + PostgreSQL (Neon) ·
Tailwind CSS · TikTok Login Kit (OAuth 2.0 + PKCE) · Anthropic ou OpenAI au
choix pour la génération d'idées.

## Prérequis

- Node.js ≥ 20.19
- Un compte développeur sur [developers.tiktok.com](https://developers.tiktok.com) (facultatif au démarrage — tout fonctionne aussi en saisie manuelle)
- Une clé API Anthropic **ou** OpenAI (pour le générateur d'idées, module 4.2)

## Installation locale

```bash
npm install
cp .env.example .env
```

Dans `.env`, renseignez au minimum :

```bash
DATABASE_URL="..."    # connexion "pooled" Neon — voir la section Déploiement
DIRECT_URL="..."      # connexion directe Neon — idem
APP_PASSWORD="votre-mot-de-passe"
APP_SECRET="$(openssl rand -hex 32)"   # signe la session ET chiffre les jetons TikTok
```

Le plus simple pour développer en local : créez votre projet Neon (voir
section Déploiement ci-dessous) *avant* l'installation locale, et utilisez
directement ses URLs ici. Neon est gratuit sur son offre de base ; pour ne
pas toucher aux données de prod pendant le développement, vous pouvez
créer une seconde branche ou un second projet Neon dédié au dev.

Puis :

```bash
npx prisma migrate dev --name init   # crée les tables sur votre base Postgres
npm run dev                          # http://localhost:3000
```

Sans `TIKTOK_CLIENT_KEY` / `ANTHROPIC_API_KEY` configurés, l'app démarre
quand même : la connexion TikTok et la génération d'idées afficheront
simplement une erreur explicite tant que ces clés ne sont pas renseignées,
et les autres modules (éligibilité, vérificateur vidéo, checklist badge)
fonctionnent entièrement en saisie manuelle.

## Créer l'app TikTok (module 4.1)

1. Sur [developers.tiktok.com](https://developers.tiktok.com), créez une app et activez **Login Kit**.
2. Scopes à activer : `user.info.basic`, `user.info.stats`, `video.list`.
3. Renseignez l'URI de redirection **exactement** telle que dans `.env` :
   `TIKTOK_REDIRECT_URI` (ex. `http://localhost:3000/api/tiktok/callback`
   en local, votre domaine en production).
4. Copiez le Client Key / Client Secret dans `.env`.

**À savoir** : `user.info.basic` fonctionne généralement assez vite, mais
`video.list` fait partie des scopes qui nécessitent une **App Review**
côté TikTok (avec vidéo de démonstration de l'intégration réelle). Tant
que l'app n'est pas validée, elle tourne en mode sandbox limité aux
comptes que vous ajoutez comme « target users » dans le portail — pour un
usage mono-utilisateur avec votre propre compte, ça reste largement
suffisant pour développer et tester. Les scopes, champs disponibles et
délais de review évoluent côté TikTok : revérifiez sur le portail au
moment de l'implémentation.

## Configurer la génération d'idées (module 4.2)

Dans `.env` :

```bash
AI_PROVIDER="anthropic"        # ou "openai"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-5"
```

Les identifiants de modèle évoluent — vérifiez les valeurs courantes sur
[docs.claude.com](https://docs.claude.com/en/docs/about-claude/models) (ou
[platform.openai.com/docs/models](https://platform.openai.com/docs/models)
pour OpenAI) avant de déployer, et ajustez `ANTHROPIC_MODEL` /
`OPENAI_MODEL` en conséquence.

## Déploiement sur Vercel (chemin principal)

### 1. Créer la base Postgres (Neon)

1. Créez un compte sur [neon.com](https://neon.com) (offre gratuite suffisante pour un usage mono-utilisateur) et un projet.
2. Dans le tableau de bord du projet, récupérez deux chaînes de connexion :
   celle avec `-pooler` dans le nom d'hôte (→ `DATABASE_URL`) et celle sans
   (→ `DIRECT_URL`). Les deux utilisent `?sslmode=require`.
3. Collez-les dans `.env` en local pour lancer la première migration
   (`npx prisma migrate dev --name init`) — ça crée les tables sur Neon.

### 2. Pousser le code sur GitHub

Vercel déploie depuis un dépôt Git. Créez un dépôt (public ou privé) sur
GitHub et poussez-y le contenu de ce dossier.

### 3. Importer le projet sur Vercel

Sur [vercel.com](https://vercel.com), *Add New → Project*, importez le
dépôt. Le framework Next.js est détecté automatiquement, aucune
configuration de build à changer.

### 4. Variables d'environnement

Dans les réglages du projet Vercel (*Settings → Environment Variables*),
renseignez toutes les variables de `.env.example` : `DATABASE_URL`,
`DIRECT_URL`, `APP_PASSWORD`, `APP_SECRET`, `TIKTOK_CLIENT_KEY`,
`TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` (avec votre domaine Vercel
définitif, ex. `https://votre-app.vercel.app/api/tiktok/callback`),
`AI_PROVIDER`, `ANTHROPIC_API_KEY` (ou `OPENAI_API_KEY`), `CRON_SECRET`,
et éventuellement `APP_API_KEY`.

### 5. Déployer

Lancez le déploiement depuis Vercel. Les migrations Prisma ne s'exécutent
**pas** automatiquement au build sur Vercel (contrairement à Docker) : la
première fois, lancez `npx prisma migrate deploy` depuis votre machine en
local avec les variables de prod dans `.env` (ou via `vercel env pull`
pour les récupérer automatiquement), avant ou juste après le premier
déploiement.

### 6. Mettre à jour l'app TikTok développeur

Retournez sur [developers.tiktok.com](https://developers.tiktok.com) et
mettez à jour l'URI de redirection déclarée pour qu'elle corresponde
exactement à `TIKTOK_REDIRECT_URI` en production.

### 7. Vérifier le Cron

`vercel.json` déclare déjà le Cron Job quotidien vers `/api/tiktok/sync`.
Une fois `CRON_SECRET` défini dans les variables d'environnement Vercel,
Vercel l'envoie automatiquement — rien d'autre à configurer. Visible dans
l'onglet *Cron Jobs* du projet.

## Alternative — auto-hébergement Docker

Le projet inclut aussi un `Dockerfile` + `docker-compose.yml` pensés pour
SQLite avec persistance via un volume nommé — une option plus simple si
vous avez déjà un serveur et préférez éviter une base externe. **Le schéma
actuel (`prisma/schema.prisma`) cible Postgres** pour coller au chemin
Vercel ci-dessus ; pour repartir sur Docker + SQLite, repassez le
datasource en `provider = "sqlite"` (et retirez `directUrl`), régénérez
(`npx prisma generate`), puis :

```bash
cp .env.example .env   # adaptez DATABASE_URL en "file:/data/prod.db"
docker compose up -d --build
```

Le fichier SQLite vit alors dans le volume Docker nommé
(`tiktok_toolkit_data`), donc il survit aux redémarrages et redéploiements
du conteneur. Les migrations s'appliquent automatiquement au démarrage
(`docker-entrypoint.sh`). Le Cron Vercel ne s'applique pas ici : utilisez
le bouton « Rafraîchir maintenant » ou un cron système appelant la route
avec le header `Authorization` attendu.

## Sécurité (section 6 du cahier des charges)

- Accès à l'app protégé par mot de passe (cookie de session signé HMAC,
  30 jours, `httpOnly`).
- Jetons TikTok chiffrés en base (AES-256-GCM) — jamais en clair.
- Toutes les clés API restent côté serveur ; aucune ne transite côté client.
- `.env` exclu du dépôt (`.gitignore`).

### Accès programmatique (clé API personnelle)

En plus du cookie de session (navigateur), toute route `/api/*` accepte un
header `Authorization: Bearer <APP_API_KEY>` — pratique pour un script, un
raccourci iOS/Android, ou un `curl` sans passer par le formulaire de
connexion. Définissez `APP_API_KEY` dans `.env` (vide par défaut =
désactivé, seul le cookie fonctionne alors) :

```bash
curl -X POST https://votre-domaine/api/tiktok/sync \
  -H "Authorization: Bearer $APP_API_KEY"

curl https://votre-domaine/api/videos \
  -H "Authorization: Bearer $APP_API_KEY"
```

C'est volontairement une clé distincte de `CRON_SECRET` : celle-ci reste
étroitement limitée au déclenchement du cron `/api/tiktok/sync`, tandis
qu'`APP_API_KEY` donne accès à l'ensemble de l'API — à ne partager avec
aucun outil tiers en qui vous n'avez pas confiance. Comme les autres
secrets, la faire tourner consiste à changer la valeur dans `.env` (ou les
variables d'environnement de votre hébergeur) et à redéployer.

## Limites connues (voir section 2 du cahier des charges)

- Pas d'accès au statut de monétisation interne réel de TikTok.
- Pas de prédiction ni d'accélération du badge de vérification.
- Le contenu sponsorisé, le Duo/Stitch, le mode Photo et la conformité
  aux droits d'auteur restent déclaratifs — TikTok ne les expose pas via
  API publique. Seule la durée (règle des 60s) est vérifiée
  automatiquement.
- Les seuils d'éligibilité au Creator Rewards Program (`src/lib/eligibility.ts`)
  et la liste des pays couverts sont corrects au moment de l'écriture,
  mais évoluent — à revérifier périodiquement sur creators.tiktok.com.

## Structure du projet

```
src/
  proxy.ts              # gate d'authentification (ex-middleware.ts, Next.js 16)
  lib/                   # logique pure + intégrations (TikTok, IA, crypto, session)
  components/             # composants client (formulaires interactifs)
  app/
    login/                # page de connexion (hors du groupe protégé)
    (app)/                # toutes les pages protégées + sidebar
      connexion-tiktok/
      idees/
      eligibilite/
      videos/
      badge/
    api/                  # routes serveur (auth, tiktok, idees, eligibilite, videos, badge)
prisma/schema.prisma      # Profil, Video, IdeeContenu, ChecklistBadge
```

## Pistes d'évolution possibles

- Pagination de la liste des vidéos synchronisées (actuellement 20 par
  appel côté `fetchVideoList`).
- Historique dans le temps des stats du profil (graphe d'évolution des
  abonnés/vues) — la donnée est déjà là (`lastSyncAt`), il manque juste
  l'agrégation et l'affichage.
- Tests automatisés sur `src/lib/eligibility.ts` et
  `src/lib/monetization.ts` (logique pure, faciles à tester unitairement).
 
 