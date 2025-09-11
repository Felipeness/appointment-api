FROM oven/bun:1 as base
WORKDIR /usr/src/app

COPY package.json bun.lockb ./

FROM base as install
RUN bun install --frozen-lockfile

FROM base as prerelease
COPY --from=install /usr/src/app/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM base as release
COPY --from=install /usr/src/app/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist dist
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/prisma ./prisma

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "start:prod"]