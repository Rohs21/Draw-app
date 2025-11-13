import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use process.env instead of env(), since env() reads before .env is loaded
    url: process.env.DATABASE_URL || "",
  },
});
