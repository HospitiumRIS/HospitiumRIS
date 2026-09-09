/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Keep Prisma's native query engine out of the Turbopack bundle.
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Allow LAN / alternate host access during `next dev` (e.g. http://192.168.x.x:3001)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.0.110',
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || []),
  ],
};

export default nextConfig;
