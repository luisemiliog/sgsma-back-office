import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { collections } from '../db/mongo.js'
import { bumpContentVersion } from '../services/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import type { Speaker } from '../types/index.js'

const router = Router()
router.use(requireAdmin)

router.get('/', async (_req, res) => {
  const speakers = await collections.speakers().find({}).sort({ role: 1, name: 1 }).toArray()
  res.json(speakers)
})

router.get('/:id', async (req, res) => {
  const doc = await collections.speakers().findOne({ _id: new ObjectId(req.params.id) })
  if (!doc) { res.status(404).json({ error: 'Not found' }); return }
  res.json(doc)
})

router.post('/', async (req, res) => {
  const data = req.body as Speaker
  data.createdAt = new Date().toISOString()
  data.updatedAt = data.createdAt
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...insertData } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await collections.speakers().insertOne(insertData as any)
  await bumpContentVersion()
  res.status(201).json({ _id: result.insertedId, ...data })
})

router.put('/:id', async (req, res) => {
  const data = req.body as Partial<Speaker>
  data.updatedAt = new Date().toISOString()
  const { _id, ...update } = data
  const result = await collections.speakers().findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: update },
    { returnDocument: 'after' }
  )
  if (!result) { res.status(404).json({ error: 'Not found' }); return }
  await bumpContentVersion()
  res.json(result)
})

router.delete('/:id', async (req, res) => {
  const result = await collections.speakers().deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) { res.status(404).json({ error: 'Not found' }); return }
  await bumpContentVersion()
  res.json({ ok: true })
})

export default router
