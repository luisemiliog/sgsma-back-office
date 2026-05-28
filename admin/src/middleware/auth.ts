import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { isBlacklisted } from '../services/redis.js'
import type { JwtPayload, UserRole } from '../types/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3,
}

async function verifyToken(req: Request, res: Response): Promise<JwtPayload | null> {
  const token = req.cookies?.admin_token
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
    if (!payload.role || !(payload.role in ROLE_HIERARCHY)) throw new Error('Invalid role')
    if (await isBlacklisted(payload.jti)) throw new Error('Revoked')
    return payload
  } catch {
    res.clearCookie('admin_token')
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = await verifyToken(req, res)
  if (!payload) return
  req.user = payload
  next()
}

export function requireRole(minRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const payload = await verifyToken(req, res)
    if (!payload) return
    if (ROLE_HIERARCHY[payload.role] < ROLE_HIERARCHY[minRole]) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    req.user = payload
    next()
  }
}
