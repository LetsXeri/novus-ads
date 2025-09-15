# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock tsconfig.json ./
COPY src ./src
RUN yarn install --frozen-lockfile
RUN yarn build  # erwartet "build": "tsc" im package.json

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
# Datenverzeichnis (für SQLite-Datei)
VOLUME ["/data"]
ENV PORT=4000
ENV DB_URL=/data/data.sqlite
ENV CORS_ORIGIN=http://localhost:5173
EXPOSE 4000
CMD ["node", "dist/index.js"]
