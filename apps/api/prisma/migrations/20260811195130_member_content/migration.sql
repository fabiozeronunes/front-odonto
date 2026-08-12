-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN     "observations" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "caseStudyId" TEXT,
ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "Specialty" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "observations" TEXT;

-- CreateIndex
CREATE INDEX "CaseStudy_createdById_idx" ON "CaseStudy"("createdById");

-- CreateIndex
CREATE INDEX "Media_videoId_idx" ON "Media"("videoId");

-- CreateIndex
CREATE INDEX "Media_caseStudyId_idx" ON "Media"("caseStudyId");

-- CreateIndex
CREATE INDEX "Specialty_createdById_idx" ON "Specialty"("createdById");

-- CreateIndex
CREATE INDEX "Tag_createdById_idx" ON "Tag"("createdById");

-- CreateIndex
CREATE INDEX "Video_createdById_idx" ON "Video"("createdById");

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "CaseStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
