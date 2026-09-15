-- CreateTable
CREATE TABLE IF NOT EXISTS "Passkey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" BLOB NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "lastUsedAt" INTEGER,
    CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Passkey_userId_idx" ON "Passkey"("userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasskeyChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ceremony" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" INTEGER NOT NULL,
    CONSTRAINT "PasskeyChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasskeyChallenge_expiresAt_idx" ON "PasskeyChallenge"("expiresAt");
