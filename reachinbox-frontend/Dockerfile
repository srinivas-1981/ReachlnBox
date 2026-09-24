FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for Next.js build
RUN npm ci

# Copy configuration and source code
COPY tsconfig.json ./
COPY next.config.ts ./
COPY eslint.config.mjs ./
COPY src ./src

# Set build argument for public API URL (consumed at Next.js build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Build optimized Next.js production bundle
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled Next.js assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

# Start Next.js production server
CMD ["npm", "start"]
