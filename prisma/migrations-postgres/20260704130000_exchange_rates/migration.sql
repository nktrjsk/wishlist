-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "base" TEXT NOT NULL,
    "rates" TEXT NOT NULL,
    "ratesDate" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);
