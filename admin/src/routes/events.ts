import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { collections } from '../db/mongo.js'
import { invalidateScheduleCache, bumpContentVersion } from '../services/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import type { Event } from '../types/index.js'

const router = Router()
router.use(requireAdmin)

function toObjectId(id: string): ObjectId | null {
  try { return new ObjectId(id) } catch { return null }
}

router.get('/full', async (_req, res) => {
  const events = await collections.events().find({}).sort({ day: 1, startTime: 1 }).toArray()

  const allSpeakerIds = [...new Set(events.flatMap(e => (e.speakerIds as string[] | undefined) ?? []))]
  const allPaperIds = [...new Set(events.flatMap(e => (e.paperIds as string[] | undefined) ?? []))]

  const speakersById = new Map<string, unknown>()
  const papersById = new Map<string, unknown>()

  if (allSpeakerIds.length) {
    const ids = allSpeakerIds.map(toObjectId).filter(Boolean) as ObjectId[]
    const speakers = await collections.speakers().find({ _id: { $in: ids } }).toArray()
    speakers.forEach(s => speakersById.set(s._id.toString(), s))
  }

  if (allPaperIds.length) {
    const ids = allPaperIds.map(toObjectId).filter(Boolean) as ObjectId[]
    const papers = await collections.papers().find({ _id: { $in: ids } }).toArray()
    papers.forEach(p => papersById.set(p._id.toString(), p))
  }

  const result = events.map(e => ({
    ...e,
    speakers: ((e.speakerIds as string[] | undefined) ?? [])
      .map(id => speakersById.get(id.toString()))
      .filter(Boolean),
    papers: ((e.paperIds as string[] | undefined) ?? [])
      .map(id => papersById.get(id.toString()))
      .filter(Boolean),
  }))

  res.json(result)
})

router.get('/', async (_req, res) => {
  const events = await collections.events().find({}).sort({ day: 1, startTime: 1 }).toArray()
  res.json(events)
})

router.get('/:id', async (req, res) => {
  const oid = toObjectId(req.params.id)
  if (!oid) { res.status(400).json({ error: 'Invalid id' }); return }
  const event = await collections.events().findOne({ _id: oid })
  if (!event) { res.status(404).json({ error: 'Not found' }); return }
  res.json(event)
})

router.post('/', async (req, res) => {
  const data = req.body as Event
  data.createdAt = new Date().toISOString()
  data.updatedAt = data.createdAt
  const { _id, ...insertData } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await collections.events().insertOne(insertData as any)
  await invalidateScheduleCache(data.day)
  await bumpContentVersion()
  res.status(201).json({ _id: result.insertedId, ...data })
})

router.put('/:id', async (req, res) => {
  const oid = toObjectId(req.params.id)
  if (!oid) { res.status(400).json({ error: 'Invalid id' }); return }
  const data = req.body as Partial<Event>
  data.updatedAt = new Date().toISOString()
  const { _id, ...update } = data
  const result = await collections.events().findOneAndUpdate(
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
  const event = await collections.events().findOne({ _id: oid })
  if (!event) { res.status(404).json({ error: 'Not found' }); return }
  await collections.events().deleteOne({ _id: oid })
  await invalidateScheduleCache(event.day as number)
  await bumpContentVersion()
  res.json({ ok: true })
})

export default router
