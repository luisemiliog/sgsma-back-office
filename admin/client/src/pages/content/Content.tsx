import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Hash, Clock, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { contentApi } from '../../api/content'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'

export function Content() {
  const qc = useQueryClient()
  const [justPublished, setJustPublished] = useState(false)

  const { data: meta, isLoading } = useQuery({
    queryKey: ['content-meta'],
    queryFn: contentApi.meta,
    refetchInterval: 10_000,
  })

  const mutation = useMutation({
    mutationFn: contentApi.republish,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-meta'] })
      toast.success('Contenido republicado. La app móvil detectará el cambio.')
      setJustPublished(true)
      setTimeout(() => setJustPublished(false), 3000)
    },
    onError: () => toast.error('Error al republicar'),
  })

  return (
    <Layout title="Contenido">
      <div className="max-w-lg">
        {/* Info card */}
        <div className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-['Syne'] font-semibold text-white mb-4">Estado del contenido</h2>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 bg-[#1E3A5F]/30 rounded animate-pulse" />
              <div className="h-6 bg-[#1E3A5F]/30 rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash size={14} className="text-[#475569]" />
                <div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest">Hash actual</p>
                  <p className="text-sm font-['JetBrains_Mono'] text-[#00D9B8] mt-0.5">
                    {meta?.hash ?? <span className="text-[#475569]">Sin datos</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-[#475569]" />
                <div>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest">Última publicación</p>
                  <p className="text-sm font-['Outfit'] text-white mt-0.5">
                    {meta?.updatedAt
                      ? new Date(meta.updatedAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
                      : <span className="text-[#475569]">Nunca</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl p-6">
          <h2 className="text-sm font-['Syne'] font-semibold text-white mb-2">Republicar contenido</h2>
          <p className="text-xs font-['Outfit'] text-[#64748B] leading-relaxed mb-5">
            Genera un nuevo hash en <code className="font-['JetBrains_Mono'] text-[#475569] bg-white/5 px-1 rounded">content_meta</code> e invalida
            la caché Redis. La app móvil detecta el cambio en su próxima sincronización y descarga el contenido actualizado.
          </p>

          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="w-full"
          >
            <RefreshCw size={14} />
            Republicar ahora
          </Button>

          <AnimatePresence>
            {justPublished && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 mt-4 p-3 bg-[#00D9B8]/10 border border-[#00D9B8]/20 rounded-lg"
              >
                <CheckCircle2 size={14} className="text-[#00D9B8]" />
                <span className="text-xs font-['Outfit'] text-[#00D9B8]">
                  Hash actualizado — la app sincronizará al conectarse
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  )
}
