function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

export const config = {
  port: parseInt(process.env.PORT ?? '3002', 10),
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://localhost:27017',
  dbName: process.env.DB_NAME ?? 'sgsma2026',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret_change_in_prod',
  jwtTtl: parseInt(process.env.JWT_TTL ?? '28800', 10),
  adminUser: process.env.ADMIN_USER ?? 'admin',
  adminPassHash: process.env.ADMIN_PASS_HASH ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3002',
  uploadsDir: process.env.UPLOADS_DIR ?? '/app/uploads',
  fastifyApiUrl: process.env.FASTIFY_API_URL ?? 'http://localhost:8191',
}
