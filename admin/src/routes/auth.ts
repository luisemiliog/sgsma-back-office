import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config.js'
import { collections } from '../db/mongo.js'
import { addToBlacklist } from '../services/redis.js'
import { requireAdmin } from '../middleware/auth.js'
import type { JwtPayload } from '../types/index.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' })
    return
  }

  const userDoc = await collections.adminUsers().findOne({ username })
  if (!userDoc) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, userDoc.passwordHash as string)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const payload: JwtPayload = {
    sub: userDoc._id!.toString(),
    username: userDoc.username as string,
    role: userDoc.role as JwtPayload['role'],
    jti: uuidv4(),
  }
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtTtl })

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: !config.isDev,
    sameSite: 'lax',
    maxAge: config.jwtTtl * 1000,
  })

  res.json({
    ok: true,
    user: {
      _id: userDoc._id,
      username: userDoc.username,
      displayName: userDoc.displayName,
      email: userDoc.email,
      role: userDoc.role,
    },
  })
})

router.post('/logout', requireAdmin, async (req, res) => {
  const payload = req.user!
  const ttl = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : config.jwtTtl
  if (ttl > 0) await addToBlacklist(payload.jti, ttl)
  res.clearCookie('admin_token')
  res.json({ ok: true })
})

router.get('/me', requireAdmin, async (req, res) => {
  const userDoc = await collections.adminUsers().findOne(
    { username: req.user!.username },
    { projection: { passwordHash: 0 } }
  )
  res.json({ user: userDoc })
})

export default router
