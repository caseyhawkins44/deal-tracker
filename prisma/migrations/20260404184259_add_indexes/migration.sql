-- CreateIndex
CREATE INDEX "ActivityLog_dealId_idx" ON "ActivityLog"("dealId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_dealId_idx" ON "Comment"("dealId");

-- CreateIndex
CREATE INDEX "Deal_addedById_idx" ON "Deal"("addedById");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");

-- CreateIndex
CREATE INDEX "Vote_dealId_idx" ON "Vote"("dealId");
