# Default build: deploys onto Tesla Consulting's internal spa-host base image,
# so it needs `az acr login --name tesladev` first. For a build that needs no
# private registry at all, use docker/Dockerfile.nginx.
FROM node:24-alpine AS build
WORKDIR /src
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci
COPY . .
RUN npm run build

FROM tesladev.azurecr.io/build/spa-host:latest-alpine AS base
COPY --from=build /src/dist /app/wwwroot
