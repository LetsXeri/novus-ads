# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY tsconfig*.json vite.config.ts ./
COPY index.html ./
COPY src ./src
# .env.production wird zur Buildzeit verwendet
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn install --frozen-lockfile
RUN yarn build

# --- Nginx serve stage ---
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
# NGINX-Konfiguration für /api -> Backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
