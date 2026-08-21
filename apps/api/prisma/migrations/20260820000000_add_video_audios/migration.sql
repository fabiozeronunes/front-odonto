-- CreateTable
CREATE TABLE "VideoAudio" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoAudio_videoId_idx" ON "VideoAudio"("videoId");

-- AddForeignKey
ALTER TABLE "VideoAudio" ADD CONSTRAINT "VideoAudio_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep audioUrl/audioTitle for backward compatibility (deprecated)
-- Also add relation in Video model (via migration_lock.toml or schema update)
-- The schema.prisma needs to be updated manually to include VideoAudio relation
