# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

# Run stage
FROM node:20-slim AS run
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --no-audit --no-fund
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
