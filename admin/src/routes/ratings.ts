import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db/mongo.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

// Lista todos los eventos que tienen al menos una valoración, con su resumen
router.get('/', async (_req, res) => {
  const rows = await getDb().collection('ratings').aggregate([
    {
      $group: {
        _id:     '$eventId',
        average: { $avg: '$stars' },
        total:   { $sum: 1 },
        s1: { $sum: { $cond: [{ $eq: ['$stars', 1] }, 1, 0] } },
        s2: { $sum: { $cond: [{ $eq: ['$stars', 2] }, 1, 0] } },
        s3: { $sum: { $cond: [{ $eq: ['$stars', 3] }, 1, 0] } },
        s4: { $sum: { $cond: [{ $eq: ['$stars', 4] }, 1, 0] } },
        s5: { $sum: { $cond: [{ $eq: ['$stars', 5] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from:         'events',
        localField:   '_id',
        foreignField: '_id',
        as:           'event',
      },
    },
    { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
  ]).toArray()

  res.json(rows.map((r: any) => ({
    eventId:   String(r._id),
    title:     r.event?.title ?? 'Evento desconocido',
    type:      r.event?.type ?? null,
    day:       r.event?.day ?? null,
    average:   r.average != null ? Math.round(r.average * 10) / 10 : null,
    total:     r.total,
    breakdown: { 1: r.s1, 2: r.s2, 3: r.s3, 4: r.s4, 5: r.s5 },
  })))
})

// Valoraciones individuales de un evento (con nombre de usuario si existe)
router.get('/:eventId', async (req, res) => {
  let oid: ObjectId
  try { oid = new ObjectId(req.params.eventId) } catch {
    res.status(400).json({ error: 'ID inválido' }); return
  }

  const ratings = await getDb().collection('ratings').aggregate([
    { $match: { eventId: oid } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from:         'user_profiles',
        localField:   'userId',
        foreignField: 'userId',
        as:           'profile',
      },
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        stars:     1,
        comment:   1,
        createdAt: 1,
        userName:  { $ifNull: ['$profile.name', 'Anónimo'] },
      },
    },
  ]).toArray()

  res.json(ratings.map(r => ({ ...r, _id: String(r._id) })))
})

export default router
