import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { collections } from '../db/mongo.js'
import { invalidateScheduleCache, bumpContentVersion } from '../services/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import type { Panel } from '../types/index.js'

const router = Router()
router.use(requireAdmin)

function toObjectId(id: string): ObjectId | null {
  try { return new ObjectId(id) } catch { return null }
}

router.get('/', async (_req, res) => {
  const panels = await collections.panels().find({}).sort({ day: 1, startTime: 1 }).toArray()
  res.json(panels)
})

router.get('/:id', async (req, res) => {
  const oid = toObjectId(req.params.id)
  if (!oid) { res.status(400).json({ error: 'Invalid id' }); return }
  const panel = await collections.panels().findOne({ _id: oid })
  if (!panel) { res.status(404).json({ error: 'Not found' }); return }
  res.json(panel)
})

router.post('/', async (req, res) => {
  const data = req.body as Panel
  data.createdAt = new Date().toISOString()
  data.updatedAt = data.createdAt
  const { _id, ...insertData } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await collections.panels().insertOne(insertData as any)
  await invalidateScheduleCache(data.day)
  await bumpContentVersion()
  res.status(201).json({ _id: result.insertedId, ...data })
})

router.put('/:id', async (req, res) => {
  const oid = toObjectId(req.params.id)
  if (!oid) { res.status(400).json({ error: 'Invalid id' }); return }
  const data = req.body as Partial<Panel>
  data.updatedAt = new Date().toISOString()
  const { _id, ...update } = data
  const result = await collections.panels().findOneAndUpdate(
    { _id: oid },
    { $set: update },
    { returnDocument: 'after' }
  )
  if (!result) { res.status(404).json({ error: 'Not found' }); return }
  await invalidateScheduleCache(result.day as number)
  await bumpContentVersion()
  res.json(result)
})

router.delete('/:id', async (req, res) => {
  const oid = toObjectId(req.params.id)
  if (!oid) { res.status(400).json({ error: 'Invalid id' }); return }
  const panel = await collections.panels().findOne({ _id: oid })
  if (!panel) { res.status(404).json({ error: 'Not found' }); return }
  await collections.panels().deleteOne({ _id: oid })
  await invalidateScheduleCache(panel.day as number)
  await bumpContentVersion()
  res.json({ ok: true })
})

export default router
