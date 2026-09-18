/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "Session_sessionToken_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descRu" TEXT,
    "descUz" TEXT,
    "descEn" TEXT,
    "priceUzs" INTEGER NOT NULL,
    "oldPriceUzs" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "specs" TEXT NOT NULL DEFAULT '{}',
    "socket" TEXT,
    "formFactor" TEXT,
    "chipset" TEXT,
    "memoryType" TEXT,
    "memorySlots" INTEGER,
    "memoryGb" INTEGER,
    "memoryMhz" INTEGER,
    "memorySticks" INTEGER,
    "tdpW" INTEGER,
    "wattage" INTEGER,
    "lengthMm" INTEGER,
    "heightMm" INTEGER,
    "vramGb" INTEGER,
    "coreCount" INTEGER,
    "boostGhz" REAL,
    "storageGb" INTEGER,
    "storageType" TEXT,
    "coolerType" TEXT,
    "coolerTdpW" INTEGER,
    "radiatorMm" INTEGER,
    "has12vhpwr" BOOLEAN,
    "m2Slots" INTEGER,
    "sataPorts" INTEGER,
    "pcieVersion" TEXT,
    "supportsFormFactors" TEXT,
    "supportsRadiators" TEXT,
    "supportsSockets" TEXT,
    "gpuScore" REAL,
    "cpuScore" REAL,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("boostGhz", "brand", "category", "chipset", "coolerTdpW", "coolerType", "coreCount", "cpuScore", "createdAt", "descEn", "descRu", "descUz", "formFactor", "gpuScore", "has12vhpwr", "heightMm", "id", "images", "isActive", "kind", "lengthMm", "m2Slots", "memoryGb", "memoryMhz", "memorySlots", "memorySticks", "memoryType", "model", "nameEn", "nameRu", "nameUz", "oldPriceUzs", "pcieVersion", "priceUzs", "radiatorMm", "sataPorts", "slug", "socket", "specs", "stock", "storageGb", "storageType", "supportsFormFactors", "supportsRadiators", "supportsSockets", "tdpW", "updatedAt", "vramGb", "wattage") SELECT "boostGhz", "brand", "category", "chipset", "coolerTdpW", "coolerType", "coreCount", "cpuScore", "createdAt", "descEn", "descRu", "descUz", "formFactor", "gpuScore", "has12vhpwr", "heightMm", "id", "images", "isActive", "kind", "lengthMm", "m2Slots", "memoryGb", "memoryMhz", "memorySlots", "memorySticks", "memoryType", "model", "nameEn", "nameRu", "nameUz", "oldPriceUzs", "pcieVersion", "priceUzs", "radiatorMm", "sataPorts", "slug", "socket", "specs", "stock", "storageGb", "storageType", "supportsFormFactors", "supportsRadiators", "supportsSockets", "tdpW", "updatedAt", "vramGb", "wattage" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_kind_category_isActive_idx" ON "Product"("kind", "category", "isActive");
CREATE INDEX "Product_category_priceUzs_idx" ON "Product"("category", "priceUzs");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");
