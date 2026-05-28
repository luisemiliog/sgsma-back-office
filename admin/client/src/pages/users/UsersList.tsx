import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { usersApi } from '../../api/users'
import { useAuthStore } from '../../stores/auth'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { UserForm } from './UserForm'
import { ROLE_LABELS, ROLE_COLORS } from '../../types'
import type { AdminUser } from '../../types'

export function UsersList() {
  const qc = useQueryClient()
  const currentUser = useAuthStore(s => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  return (
    <Layout
      title="Usuarios"
      action={
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} size="sm">
          <Plus size={14} /> Nuevo usuario
        </Button>
      }
    >
      {isLoading ? <TableSkeleton /> : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl px-5 py-4 hover:border-[#1E3A5F] transition-colors group"
            >
              {/* Avatar */}
              <div className="size-9 rounded-full bg-[#1E3A5F]/50 border border-[#1E3A5F] flex items-center justify-center font-['Syne'] font-bold text-sm text-[#94A3B8] flex-shrink-0">
                {(u.displayName ?? u.username).charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-['Outfit'] font-medium text-white">
                    {u.displayName || u.username}
                  </p>
                  {u._id === currentUser?._id && (
                    <span className="text-[10px] font-['JetBrains_Mono'] text-[#00D9B8] border border-[#00D9B8]/20 rounded px-1.5 py-0.5">tú</span>
                  )}
                </div>
                <p className="text-[11px] font-['JetBrains_Mono'] text-[#475569]">
                  @{u.username}{u.email ? ` · ${u.email}` : ''}
                </p>
              </div>

              <Badge label={ROLE_LABELS[u.role]} variant={ROLE_COLORS[u.role]} />

              {/* Actions — no puede eliminar su propia cuenta */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => { setEditing(u); setModalOpen(true) }}
                  className="p-2 rounded-lg text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                {u._id !== currentUser?._id && (
                  <button
                    onClick={() => { if (confirm(`¿Eliminar usuario "${u.username}"?`)) deleteMutation.mutate(u._id!) }}
                    className="p-2 rounded-lg text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <ShieldCheck size={32} className="text-[#1E3A5F]" />
              <p className="text-[#475569] font-['Outfit'] text-sm">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      )}

      <UserForm open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} user={editing} />
    </Layout>
  )
}
