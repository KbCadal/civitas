FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable \
  && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm exec nuxt prepare \
  && pnpm run build:icons

RUN pnpm build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
