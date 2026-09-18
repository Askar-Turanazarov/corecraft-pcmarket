-- CreateTable
CREATE TABLE "Product" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "engine" TEXT,
    "genre" TEXT,
    "coverUrl" TEXT,
    "demandLow" REAL NOT NULL,
    "demandMedium" REAL NOT NULL,
    "demandHigh" REAL NOT NULL,
    "demandUltra" REAL NOT NULL,
    "cpuDemand" REAL NOT NULL,
    "vramLow" REAL NOT NULL,
    "vramMedium" REAL NOT NULL,
    "vramHigh" REAL NOT NULL,
    "vramUltra" REAL NOT NULL,
    "rtCost" REAL NOT NULL DEFAULT 1.6,
    "supportsRt" BOOLEAN NOT NULL DEFAULT false,
    "supportsUpscaling" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "telegramId" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Моя сборка',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuildItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BuildItem_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuildItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "itemsSnapshot" TEXT NOT NULL,
    "totalUzs" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "comment" TEXT,
    "telegramChargeId" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_kind_category_isActive_idx" ON "Product"("kind", "category", "isActive");

-- CreateIndex
CREATE INDEX "Product_category_priceUzs_idx" ON "Product"("category", "priceUzs");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_isActive_year_idx" ON "Game"("isActive", "year");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Build_shareId_key" ON "Build"("shareId");

-- CreateIndex
CREATE INDEX "Build_userId_idx" ON "Build"("userId");

-- CreateIndex
CREATE INDEX "BuildItem_productId_idx" ON "BuildItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildItem_buildId_productId_key" ON "BuildItem"("buildId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_telegramChargeId_key" ON "Order"("telegramChargeId");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
