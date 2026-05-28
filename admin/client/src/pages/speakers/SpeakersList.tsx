import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, User2, ChevronDown, ChevronUp, Mail, Building2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { speakersApi } from '../../api/speakers'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { SpeakerForm } from './SpeakerForm'
import type { Speaker } from '../../types'

type BadgeVariant = 'cyan' | 'orange' | 'slate' | 'green' | 'yellow'

const roleColors: Record<Speaker['role'], BadgeVariant> = {
  keynote: 'cyan', panelist: 'orange', instructor: 'yellow', committee: 'slate',
}
const roleLabels: Record<Speaker['role'], string> = {
  keynote: 'Keynote', panelist: 'Panelista', instructor: 'Instructor', committee: 'Comité',
}
const roleOrder: Speaker['role'][] = ['keynote', 'panelist', 'instructor', 'committee']

function SpeakerCard({
  s, onEdit, onDelete,
}: { s: Speaker; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden hover:border-[#1E3A5F] transition-colors"
    >
      <div className="flex items-center gap-4 px-5 py-4 group">
        <div className="size-11 rounded-full bg-[#1E3A5F]/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {s.photoUrl
            ? <img src={s.photoUrl} alt={s.name} className="size-full object-cover" />
            : <User2 size={18} className="text-[#475569]" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-['Outfit'] font-semibold text-white truncate">{s.name}</p>
          {s.jobTitle && (
            <p className="text-[11px] font-['Outfit'] text-[#64748B] truncate">{s.jobTitle}</p>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {s.affiliation && (
              <span className="flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] text-[#475569]">
                <Building2 size={10} /> {s.affiliation}
              </span>
            )}
            {s.country && (
              <span className="flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] text-[#475569]">
                <Globe size={10} /> {s.country}
              </span>
            )}
            {s.email && (
              <span className="flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] text-[#475569]">
                <Mail size={10} /> {s.email}
              </span>
            )}
          </div>
        </div>

        <Badge label={roleLabels[s.role]} variant={roleColors[s.role]} />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>

        {s.bio && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#94A3B8] transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && s.bio && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-0 border-t border-[#1E3A5F]/40">
              <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed mt-3">{s.bio}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function SpeakersList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Speaker | null>(null)

  const { data: speakers = [], isLoading } = useQuery({
    queryKey: ['speakers'],
    queryFn: speakersApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => speakersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['speakers'] }); toast.success('Speaker eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const grouped = speakers.reduce<Partial<Record<Speaker['role'], Speaker[]>>>((acc, s) => {
    (acc[s.role] ??= []).push(s)
    return acc
  }, {})

  return (
    <Layout
      title="Speakers"
      action={
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} size="sm">
          <Plus size={14} /> Nuevo speaker
        </Button>
      }
    >
      {isLoading ? <TableSkeleton /> : speakers.length === 0 ? (
        <div className="text-center py-24 text-[#475569] font-['Outfit'] text-sm">
          No hay speakers registrados
        </div>
      ) : (
        <div className="space-y-8">
          {roleOrder.filter(r => grouped[r]?.length).map(role => (
            <section key={role}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-widest">
                  {roleLabels[role]}s
                </h2>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] border border-[#1E3A5F]/40 rounded-full px-2 py-0.5">
                  {grouped[role]!.length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[role]!.map(s => (
                  <SpeakerCard
                    key={s._id}
                    s={s}
                    onEdit={() => { setEditing(s); setModalOpen(true) }}
                    onDelete={() => { if (confirm('¿Eliminar speaker?')) deleteMutation.mutate(s._id!) }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <SpeakerForm open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} speaker={editing} />
    </Layout>
  )
}
