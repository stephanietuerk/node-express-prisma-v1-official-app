import { PrismaClient } from '@prisma/client';

// Augment the global type so TS knows about globalThis.prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use the existing instance in dev, otherwise create a new one
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // log: ['query', 'error', 'warn'], // optional
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
