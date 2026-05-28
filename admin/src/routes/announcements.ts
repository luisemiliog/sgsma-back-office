import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { collections } from '../db/mongo.js'
import { requireAdmin } from '../middleware/auth.js'
import { bumpContentVersion } from '../services/redis.js'
import type { Announcement } from '../types/index.js'

const router = Router()
router.use(requireAdmin)

router.get('/', async (_req, res) => {
  const docs = await collections.announcements().find({}).sort({ createdAt: -1 }).toArray()
  res.json(docs)
})

router.post('/', async (req, res) => {
  const data = req.body as Announcement
  data.createdAt = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...insertData } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await collections.announcements().insertOne(insertData as any)
  const doc = { _id: result.insertedId, ...insertData }
  await bumpContentVersion()
  res.status(201).json(doc)
})

router.delete('/:id', async (req, res) => {
  const result = await collections.announcements().deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) { res.status(404).json({ error: 'Not found' }); return }
  await bumpContentVersion()
  res.json({ ok: true })
})

export default router
