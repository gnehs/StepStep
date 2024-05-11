FROM node:18.17.0-alpine as base

ENV PNPM_HOME="/var/lib/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache tzdata
ENV TZ=Asia/Taipei
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD pnpm start