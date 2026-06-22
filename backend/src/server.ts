import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  const app = createApp();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API đang chạy tại http://localhost:${env.port}/api (env: ${env.nodeEnv})`);
  });

  // Tắt server gọn gàng
  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} nhận được — đang tắt server...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Không thể khởi động server:', err);
  process.exit(1);
});
