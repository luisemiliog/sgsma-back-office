import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db/mongo.js'
import { requireAdmin } from '../middleware/auth.js'
import { bumpContentVersion } from '../services/redis.js'

const router = Router()
router.use(requireAdmin)

const GROUP_ORDER = ['conference_leadership', 'technical_program', 'tutorial_panel', 'board', 'regional', 'local']
const GROUP_LABELS: Record<string, string> = {
  conference_leadership: 'Conference Leadership',
  technical_program:     'Technical Program Committee',
  tutorial_panel:        'Tutorial & Panel Coordination',
  board:                 'SGSMA Association Board',
  regional:              'Regional Organizing Committee',
  local:                 'Local Organizing Committee',
}

router.get('/', async (_req, res) => {
  const docs = await getDb().collection('committees').find({}).sort({ group: 1, order: 1 }).toArray()

  const byGroup = new Map<string, any[]>()
  for (const doc of docs) {
    if (!byGroup.has(doc.group)) byGroup.set(doc.group, [])
    byGroup.get(doc.group)!.push({
      _id:         String(doc._id),
      name:        doc.name,
      role:        doc.role ?? '',
      affiliation: doc.affiliation ?? '',
      country:     doc.country ?? '',
      order:       doc.order ?? 0,
      group:       doc.group,
    })
  }

  const result = GROUP_ORDER.map(g => ({
    group:   g,
    label:   GROUP_LABELS[g] ?? g,
    members: byGroup.get(g) ?? [],
  }))

  res.json(result)
})

router.post('/', async (req, res) => {
  const { group, name, role, affiliation, country } = req.body
  if (!group || !name) { res.status(400).json({ error: 'group and name are required' }); return }

  const last = await getDb().collection('committees')
    .find({ group }).sort({ order: -1 }).limit(1).toArray()
  const order = last.length > 0 ? (last[0].order ?? 0) + 1 : 1

  const doc = { group, name, role: role ?? '', affiliation: affiliation ?? '', country: country ?? '', order }
  const result = await getDb().collection('committees').insertOne(doc)
  await bumpContentVersion()
  res.status(201).json({ _id: String(result.insertedId), ...doc })
})

router.put('/:id', async (req, res) => {
  let oid: ObjectId
  try { oid = new ObjectId(req.params.id) } catch {
    res.status(400).json({ error: 'Invalid ID' }); return
  }

  const { group, name, role, affiliation, country, order } = req.body
  const update: Record<string, any> = {}
  if (group !== undefined)       update.group = group
  if (name !== undefined)        update.name = name
  if (role !== undefined)        update.role = role
  if (affiliation !== undefined) update.affiliation = affiliation
  if (country !== undefined)     update.country = country
  if (order !== undefined)       update.order = order

  const result = await getDb().collection('committees').updateOne({ _id: oid }, { $set: update })
  if (!result.matchedCount) { res.status(404).json({ error: 'Not found' }); return }

  await bumpContentVersion()
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  let oid: ObjectId
  try { oid = new ObjectId(req.params.id) } catch {
    res.status(400).json({ error: 'Invalid ID' }); return
  }

  const result = await getDb().collection('committees').deleteOne({ _id: oid })
  if (!result.deletedCount) { res.status(404).json({ error: 'Not found' }); return }

  await bumpContentVersion()
  res.json({ ok: true })
})

export default router
