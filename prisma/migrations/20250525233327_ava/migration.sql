/*
  Warnings:

  - Added the required column `postId` to the `Avaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nota" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "postId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
