import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, FileText, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { papersApi } from '../../api/papers'
import { eventsApi } from '../../api/events'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { PaperForm } from './PaperForm'
import type { Paper } from '../../types'

function authorsDisplay(authors: string[] | string | undefined): string {
  if (!authors) return '—'
  if (Array.isArray(authors)) return authors.join(', ')
  return authors
}

function PaperCard({
  paper, onEdit, onDelete,
}: { paper: Paper; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasExtra = !!(paper.abstract || (paper.keywords && paper.keywords.length > 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden hover:border-[#1E3A5F] transition-colors"
    >
      <div className="flex items-start gap-4 px-5 py-4 group">
        <FileText size={15} className="text-[#1E3A5F] mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {paper.paperId && (
              <span className="text-[9px] font-['JetBrains_Mono'] text-[#00D9B8] border border-[#00D9B8]/30 rounded px-1.5 py-0.5 flex-shrink-0">
                {paper.paperId}
              </span>
            )}
            <p className="text-sm font-['Outfit'] font-semibold text-white leading-snug">{paper.title}</p>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Users size={10} className="text-[#475569] flex-shrink-0" />
            <p className="text-[11px] font-['JetBrains_Mono'] text-[#94A3B8]">
              {authorsDisplay(paper.authors)}
            </p>
          </div>

          {paper.institution && (
            <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] mt-0.5">{paper.institution}</p>
          )}
        </div>

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

        {hasExtra && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#94A3B8] transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasExtra && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-[#1E3A5F]/40 space-y-3 pt-3">
              {paper.abstract && (
                <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed">{paper.abstract}</p>
              )}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {paper.keywords.map(k => (
                    <span key={k} className="text-[9px] font-['JetBrains_Mono'] text-[#475569] border border-[#1E3A5F]/40 rounded px-1.5 py-0.5">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function PapersList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Paper | null>(null)

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ['papers'],
    queryFn: papersApi.list,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => papersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Paper eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const eventTitleById = new Map(events.map(e => [e._id!, e.title]))

  const grouped = papers.reduce<Record<string, Paper[]>>((acc, p) => {
    const key = p.sessionId
      ? (eventTitleById.get(p.sessionId) ?? `Sesión ${p.sessionId.slice(-6)}`)
      : 'Sin sesión asignada'
    ;(acc[key] ??= []).push(p)
    return acc
  }, {})

  const sortedSessions = Object.keys(grouped).sort((a, b) =>
    a === 'Sin sesión asignada' ? 1 : b === 'Sin sesión asignada' ? -1 : a.localeCompare(b)
  )

  return (
    <Layout
      title="Papers"
      action={
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} size="sm">
          <Plus size={14} /> Nuevo paper
        </Button>
      }
    >
      {isLoading ? <TableSkeleton /> : papers.length === 0 ? (
        <div className="text-center py-24 text-[#475569] font-['Outfit'] text-sm">
          No hay papers registrados
        </div>
      ) : (
        <div className="space-y-8">
          {sortedSessions.map(session => (
            <section key={session}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-widest">
                  {session}
                </span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] border border-[#1E3A5F]/40 rounded-full px-2 py-0.5">
                  {grouped[session].length} {grouped[session].length === 1 ? 'paper' : 'papers'}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[session].map(paper => (
                  <PaperCard
                    key={paper._id}
                    paper={paper}
                    onEdit={() => { setEditing(paper); setModalOpen(true) }}
                    onDelete={() => { if (confirm('¿Eliminar paper?')) deleteMutation.mutate(paper._id!) }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <PaperForm open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} paper={editing} />
    </Layout>
  )
}
