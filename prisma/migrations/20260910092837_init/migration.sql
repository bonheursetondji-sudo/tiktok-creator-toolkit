-- CreateTable
CREATE TABLE "Profil" (
    "id" SERIAL NOT NULL,
    "tiktokUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "accountType" TEXT,
    "followerCount" INTEGER,
    "country" TEXT,
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "tiktokVideoId" TEXT,
    "titre" TEXT,
    "dureeSecondes" INTEGER,
    "vues" INTEGER,
    "datePublication" TIMESTAMP(3),
    "contenuOriginal" BOOLEAN NOT NULL DEFAULT false,
    "pasDuoOuStitch" BOOLEAN NOT NULL DEFAULT false,
    "pasModePhoto" BOOLEAN NOT NULL DEFAULT false,
    "pasContenuSponsorise" BOOLEAN NOT NULL DEFAULT false,
    "conformeReglesEtDroits" BOOLEAN NOT NULL DEFAULT false,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "raisonsBlocage" TEXT,
    "profilId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeeContenu" (
    "id" SERIAL NOT NULL,
    "niche" TEXT NOT NULL,
    "accroche" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "format" TEXT,
    "dureeSuggeree" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'proposee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeeContenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistBadge" (
    "id" SERIAL NOT NULL,
    "profilComplet" BOOLEAN NOT NULL DEFAULT false,
    "activiteReguliere" BOOLEAN NOT NULL DEFAULT false,
    "authenticite" BOOLEAN NOT NULL DEFAULT false,
    "signalNotoriete" BOOLEAN NOT NULL DEFAULT false,
    "absenceInfraction" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profil_tiktokUserId_key" ON "Profil"("tiktokUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_tiktokVideoId_key" ON "Video"("tiktokVideoId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE SET NULL ON UPDATE CASCADE;
