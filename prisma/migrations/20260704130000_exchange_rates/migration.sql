-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "base" TEXT NOT NULL,
    "rates" TEXT NOT NULL,
    "ratesDate" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
