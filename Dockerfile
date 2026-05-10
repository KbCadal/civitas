FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm generate

FROM nginx:1.27-alpine AS runner

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
