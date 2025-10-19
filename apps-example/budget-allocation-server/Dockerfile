FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run demos:budget-allocation-server-build

EXPOSE 3000

CMD ["bun", "run", "demos:budget-allocation-server-start:prod"]
