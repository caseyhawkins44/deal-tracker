import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL bypasses the connection pooler for migrations (required by Supabase)
    // DATABASE_URL is the pooler URL used by the app at runtime
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
