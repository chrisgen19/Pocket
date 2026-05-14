-- CreateIndex
CREATE INDEX "bookmarks_userId_createdAt_idx" ON "bookmarks"("userId", "createdAt" DESC);
