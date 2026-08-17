-- AlterTable
ALTER TABLE "User" ADD COLUMN     "geminiApiKey" TEXT;

-- CreateEnum
CREATE TYPE "StudyResourceType" AS ENUM ('QUIZ', 'FLASHCARDS', 'QUESTIONARIO', 'MIND_MAP', 'INFOGRAPHIC', 'RESUMO', 'AUDIO_RESUMO');

-- CreateEnum
CREATE TYPE "StudyResourceStatus" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "StudyResource" (
    "id" TEXT NOT NULL,
    "type" "StudyResourceType" NOT NULL,
    "status" "StudyResourceStatus" NOT NULL DEFAULT 'RASCUNHO',
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "videoId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "StudyResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyVote" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StudyVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyResource_videoId_idx" ON "StudyResource"("videoId");

-- CreateIndex
CREATE INDEX "StudyResource_authorId_idx" ON "StudyResource"("authorId");

-- CreateIndex
CREATE INDEX "StudyResource_status_idx" ON "StudyResource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudyVote_resourceId_userId_key" ON "StudyVote"("resourceId", "userId");

-- AddForeignKey
ALTER TABLE "StudyResource" ADD CONSTRAINT "StudyResource_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyResource" ADD CONSTRAINT "StudyResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyVote" ADD CONSTRAINT "StudyVote_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "StudyResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyVote" ADD CONSTRAINT "StudyVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
