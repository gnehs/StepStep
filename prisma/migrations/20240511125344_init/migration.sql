/*
  Warnings:

  - A unique constraint covering the columns `[userId,timestamp]` on the table `Record` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Record_userId_timestamp_key" ON "Record"("userId", "timestamp");
