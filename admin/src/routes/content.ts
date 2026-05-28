import { Router } from 'express'
import { randomUUID } from 'crypto'
import { collections } from '../db/mongo.js'
import { invalidateContentCache } from '../services/redis.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

router.post('/republish', async (_req, res) => {
  const hash = randomUUID().replace(/-/g, '')
  const updatedAt = new Date().toISOString()
  await collections.contentMeta().updateOne(
    {},
    { $set: { hash, updatedAt } },
    { upsert: true }
  )
  await invalidateContentCache()
  res.json({ ok: true, hash, updatedAt })
})

router.get('/meta', requireAdmin, async (_req, res) => {
  const meta = await collections.contentMeta().findOne({})
  res.json(meta ?? { hash: null, updatedAt: null })
})

export default router
