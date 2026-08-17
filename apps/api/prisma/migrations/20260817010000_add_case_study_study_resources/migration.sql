-- AlterTable
ALTER TABLE "StudyResource" ALTER COLUMN "videoId" DROP NOT NULL;
ALTER TABLE "StudyResource" ADD COLUMN "caseStudyId" TEXT;

-- AlterEnum
ALTER TYPE "StudyResourceType" ADD VALUE 'TRANSCRICAO';

-- CreateIndex
CREATE INDEX "StudyResource_caseStudyId_idx" ON "StudyResource"("caseStudyId");

-- AddForeignKey
ALTER TABLE "StudyResource" ADD CONSTRAINT "StudyResource_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "CaseStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
