FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

# PID 1 問題を回避する
ENV TINI_VERSION=v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini-static
RUN chmod +x /tini-static

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build

RUN mkdir /prod && cp -r ./frontend/dist /prod/frontend
RUN pnpm deploy --filter=backend --prod /prod/backend

FROM nginx:1.29.1-alpine AS frontend

COPY --from=build /prod/frontend /usr/share/nginx/html

FROM gcr.io/distroless/nodejs24-debian12:latest AS backend

COPY --from=build /prod/backend/dist /prod/backend/dist
COPY --from=build /prod/backend/node_modules /prod/backend/node_modules
COPY --from=build /prod/backend/.env /prod/backend/.env

COPY --from=build /tini-static /tini-static

WORKDIR /prod/backend

ENTRYPOINT [ "/tini-static" , "--", "/nodejs/bin/node" ]
CMD [ "--env-file=.env", "dist/index.js" ]
