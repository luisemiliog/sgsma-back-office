import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAdmin } from '../middleware/auth.js'
import { config } from '../config.js'

const storage = multer.diskStorage({
  destination: config.uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
})

const router = Router()
router.use(requireAdmin)

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' })
    return
  }
  const url = `${config.publicBaseUrl}/uploads/${req.file.filename}`
  res.json({ url })
})

export default router
