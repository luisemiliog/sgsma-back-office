import { Router } from 'express'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { collections } from '../db/mongo.js'
import { requireRole } from '../middleware/auth.js'
import type { AdminUserDoc } from '../types/index.js'

const router = Router()
router.use(requireRole('super_admin'))

router.get('/', async (_req, res) => {
  const users = await collections.adminUsers()
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray()
  res.json(users)
})

router.post('/', async (req, res) => {
  const { username, password, role, displayName, email } = req.body as AdminUserDoc & { password: string }

  if (!username || !password || !role) {
    res.status(400).json({ error: 'username, password and role required' })
    return
  }

  const exists = await collections.adminUsers().findOne({ username })
  if (exists) {
    res.status(409).json({ error: 'Username already taken' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()
  const result = await collections.adminUsers().insertOne({
    username, passwordHash, role, displayName, email,
    createdAt: now, updatedAt: now,
  } as Parameters<ReturnType<typeof collections.adminUsers>['insertOne']>[0])

  res.status(201).json({ _id: result.insertedId, username, role, displayName, email, createdAt: now })
})

router.put('/:id', async (req, res) => {
  const { password, role, displayName, email } = req.body as Partial<AdminUserDoc> & { password?: string }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (role) update.role = role
  if (displayName !== undefined) update.displayName = displayName
  if (email !== undefined) update.email = email
  if (password) update.passwordHash = await bcrypt.hash(password, 10)

  const result = await collections.adminUsers().findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: update },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  )
  if (!result) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result)
})

router.delete('/:id', async (req, res) => {
  const result = await collections.adminUsers().deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) { res.status(404).json({ error: 'Not found' }); return }
  res.json({ ok: true })
})

export default router
