-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN     "audioTitle" TEXT;

-- CreateTable
CREATE TABLE "CaseStudyAudioTag" (
    "caseStudyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CaseStudyAudioTag_pkey" PRIMARY KEY ("caseStudyId","tagId")
);

-- CreateIndex
CREATE INDEX "CaseStudyAudioTag_tagId_idx" ON "CaseStudyAudioTag"("tagId");

-- AddForeignKey
ALTER TABLE "CaseStudyAudioTag" ADD CONSTRAINT "CaseStudyAudioTag_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "CaseStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStudyAudioTag" ADD CONSTRAINT "CaseStudyAudioTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
