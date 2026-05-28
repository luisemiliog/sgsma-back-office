import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Clock, Layers, ChevronDown, ChevronUp, User2, Mic2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { panelsApi } from '../../api/panels'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { PanelForm } from './PanelForm'
import type { Panel } from '../../types'

const DAY_LABEL: Record<number, string> = {
  1: 'Día 1 · 1 jun',
  2: 'Día 2 · 2 jun',
  3: 'Día 3 · 3 jun',
  4: 'Día 4 · 4 jun',
}

function PanelCard({
  panel, onEdit, onDelete,
}: { panel: Panel; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden hover:border-[#1E3A5F] transition-colors"
    >
      <div className="flex items-center gap-3 px-5 py-4 group">
        <div className="flex-shrink-0 flex items-center gap-1 text-[#475569] text-xs font-['JetBrains_Mono'] w-[88px]">
          <Clock size={10} />
          <span>{panel.startTime}–{panel.endTime}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-['Outfit'] font-medium text-white truncate">{panel.title}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {panel.track != null && (
              <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                <Layers size={9} /> Track {panel.track}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
              <User2 size={9} /> Chair: {panel.chair.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
              <Mic2 size={9} /> {panel.panelists.length} panelista{panel.panelists.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          className="p-1.5 rounded-lg text-[#475569] hover:text-[#94A3B8] transition-colors flex-shrink-0"
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-2 border-t border-[#1E3A5F]/30 space-y-3">
              {panel.description && (
                <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed">{panel.description}</p>
              )}

              {/* Chair */}
              <div>
                <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] uppercase tracking-wider mb-1.5">Chair</p>
                <div className="flex items-start gap-2">
                  <User2 size={12} className="text-[#00D9B8] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-['Outfit'] text-[#94A3B8] font-medium">{panel.chair.name}</p>
                    {panel.chair.talkTitle && (
                      <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] italic">{panel.chair.talkTitle}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Panelists */}
              {panel.panelists.length > 0 && (
                <div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] uppercase tracking-wider mb-1.5">Panelistas</p>
                  <div className="space-y-2">
                    {panel.panelists.map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Mic2 size={11} className="text-[#FF6B35] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-['Outfit'] text-[#94A3B8]">{p.name}</p>
                          {p.talkTitle && (
                            <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] italic">{p.talkTitle}</p>
                          )}
                          {p.abstract && (
                            <p className="text-[10px] font-['Outfit'] text-[#475569] mt-0.5 leading-relaxed">{p.abstract}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function PanelsList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Panel | null>(null)

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ['panels'],
    queryFn: panelsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => panelsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['panels'] }); toast.success('Panel eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  const grouped = panels.reduce<Record<number, Panel[]>>((acc, p) => {
    ;(acc[p.day] ??= []).push(p)
    return acc
  }, {})

  return (
    <Layout
      title="Paneles"
      action={
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} size="sm">
          <Plus size={14} /> Nuevo panel
        </Button>
      }
    >
      {isLoading ? <TableSkeleton /> : panels.length === 0 ? (
        <div className="text-center py-24 text-[#475569] font-['Outfit'] text-sm">
          No hay paneles registrados
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, dayPanels]) => (
              <section key={day}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-widest">
                    {DAY_LABEL[Number(day)] ?? `Día ${day}`}
                  </h2>
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] border border-[#1E3A5F]/40 rounded-full px-2 py-0.5 ml-auto">
                    {dayPanels.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayPanels.map(panel => (
                    <PanelCard
                      key={panel._id}
                      panel={panel}
                      onEdit={() => { setEditing(panel); setModalOpen(true) }}
                      onDelete={() => { if (confirm('¿Eliminar panel?')) deleteMutation.mutate(panel._id!) }}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
      <PanelForm open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} panel={editing} />
    </Layout>
  )
}
