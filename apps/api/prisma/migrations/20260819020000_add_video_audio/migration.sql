-- AlterTable
ALTER TABLE "Video" ADD COLUMN "audioTitle" TEXT,
ADD COLUMN "audioUrl" TEXT;

-- CreateTable
CREATE TABLE "VideoAudioTag" (
    "videoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "VideoAudioTag_pkey" PRIMARY KEY ("videoId","tagId")
);

-- CreateIndex
CREATE INDEX "VideoAudioTag_tagId_idx" ON "VideoAudioTag"("tagId");

-- AddForeignKey
ALTER TABLE "VideoAudioTag" ADD CONSTRAINT "VideoAudioTag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAudioTag" ADD CONSTRAINT "VideoAudioTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
