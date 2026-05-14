-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_url_key" ON "bookmarks"("userId", "url");
