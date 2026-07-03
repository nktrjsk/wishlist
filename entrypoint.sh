export PROTOCOL_HEADER=x-forwarded-proto
export HOST_HEADER=x-forwarded-host
# SQLite is the zero-config default. Set DATABASE_URL to a postgres:// or
# postgresql:// connection string to opt in to an external Postgres database
# instead - see the README for details.
: "${DATABASE_URL:=file:/usr/src/app/data/prod.db}"
export DATABASE_URL
export PUBLIC_DEFAULT_CURRENCY=${DEFAULT_CURRENCY}
export BODY_SIZE_LIMIT=${MAX_IMAGE_SIZE:-5000000}

caddy start --config /usr/src/app/Caddyfile

# `prisma generate` looks for a project tsconfig.json, which extends
# ./.svelte-kit/tsconfig.json. That file is only ever created by
# `svelte-kit sync`, which isn't available in this production image (it's a
# dev-time dependency). A minimal stub satisfies the lookup without changing
# how the app itself is typechecked/built.
mkdir -p .svelte-kit && \
[ -f .svelte-kit/tsconfig.json ] || echo '{"compilerOptions":{}}' > .svelte-kit/tsconfig.json && \
# Rewrite the schema's datasource provider to match DATABASE_URL, then
# regenerate the Prisma Client so it matches the active provider. The
# running server intentionally loads this client at runtime rather than
# bundling it (see src/lib/server/prisma.ts), so this regeneration takes
# effect.
node scripts/set-db-provider.mjs && \
pnpm prisma generate && \
pnpm prisma migrate deploy && \
pnpm prisma db seed && \
pnpm db:patch && \
pnpm start