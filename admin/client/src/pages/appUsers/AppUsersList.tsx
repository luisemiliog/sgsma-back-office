import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Mail, Users, KeyRound, Chrome, QrCode, Upload, Trash2 } from 'lucide-react'
import { appUsersApi } from '../../api/appUsers'
import { Layout } from '../../components/Layout'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import type { AppUser } from '../../types'

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AppUsersList() {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [qrUser, setQrUser] = useState<AppUser | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['app-users'],
    queryFn:  appUsersApi.list,
  })

  const resetMutation = useMutation({
    mutationFn: (id: string) => appUsersApi.sendReset(id),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Error al enviar el correo'),
  })

  const setQrMutation = useMutation({
    mutationFn: ({ id, qrUrl }: { id: string; qrUrl: string | null }) =>
      appUsersApi.setQr(id, qrUrl),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['app-users'] })
      setQrUser(prev => prev ? { ...prev, qrUrl: data.qrUrl } : null)
      toast.success(data.qrUrl ? 'QR asignado' : 'QR eliminado')
    },
    onError: () => toast.error('Error al actualizar el QR'),
  })

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !qrUser?._id) return
    setUploading(true)
    try {
      const { url } = await appUsersApi.uploadImage(file)
      setQrMutation.mutate({ id: qrUser._id, qrUrl: url })
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const withQr  = users.filter(u => u.qrUrl).length
  const isEmail = (u: AppUser) => !u.googleSub

  return (
    <Layout title="Usuarios de la app">
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#475569]">
          <span className="size-2 rounded-full bg-[#00D9B8] inline-block" /> Email + contraseña
        </div>
        <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#475569]">
          <span className="size-2 rounded-full bg-[#4285F4] inline-block" /> Google Sign-In
        </div>
        <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#475569]">
          <QrCode size={11} className="text-[#00D9B8]" /> {withQr} con QR asignado
        </div>
        <span className="ml-auto text-xs font-['JetBrains_Mono'] text-[#1E3A5F]">
          {users.length} asistente{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? <TableSkeleton /> : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Users size={32} className="text-[#1E3A5F]" />
          <p className="text-[#475569] font-['Outfit'] text-sm">No hay usuarios registrados en la app</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => {
            const email = isEmail(u)
            return (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl px-5 py-4 hover:border-[#1E3A5F] transition-colors group"
              >
                {/* Avatar */}
                <div className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 border text-sm font-['Syne'] font-bold ${
                  email
                    ? 'bg-[#00D9B8]/10 border-[#00D9B8]/30 text-[#00D9B8]'
                    : 'bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]'
                }`}>
                  {u.email.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {u.name && (
                    <p className="text-xs font-['Outfit'] font-medium text-white truncate">{u.name}</p>
                  )}
                  <p className={`font-['Outfit'] truncate ${u.name ? 'text-[10px] text-[#475569]' : 'text-sm font-medium text-white'}`}>
                    {u.email}
                  </p>
                  <p className="text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] mt-0.5">
                    {formatDate(u.createdAt)}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!email ? (
                    <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#4285F4] bg-[#4285F4]/10 border border-[#4285F4]/20 rounded px-2 py-0.5">
                      <Chrome size={10} /> Google
                    </span>
                  ) : (
                    <Badge label="Email" variant="cyan" />
                  )}
                  {u.qrUrl && (
                    <span className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#00D9B8] bg-[#00D9B8]/10 border border-[#00D9B8]/20 rounded px-2 py-0.5">
                      <QrCode size={9} /> QR
                    </span>
                  )}
                  {!u.active && <Badge label="inactivo" variant="slate" />}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* QR */}
                  <button
                    onClick={() => setQrUser(u)}
                    title="Gestionar QR de acreditación"
                    className={`p-2 rounded-lg transition-colors ${
                      u.qrUrl
                        ? 'text-[#00D9B8] hover:bg-[#00D9B8]/10'
                        : 'text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5'
                    }`}
                  >
                    <QrCode size={14} />
                  </button>

                  {/* Reset password */}
                  <button
                    onClick={() => {
                      if (!email) return
                      if (confirm(`¿Enviar correo de recuperación a ${u.email}?`)) {
                        resetMutation.mutate(u._id!)
                      }
                    }}
                    disabled={!email || resetMutation.isPending}
                    title={email ? 'Enviar correo de recuperación' : 'Usa Google Sign-In, no tiene contraseña'}
                    className={`p-2 rounded-lg transition-colors ${
                      email
                        ? 'text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5'
                        : 'text-[#1E3A5F] cursor-not-allowed opacity-30'
                    }`}
                  >
                    <KeyRound size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* QR modal */}
      <Modal
        open={!!qrUser}
        onClose={() => setQrUser(null)}
        title="QR de acreditación"
        size="sm"
      >
        {qrUser && (
          <div className="space-y-4">
            <p className="text-xs font-['JetBrains_Mono'] text-[#475569] truncate">{qrUser.email}</p>

            {qrUser.qrUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <img
                    src={qrUser.qrUrl}
                    alt="QR code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => setQrMutation.mutate({ id: qrUser._id!, qrUrl: null })}
                    loading={setQrMutation.isPending}
                  >
                    <Trash2 size={13} />
                    Eliminar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || setQrMutation.isPending}
                  >
                    <Upload size={13} />
                    Reemplazar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="size-16 rounded-full bg-[#0D1520] border border-[#1E3A5F] flex items-center justify-center">
                  <QrCode size={24} className="text-[#1E3A5F]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-['Outfit'] text-white mb-1">Sin QR asignado</p>
                  <p className="text-xs font-['Outfit'] text-[#475569]">
                    Sube la imagen del código QR de acreditación para este usuario.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  disabled={uploading}
                >
                  <Upload size={14} />
                  Subir QR
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrUpload}
            />
          </div>
        )}
      </Modal>
    </Layout>
  )
}
