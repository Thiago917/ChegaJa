/*
  Warnings:

  - Added the required column `cep` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `shop` ADD COLUMN `branch` VARCHAR(191) NULL,
    ADD COLUMN `cep` VARCHAR(191) NOT NULL;
