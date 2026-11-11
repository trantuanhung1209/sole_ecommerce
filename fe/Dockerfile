# Frontend Dockerfile with hot reload
FROM node:22

WORKDIR /app

# Copy package manifests first for better caching
COPY package.json pnpm-lock.yaml ./

# Enable corepack and install dependencies via pnpm (pinned in package.json)
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server with hot reload on port 5173
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


