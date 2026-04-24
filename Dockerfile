FROM node:lts-alpine AS build

WORKDIR /usr/src/stellar-ui

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/stellar-ui/dist /usr/share/nginx/html

EXPOSE 80
