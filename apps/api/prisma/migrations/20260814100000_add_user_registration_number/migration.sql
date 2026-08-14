-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registrationNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationNumber_key" ON "User"("registrationNumber");
