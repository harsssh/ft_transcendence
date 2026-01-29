FROM oven/bun:1 AS base
COPY ./package.json bun.lock /app/

FROM base AS development-dependencies-env
WORKDIR /app
RUN --mount=type=cache,target=/root/.bun/install/cache bun i --frozen-lockfile
COPY . /app/

FROM base AS production-dependencies-env
WORKDIR /app
RUN --mount=type=cache,target=/root/.bun/install/cache bun i --frozen-lockfile --omit dev

FROM base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN bun run build

FROM base AS migrate-env
COPY --from=build-env /app/drizzle.config.ts /app/drizzle.config.ts
COPY --from=build-env /app/db /app/db
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
CMD ["bun", "db:push"]

FROM base
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["bun",  "start"]