-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "inviteCode" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
