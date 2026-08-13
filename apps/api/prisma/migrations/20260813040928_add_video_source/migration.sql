-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('FRONTODONTUS', 'STUDENT');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "source" "VideoSource" NOT NULL DEFAULT 'FRONTODONTUS';
