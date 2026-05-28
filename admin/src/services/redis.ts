import Redis from 'ioredis'
import { randomUUID } from 'crypto'
import { config } from '../config.js'
import { collections } from '../db/mongo.js'

export let redis: Redis

export function connectRedis() {
  redis = new Redis(config.redisUrl, { lazyConnect: true })
  redis.on('error', (err) => console.warn('[redis] error:', err.message))
  redis.on('connect', () => console.log('[redis] connected'))
  return redis.connect().catch(() => console.warn('[redis] running without Redis'))
}

export async function invalidateScheduleCache(day?: number) {
  await redis.del('schedule:all')
  if (day !== undefined) await redis.del(`schedule:day:${day}`)
}

export async function invalidateContentCache() {
  await redis.del('content:version')
}

export async function bumpContentVersion() {
  const hash      = randomUUID().replace(/-/g, '')
  const updatedAt = new Date().toISOString()
  await collections.contentMeta().updateOne(
    {},
    { $set: { hash, updatedAt } },
    { upsert: true },
  )
  await redis.del('content:version')
}

export async function addToBlacklist(jti: string, ttl: number) {
  await redis.set(`blacklist:${jti}`, '1', 'EX', ttl)
}

export async function isBlacklisted(jti: string): Promise<boolean> {
  const val = await redis.get(`blacklist:${jti}`)
  return val === '1'
}
