# node:24-bookworm-slim は重大な脆弱性が報告されていたので使わなかった
# see: https://hub.docker.com/layers/library/node/24-bookworm-slim/images/sha256-b6300b33342c3775580dec007dc6751b7440b0aa02fdf66c1016710b75fc1df6
FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build

RUN mkdir /prod && cp -r ./frontend/dist /prod/frontend
RUN pnpm deploy --filter=backend --prod /prod/backend

FROM nginx:1.29.1-alpine AS frontend

COPY --from=build /prod/frontend /usr/share/nginx/html
RUN ls -la /usr/share/nginx/html

FROM base AS backend

COPY --from=build /prod/backend /prod/backend

WORKDIR /prod/backend

CMD [ "pnpm", "start" ]
