# Pinned bases — never floating tags. A floating `node:lts-alpine` drifted to
# Alpine 3.23 and crash-looped the api's Prisma engine (stellar-compose ADR-0001);
# don't "tidy" these back to floating. Node 22 matches package.json `engines`.
# Bump deliberately via a reviewed PR, not by drift.
FROM node:22-alpine3.23 AS build

WORKDIR /usr/src/stellar-ui

COPY . .

RUN npm ci

RUN npm run build

FROM nginx:1.31.2-alpine3.23

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/stellar-ui/dist /usr/share/nginx/html

EXPOSE 80
