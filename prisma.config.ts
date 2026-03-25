
import { defineConfig, env } from "prisma/config";

// dotenv loaded by Next.js in dev, Docker provides env vars in production

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
