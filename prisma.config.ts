import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL || "prisma/dev.db";
const isPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl);

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: isPostgres ? "prisma/migrations-postgres" : "prisma/migrations",
        seed: "tsx prisma/seed.ts"
    },
    datasource: {
        url: databaseUrl
    }
});
