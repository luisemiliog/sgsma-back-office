import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Bell, Zap, ImagePlus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { announcementsApi } from '../../api/announcements'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import type { Announcement } from '../../types'

const schema = z.object({
  title: z.string().min(1, 'Requerido'),
  body: z.string().min(1, 'Requerido'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
})
type FormData = z.infer<typeof schema>

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Baja' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const priorityColors: Record<Announcement['priority'], 'slate' | 'cyan' | 'yellow' | 'orange'> = {
  low: 'slate', normal: 'cyan', high: 'yellow', urgent: 'orange',
}

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function Announcements() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Anuncio eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'normal' },
  })

  const createMutation = useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Anuncio publicado y enviado por MQTT')
      reset({ priority: 'normal', title: '', body: '' })
      setImageUrl(null)
      setShowForm(false)
    },
    onError: () => toast.error('Error al publicar'),
  })

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await announcementsApi.uploadImage(file)
      setImageUrl(url)
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(d: FormData) {
    createMutation.mutate({ ...d, ...(imageUrl ? { imageUrl } : {}) })
  }

  return (
    <Layout
      title="Anuncios"
      action={
        <Button onClick={() => setShowForm(v => !v)} size="sm" variant={showForm ? 'outline' : 'primary'}>
          <Plus size={14} /> Nuevo anuncio
        </Button>
      }
    >
      {/* Inline create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-[#0D1520] border border-[#FF6B35]/30 rounded-xl p-6 shadow-[0_0_30px_rgba(255,107,53,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-[#FF6B35]" />
                <span className="text-xs font-['JetBrains_Mono'] text-[#FF6B35] uppercase tracking-widest">
                  Publicar y enviar via MQTT
                </span>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input label="Título" placeholder="Cambio de sala en sesión A" error={errors.title?.message} {...register('title')} />
                  </div>
                  <Select label="Prioridad" options={priorityOptions} {...register('priority')} />
                </div>
                <Textarea label="Mensaje" placeholder="Texto del anuncio..." rows={3} error={errors.body?.message} {...register('body')} />

                {/* Image upload */}
                <div>
                  <p className="text-xs font-['Outfit'] text-[#64748B] mb-2">Imagen (opcional)</p>
                  {imageUrl ? (
                    <div className="relative inline-block">
                      <img src={imageUrl} alt="preview" className="h-32 rounded-lg object-cover border border-[#1E3A5F]" />
                      <button
                        type="button"
                        onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="absolute -top-2 -right-2 bg-[#FF6B35] rounded-full p-0.5 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#1E3A5F] text-[#475569] hover:border-[#FF6B35]/50 hover:text-[#FF6B35] transition-colors text-xs font-['Outfit'] disabled:opacity-50"
                    >
                      <ImagePlus size={14} />
                      {uploading ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" loading={createMutation.isPending} variant="primary">
                    <Bell size={14} /> Publicar anuncio
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? <TableSkeleton /> : announcements.length === 0 ? (
        <div className="text-center py-24 text-[#475569] font-['Outfit'] text-sm">
          No hay anuncios. Crea el primero para notificar a los asistentes.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {announcements.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-4 bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl px-5 py-4 hover:border-[#1E3A5F] transition-colors group"
              >
                <Bell size={15} className={`mt-0.5 flex-shrink-0 ${a.priority === 'urgent' ? 'text-[#FF6B35]' : 'text-[#475569]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-['Outfit'] font-medium text-white">{a.title}</p>
                    <Badge label={a.priority} variant={priorityColors[a.priority]} />
                  </div>
                  <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed">{a.body}</p>
                  {a.imageUrl && (
                    <img src={a.imageUrl} alt="" className="mt-2 h-24 rounded-lg object-cover border border-[#1E3A5F]/40" />
                  )}
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] mt-1.5">{formatTime(a.createdAt)}</p>
                </div>
                <button
                  onClick={() => { if (confirm('¿Eliminar anuncio?')) deleteMutation.mutate(a._id!) }}
                  className="p-2 rounded-lg text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Layout>
  )
}
