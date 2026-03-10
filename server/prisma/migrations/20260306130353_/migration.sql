/*
  Warnings:

  - Made the column `branch` on table `shop` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `shop` ADD COLUMN `photo` VARCHAR(191) NULL,
    MODIFY `branch` VARCHAR(191) NOT NULL;
