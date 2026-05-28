import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { Radio, Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
})
type FormData = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const setChecked = useAuthStore(s => s.setChecked)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await authApi.login(data.username, data.password)
      setUser(res.user)
      setChecked()
      navigate('/events', { replace: true })
    } catch {
      toast.error('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#060B0F] flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,217,184,0.08) 0%, transparent 60%),
          radial-gradient(circle, #1E3A5F18 1px, transparent 1px)
        `,
        backgroundSize: 'auto, 28px 28px',
      }}
    >
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-[#00D9B8]/3 blur-3xl pointer-events-none" />

      <motion.div
        className="relative w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Card */}
        <div className="bg-[#0D1520]/80 backdrop-blur border border-[#1E3A5F] rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <motion.div
              className="size-14 rounded-xl bg-[#00D9B8]/10 border border-[#00D9B8]/30 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Radio size={24} className="text-[#00D9B8]" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-xl font-['Syne'] font-bold text-white tracking-tight">SGSMA 2026</h1>
              <p className="text-xs font-['JetBrains_Mono'] text-[#475569] tracking-widest uppercase mt-0.5">
                Panel de administración
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <User size={14} className="absolute left-3 top-[38px] text-[#475569]" />
              <Input
                label="Usuario"
                placeholder="admin"
                className="pl-8"
                error={errors.username?.message}
                {...register('username')}
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-[38px] text-[#475569]" />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                className="pl-8"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] font-['JetBrains_Mono'] text-[#1E3A5F] mt-4 tracking-widest uppercase">
          Acceso restringido — personal autorizado
        </p>
      </motion.div>
    </div>
  )
}
