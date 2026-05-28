import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { config } from './config.js'
import { connectMongo } from './db/mongo.js'
import { seedInitialAdmin } from './db/seed.js'
import { connectRedis } from './services/redis.js'
import authRouter from './routes/auth.js'
import eventsRouter from './routes/events.js'
import speakersRouter from './routes/speakers.js'
import papersRouter from './routes/papers.js'
import panelsRouter from './routes/panels.js'
import announcementsRouter from './routes/announcements.js'
import contentRouter from './routes/content.js'
import usersRouter from './routes/users.js'
import appUsersRouter from './routes/appUsers.js'
import ratingsRouter from './routes/ratings.js'
import committeesRouter from './routes/committees.js'
import profileRouter from './routes/profile.js'
import uploadsRouter from './routes/uploads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
mkdirSync(config.uploadsDir, { recursive: true })
const app = express()

app.use(cors({
  origin: config.isDev ? 'http://localhost:5173' : false,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(config.uploadsDir))
app.use('/api/uploads', uploadsRouter)
app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/speakers', speakersRouter)
app.use('/api/papers', papersRouter)
app.use('/api/panels', panelsRouter)
app.use('/api/announcements', announcementsRouter)
app.use('/api/content', contentRouter)
app.use('/api/users', usersRouter)
app.use('/api/app-users', appUsersRouter)
app.use('/api/ratings', ratingsRouter)
app.use('/api/committees', committeesRouter)
app.use('/api/profile', profileRouter)

if (!config.isDev) {
  const clientDist = path.join(__dirname, '../client/dist')
  app.use(express.static(clientDist))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

async function start() {
  await connectMongo()
  await seedInitialAdmin()
  await connectRedis()
  app.listen(config.port, () => {
    console.log(`[admin] running on :${config.port}`)
  })
}

start().catch(console.error)
