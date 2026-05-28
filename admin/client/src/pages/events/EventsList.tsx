import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Clock, MapPin, User2, FileText,
  ChevronDown, ChevronUp, Layers,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { eventsApi } from '../../api/events'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EventForm } from './EventForm'
import type { Event, EventType } from '../../types'

type BadgeVariant = 'cyan' | 'orange' | 'slate' | 'green' | 'yellow'

const TYPE_COLOR: Record<EventType, BadgeVariant> = {
  keynote: 'cyan',
  panel: 'orange',
  paper_session: 'green',
  tutorial: 'yellow',
  townhall: 'yellow',
  workshop: 'yellow',
  ceremony: 'cyan',
  break: 'slate',
  registration: 'slate',
  sponsor: 'slate',
  social: 'orange',
}

const TYPE_LABEL: Record<EventType, string> = {
  keynote: 'Keynote',
  panel: 'Panel',
  paper_session: 'Papers',
  tutorial: 'Tutorial',
  townhall: 'Townhall',
  workshop: 'Workshop',
  ceremony: 'Ceremonia',
  break: 'Pausa',
  registration: 'Registro',
  sponsor: 'Sponsor',
  social: 'Social',
}

const DAY_DATE: Record<number, string> = {
  1: '1 jun · Workshops & tutoriales',
  2: '2 jun · Apertura, Keynotes, Panels',
  3: '3 jun · Paper Sessions, Keynote, Cena',
  4: '4 jun · Panels, Keynote, Clausura',
}

function EventCard({
  event, onEdit, onDelete,
}: { event: Event; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const hasSpeakers = (event.speakers?.length ?? 0) > 0
  const hasPapers = (event.papers?.length ?? 0) > 0
  const hasDetails = hasSpeakers || hasPapers || !!event.description

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden hover:border-[#1E3A5F] transition-colors group"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Time */}
        <div className="w-[88px] flex-shrink-0 flex items-center gap-1 text-[#475569] text-xs font-['JetBrains_Mono']">
          <Clock size={10} />
          <span>{event.startTime}–{event.endTime}</span>
        </div>

        {/* Title + location */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-['Outfit'] font-medium text-white truncate">{event.title}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {event.location && (
              <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                <MapPin size={9} /> {event.location}
              </span>
            )}
            {event.track != null && (
              <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                <Layers size={9} /> Track {event.track}
              </span>
            )}
            {hasSpeakers && (
              <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                <User2 size={9} /> {event.speakers!.length} speaker{event.speakers!.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasPapers && (
              <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                <FileText size={9} /> {event.papers!.length} paper{event.papers!.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <Badge label={TYPE_LABEL[event.type]} variant={TYPE_COLOR[event.type]} />

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Expand toggle */}
        {hasDetails && (
          <button
            onClick={() => setOpen(v => !v)}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#94A3B8] transition-colors flex-shrink-0"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-[#1E3A5F]/30 space-y-3">
              {event.description && (
                <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed">{event.description}</p>
              )}

              {hasSpeakers && (
                <div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] uppercase tracking-wider mb-1.5">Speakers</p>
                  <div className="space-y-1">
                    {event.speakers!.map(s => (
                      <div key={s._id} className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-[#1E3A5F]/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {s.photoUrl
                            ? <img src={s.photoUrl} alt={s.name} className="size-full object-cover" />
                            : <User2 size={11} className="text-[#475569]" />
                          }
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-['Outfit'] text-[#94A3B8]">{s.name}</span>
                          {s.affiliation && (
                            <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569] ml-2">· {s.affiliation}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasPapers && (
                <div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] uppercase tracking-wider mb-1.5">Papers</p>
                  <div className="space-y-1">
                    {event.papers!.map(p => (
                      <div key={p._id} className="flex items-start gap-2">
                        <FileText size={11} className="text-[#1E3A5F] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          {p.paperId && (
                            <span className="text-[9px] font-['JetBrains_Mono'] text-[#00D9B8] mr-1.5">{p.paperId}</span>
                          )}
                          <span className="text-xs font-['Outfit'] text-[#94A3B8] leading-snug">{p.title}</span>
                          {p.authors?.length > 0 && (
                            <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] mt-0.5">{p.authors.join(', ')}</p>
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

export function EventsList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-full'],
    queryFn: eventsApi.listFull,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events-full'] })
      toast.success('Evento eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const grouped = events.reduce<Record<number, Event[]>>((acc, e) => {
    ;(acc[e.day] ??= []).push(e)
    return acc
  }, {})

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(e: Event) { setEditing(e); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null) }

  return (
    <Layout
      title="Programa"
      action={
        <Button onClick={openCreate} size="sm">
          <Plus size={14} /> Nuevo evento
        </Button>
      }
    >
      {isLoading ? (
        <TableSkeleton />
      ) : events.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, dayEvents]) => (
              <section key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-widest">
                    Día {day}
                  </h2>
                  {DAY_DATE[Number(day)] && (
                    <span className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F]">
                      {DAY_DATE[Number(day)]}
                    </span>
                  )}
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] border border-[#1E3A5F]/40 rounded-full px-2 py-0.5 ml-auto">
                    {dayEvents.length} eventos
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((event, i) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <EventCard
                        event={event}
                        onEdit={() => openEdit(event)}
                        onDelete={() => { if (confirm('¿Eliminar evento?')) deleteMutation.mutate(event._id!) }}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      <EventForm
        open={modalOpen}
        onClose={closeModal}
        event={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ['events-full'] })}
      />
    </Layout>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="size-16 rounded-full bg-[#1E3A5F]/30 flex items-center justify-center">
        <Clock size={24} className="text-[#1E3A5F]" />
      </div>
      <p className="text-[#475569] font-['Outfit'] text-sm">No hay eventos cargados</p>
      <Button onClick={onCreate} variant="outline" size="sm">
        <Plus size={14} /> Crear primer evento
      </Button>
    </div>
  )
}
