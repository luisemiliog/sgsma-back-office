import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db/mongo.js'
import { requireRole } from '../middleware/auth.js'
import { config } from '../config.js'

const router = Router()
router.use(requireRole('admin'))

router.get('/', async (_req, res) => {
  const rows = await getDb()
    .collection('app_users')
    .aggregate([
      { $sort: { createdAt: -1 } },
      { $project: { passwordHash: 0 } },
      {
        $lookup: {
          from:         'user_profiles',
          localField:   '_id',
          foreignField: 'userId',
          as:           'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          email:     1,
          googleSub: 1,
          active:    1,
          createdAt: 1,
          name:  { $ifNull: ['$profile.name',  null] },
          qrUrl: { $ifNull: ['$profile.qrUrl', null] },
        },
      },
    ])
    .toArray()

  res.json(rows.map((u: any) => ({ ...u, _id: String(u._id) })))
})

router.post('/:id/send-reset', async (req, res) => {
  const user = await getDb()
    .collection('app_users')
    .findOne({ _id: new ObjectId(req.params.id) }, { projection: { email: 1, passwordHash: 1 } })

  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return }
  if (!user.passwordHash) {
    res.status(400).json({ error: 'Este usuario usa Google Sign-In y no tiene contraseña' })
    return
  }

  const response = await fetch(`${config.fastifyApiUrl}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email }),
  })

  if (!response.ok) {
    res.status(502).json({ error: 'Error al contactar el servicio de email' })
    return
  }

  res.json({ message: `Email de recuperación enviado a ${user.email}` })
})

router.put('/:id/qr', async (req, res) => {
  let oid: ObjectId
  try { oid = new ObjectId(req.params.id) } catch {
    res.status(400).json({ error: 'ID inválido' }); return
  }

  const { qrUrl } = req.body
  if (qrUrl !== null && typeof qrUrl !== 'string') {
    res.status(400).json({ error: 'qrUrl debe ser un string o null' }); return
  }

  const user = await getDb().collection('app_users').findOne({ _id: oid })
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return }

  await getDb().collection('user_profiles').updateOne(
    { userId: oid },
    { $set: { qrUrl: qrUrl ?? null, updatedAt: new Date().toISOString() } },
    { upsert: false },
  )

  res.json({ ok: true, qrUrl: qrUrl ?? null })
})

export default router
