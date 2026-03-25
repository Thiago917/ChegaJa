/*
  Warnings:

  - A unique constraint covering the columns `[pickupCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deliveryCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `deliveryCode` VARCHAR(191) NULL,
    ADD COLUMN `pickupCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_pickupCode_key` ON `Order`(`pickupCode`);

-- CreateIndex
CREATE UNIQUE INDEX `Order_deliveryCode_key` ON `Order`(`deliveryCode`);
