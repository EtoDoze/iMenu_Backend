/*
  Warnings:

  - You are about to drop the column `Etoken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "Etoken",
ADD COLUMN     "EToken" TEXT;
