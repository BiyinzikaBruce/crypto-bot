import { defineConfig } from "prisma/config";

// DATABASE_URL is only needed for migrate, not for generate.
// Spreading conditionally prevents Prisma from rejecting the config
// when DATABASE_URL isn't available (e.g. during Vercel's build step).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(process.env.DATABASE_URL && {
    datasource: {
      url: process.env.DATABASE_URL,
    },
  }),
});
