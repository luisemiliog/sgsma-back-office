import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { User, Lock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { profileApi } from '../../api/profile'
import { useAuthStore } from '../../stores/auth'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { ROLE_LABELS, ROLE_COLORS } from '../../types'

const infoSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type InfoForm = z.infer<typeof infoSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function Profile() {
  const { user, setUser } = useAuthStore()

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: { displayName: user?.displayName ?? '', email: user?.email ?? '' },
  })

  useEffect(() => {
    infoForm.reset({ displayName: user?.displayName ?? '', email: user?.email ?? '' })
  }, [user])

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const infoMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: ({ user: updated }) => {
      setUser({ ...user!, ...updated })
      toast.success('Perfil actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const passwordMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      toast.success('Contraseña actualizada')
      passwordForm.reset()
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? 'Error al cambiar contraseña')
    },
  })

  if (!user) return null

  return (
    <Layout title="Mi perfil">
      <div className="max-w-xl space-y-6">

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl p-5"
        >
          <div className="size-14 rounded-full bg-[#00D9B8]/10 border border-[#00D9B8]/20 flex items-center justify-center text-2xl font-['Syne'] font-bold text-[#00D9B8]">
            {(user.displayName ?? user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-['Syne'] font-semibold text-white">
              {user.displayName || user.username}
            </p>
            <p className="text-xs font-['JetBrains_Mono'] text-[#475569] mt-0.5">@{user.username}</p>
            <div className="mt-1.5">
              <Badge label={ROLE_LABELS[user.role]} variant={ROLE_COLORS[user.role]} />
            </div>
          </div>
        </motion.div>

        {/* Info form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <User size={15} className="text-[#00D9B8]" />
            <h2 className="text-sm font-['Syne'] font-semibold text-white">Datos personales</h2>
          </div>
          <form
            onSubmit={infoForm.handleSubmit(d => infoMutation.mutate(d))}
            className="space-y-4"
          >
            <Input
              label="Nombre para mostrar"
              placeholder="Tu nombre completo"
              {...infoForm.register('displayName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={infoForm.formState.errors.email?.message}
              {...infoForm.register('email')}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={infoMutation.isPending} size="sm">
                <CheckCircle2 size={13} /> Guardar cambios
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Password form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Lock size={15} className="text-[#00D9B8]" />
            <h2 className="text-sm font-['Syne'] font-semibold text-white">Cambiar contraseña</h2>
          </div>
          <form
            onSubmit={passwordForm.handleSubmit(d =>
              passwordMutation.mutate({
                currentPassword: d.currentPassword,
                newPassword: d.newPassword,
              })
            )}
            className="space-y-4"
          >
            <Input
              label="Contraseña actual"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={passwordMutation.isPending} size="sm">
                <Lock size={13} /> Actualizar contraseña
              </Button>
            </div>
          </form>
        </motion.div>

      </div>
    </Layout>
  )
}
