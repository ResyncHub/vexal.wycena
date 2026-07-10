-- CreateEnum
CREATE TYPE "LamelaFinish" AS ENUM ('MALOWANA_RAL', 'DREWNOPODOBNA');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('RAMA', 'DRZWI_PRZESUWNE_GORNY', 'DRZWI_PRZESUWNE_DOLNY');

-- CreateEnum
CREATE TYPE "OkucieMaterial" AS ENUM ('ALUMINIOWE', 'PLASTIKOWE');

-- CreateEnum
CREATE TYPE "FixedPartCode" AS ENUM ('SLIDING_CARRIAGE_SET', 'SLIDING_GUIDE_ROLLER');

-- CreateEnum
CREATE TYPE "LamelaOrientation" AS ENUM ('POZIOMO', 'PIONOWO');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('STALY', 'JEZDNY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LamelaPriceTier" (
    "id" TEXT NOT NULL,
    "finish" "LamelaFinish" NOT NULL,
    "lengthCm" INTEGER NOT NULL,
    "priceNetPln" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LamelaPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePriceTier" (
    "id" TEXT NOT NULL,
    "profileType" "ProfileType" NOT NULL,
    "lengthCm" INTEGER NOT NULL,
    "priceNetPln" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OkucieSetPrice" (
    "id" TEXT NOT NULL,
    "material" "OkucieMaterial" NOT NULL,
    "priceNetPln" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OkucieSetPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedPricePart" (
    "id" TEXT NOT NULL,
    "code" "FixedPartCode" NOT NULL,
    "label" TEXT NOT NULL,
    "priceNetPln" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedPricePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageLookupRow" (
    "id" TEXT NOT NULL,
    "orientation" "LamelaOrientation" NOT NULL,
    "coverageCm" DECIMAL(6,1) NOT NULL,
    "lamelCount" INTEGER NOT NULL,
    "uchwytSets" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverageLookupRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "nip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bankAccount" TEXT,
    "logoUrl" TEXT,
    "footerTerms" TEXT,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 14,
    "defaultMarkupPercent" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "defaultInstallationPln" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quoteNumberPrefix" TEXT NOT NULL DEFAULT 'WYC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "nip" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT,
    "validUntil" TIMESTAMP(3),
    "discountPercent" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "installationPln" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "totalCostPln" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPricePln" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteOpening" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "widthCm" DECIMAL(6,1) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "slidingTopProfileLengthCm" INTEGER,
    "slidingBottomProfileLengthCm" INTEGER,
    "slidingRailCostNetPln" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteModule" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "ModuleType" NOT NULL,
    "widthCm" DECIMAL(6,1) NOT NULL,
    "heightCm" DECIMAL(6,1) NOT NULL,
    "orientation" "LamelaOrientation" NOT NULL,
    "finish" "LamelaFinish" NOT NULL,
    "ralColor" TEXT,
    "okucieMaterial" "OkucieMaterial" NOT NULL,
    "lamelCount" INTEGER NOT NULL,
    "lamelLengthCm" INTEGER NOT NULL,
    "uchwytSets" INTEGER NOT NULL,
    "frameWidthProfileLengthCm" INTEGER NOT NULL,
    "frameHeightProfileLengthCm" INTEGER NOT NULL,
    "costBreakdownJson" JSONB NOT NULL,
    "costNetPln" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LamelaPriceTier_finish_lengthCm_key" ON "LamelaPriceTier"("finish", "lengthCm");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePriceTier_profileType_lengthCm_key" ON "ProfilePriceTier"("profileType", "lengthCm");

-- CreateIndex
CREATE UNIQUE INDEX "OkucieSetPrice_material_key" ON "OkucieSetPrice"("material");

-- CreateIndex
CREATE UNIQUE INDEX "FixedPricePart_code_key" ON "FixedPricePart"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CoverageLookupRow_orientation_coverageCm_key" ON "CoverageLookupRow"("orientation", "coverageCm");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteOpening" ADD CONSTRAINT "QuoteOpening_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteModule" ADD CONSTRAINT "QuoteModule_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "QuoteOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
