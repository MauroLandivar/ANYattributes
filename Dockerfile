FROM node:20-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY python/requirements.txt ./python/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r ./python/requirements.txt

# Install Node dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build Next.js
# DATABASE_URL is only available at runtime; use a placeholder so Prisma schema
# validation passes during build. The real URL is injected by Railway at startup.
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN DATABASE_URL=$DATABASE_URL npx prisma generate
RUN DATABASE_URL=$DATABASE_URL npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# On startup: init DB, seed admin, then start app
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run seed && npm start"]
