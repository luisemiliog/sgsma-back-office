import { Router } from 'express'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { collections } from '../db/mongo.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

router.put('/', async (req, res) => {
  const { displayName, email, currentPassword, newPassword } = req.body as {
    displayName?: string
    email?: string
    currentPassword?: string
    newPassword?: string
  }

  const userDoc = await collections.adminUsers().findOne({ _id: new ObjectId(req.user!.sub) })
  if (!userDoc) { res.status(404).json({ error: 'User not found' }); return }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (displayName !== undefined) update.displayName = displayName
  if (email !== undefined) update.email = email

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: 'currentPassword required to set a new password' })
      return
    }
    const valid = await bcrypt.compare(currentPassword, userDoc.passwordHash as string)
    if (!valid) {
      res.status(401).json({ error: 'Current password incorrect' })
      return
    }
    update.passwordHash = await bcrypt.hash(newPassword, 10)
  }

  const result = await collections.adminUsers().findOneAndUpdate(
    { _id: new ObjectId(req.user!.sub) },
    { $set: update },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  )
  res.json({ ok: true, user: result })
})

export default router
