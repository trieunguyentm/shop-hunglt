# Backend — Express + Prisma (build TypeScript, chạy production)
FROM node:20-bookworm-slim

# Prisma cần openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài deps (giữ cả devDeps để chạy prisma CLI + tsx seed)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Mã nguồn + sinh Prisma Client + build
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 4000

# Khi khởi động: áp migration → seed (idempotent) → chạy server đã build
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run db:seed || true) && node dist/server.js"]
