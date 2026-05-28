import bcrypt from 'bcryptjs'
import { collections } from './mongo.js'
import { config } from '../config.js'

export async function seedInitialAdmin() {
  const count = await collections.adminUsers().countDocuments()
  if (count > 0) return

  if (!config.adminPassHash) {
    console.warn('[seed] ADMIN_PASS_HASH not set — skipping seed')
    return
  }

  await collections.adminUsers().insertOne({
    username: config.adminUser,
    passwordHash: config.adminPassHash,
    role: 'super_admin',
    displayName: 'Super Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  console.log(`[seed] created initial super_admin: ${config.adminUser}`)
}
