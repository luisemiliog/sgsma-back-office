import { MongoClient, type Db } from 'mongodb'
import { config } from '../config.js'

let client: MongoClient
let db: Db

export async function connectMongo() {
  client = new MongoClient(config.mongoUrl)
  await client.connect()
  db = client.db(config.dbName)
  console.log(`[mongo] connected to ${config.dbName}`)
}

export function getDb(): Db {
  if (!db) throw new Error('MongoDB not connected')
  return db
}

export const collections = {
  events: () => getDb().collection('events'),
  speakers: () => getDb().collection('speakers'),
  papers: () => getDb().collection('papers'),
  panels: () => getDb().collection('panels'),
  announcements: () => getDb().collection('announcements'),
  contentMeta: () => getDb().collection('content_meta'),
  adminUsers: () => getDb().collection('admin_users'),
  committees: () => getDb().collection('committees'),
}
