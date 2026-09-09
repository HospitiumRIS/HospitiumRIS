import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

let connecting = globalForPrisma.prismaConnecting || null;

/**
 * Prisma 6 can throw "Engine is not yet connected" if queries race the
 * first engine startup, or if a request handler called $disconnect().
 * Await this before querying so the engine is ready.
 */
export async function ensurePrismaConnected() {
  if (!connecting) {
    connecting = prisma.$connect().catch((error) => {
      connecting = null;
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prismaConnecting = null;
      }
      throw error;
    });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prismaConnecting = connecting;
    }
  }

  await connecting;
  return prisma;
}

ensurePrismaConnected().catch((error) => {
  console.error('Failed to connect Prisma client:', error);
});

export default prisma;
