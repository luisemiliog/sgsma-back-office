import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Star, ChevronDown, MessageSquare, BarChart2 } from 'lucide-react'
import { ratingsApi } from '../../api/ratings'
import type { EventRatingSummary, RatingEntry } from '../../api/ratings'
import { Layout } from '../../components/Layout'
import { TableSkeleton } from '../../components/ui/Skeleton'
import client from '../../api/client'

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-[#1E3A5F]'}
        />
      ))}
    </span>
  )
}

function BreakdownBar({ breakdown, total }: { breakdown: Record<string, number>; total: number }) {
  return (
    <div className="space-y-1 my-3">
      {[5, 4, 3, 2, 1].map(n => {
        const count = breakdown[n] ?? 0
        const pct   = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={n} className="flex items-center gap-2">
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569] w-2">{n}</span>
            <Star size={9} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-[#1E3A5F]/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400/70 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569] w-4 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function CommentsPanel({ eventId }: { eventId: string }) {
  const { data: entries = [], isLoading } = useQuery<RatingEntry[]>({
    queryKey: ['ratings', eventId],
    queryFn: () => client.get(`/ratings/${eventId}`).then(r => r.data),
  })

  if (isLoading) return <div className="py-4 text-xs text-[#475569] font-['Outfit']">Cargando...</div>

  const withComment = entries.filter(e => e.comment?.trim())

  return (
    <div className="pt-3 border-t border-[#1E3A5F]/40 space-y-2">
      {withComment.length === 0 ? (
        <p className="text-xs text-[#475569] font-['Outfit'] py-2">No hay comentarios escritos.</p>
      ) : withComment.map(e => (
        <div key={e._id} className="bg-[#060B0F] rounded-lg px-4 py-3 border border-[#1E3A5F]/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-['Outfit'] text-[#94A3B8]">{e.userName}</span>
            <Stars value={e.stars} size={11} />
          </div>
          <p className="text-sm font-['Outfit'] text-[#CBD5E1] leading-relaxed">{e.comment}</p>
        </div>
      ))}

      {entries.filter(e => !e.comment?.trim()).length > 0 && (
        <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] pt-1">
          +{entries.filter(e => !e.comment?.trim()).length} valoración(es) sin comentario
        </p>
      )}
    </div>
  )
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  keynote: 'Keynote', panel: 'Panel', paper_session: 'Paper Session',
  tutorial: 'Tutorial', townhall: 'Townhall', workshop: 'Workshop',
  ceremony: 'Ceremony', break: 'Break', registration: 'Registro',
  sponsor: 'Sponsor', social: 'Social',
}

export function RatingsList() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: events = [], isLoading } = useQuery<EventRatingSummary[]>({
    queryKey: ['ratings'],
    queryFn: ratingsApi.list,
  })

  const totalRatings = events.reduce((s, e) => s + e.total, 0)

  return (
    <Layout title="Valoraciones de charlas">
      <div className="mb-6 flex items-center gap-4">
        <p className="text-xs font-['JetBrains_Mono'] text-[#475569]">
          {events.length} charla{events.length !== 1 ? 's' : ''} valorada{events.length !== 1 ? 's' : ''}
          <span className="mx-2 text-[#1E3A5F]">·</span>
          {totalRatings} valoración{totalRatings !== 1 ? 'es' : ''} en total
        </p>
      </div>

      {isLoading ? <TableSkeleton /> : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <BarChart2 size={32} className="text-[#1E3A5F]" />
          <p className="text-[#475569] font-['Outfit'] text-sm">Aún no hay valoraciones registradas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => {
            const isOpen = expanded === ev.eventId
            return (
              <motion.div
                key={ev.eventId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ev.eventId)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  {/* Day badge */}
                  {ev.day && (
                    <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569] bg-[#1E3A5F]/30 rounded px-1.5 py-0.5 flex-shrink-0">
                      D{ev.day}
                    </span>
                  )}

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-['Outfit'] font-medium text-white truncate">{ev.title}</p>
                    {ev.type && (
                      <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569]">
                        {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                      </span>
                    )}
                  </div>

                  {/* Stars + average */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ev.average !== null && <Stars value={ev.average} />}
                    <span className="text-sm font-['JetBrains_Mono'] font-bold text-yellow-400">
                      {ev.average?.toFixed(1) ?? '—'}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-center gap-1 flex-shrink-0 text-[#475569]">
                    <MessageSquare size={12} />
                    <span className="text-xs font-['JetBrains_Mono']">{ev.total}</span>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    size={14}
                    className={`text-[#475569] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded panel */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <BreakdownBar breakdown={ev.breakdown} total={ev.total} />
                        <CommentsPanel eventId={ev.eventId} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
