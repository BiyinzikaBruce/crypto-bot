import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Loads .env.local for local dev — no-op if the file doesn't exist (e.g. Vercel)
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Only set datasource when DATABASE_URL is available.
  // prisma generate doesn't need a DB connection; prisma migrate does.
  ...(process.env.DATABASE_URL && {
    datasource: {
      url: process.env.DATABASE_URL,
    },
  }),
});
