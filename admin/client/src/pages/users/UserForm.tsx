import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '../../api/users'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { AdminUser } from '../../types'

const createSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']),
  displayName: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
})

const editSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']),
  displayName: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').or(z.literal('')).optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

const roleOptions = [
  { value: 'viewer', label: 'Viewer — solo lectura' },
  { value: 'editor', label: 'Editor — puede editar contenido' },
  { value: 'admin', label: 'Admin — acceso completo' },
  { value: 'super_admin', label: 'Super Admin — gestión de usuarios' },
]

interface Props { open: boolean; onClose: () => void; user: AdminUser | null }

export function UserForm({ open, onClose, user }: Props) {
  const qc = useQueryClient()

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'editor' },
  })

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (user) {
      editForm.reset({ role: user.role, displayName: user.displayName ?? '', email: user.email ?? '', password: '' })
    } else {
      createForm.reset({ role: 'editor', username: '', password: '', displayName: '', email: '' })
    }
  }, [user, open])

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario creado'); onClose() },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err?.response?.data?.error ?? 'Error al crear'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) =>
      usersApi.update(id, { ...data, password: data.password || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario actualizado'); onClose() },
    onError: () => toast.error('Error al actualizar'),
  })

  if (user) {
    return (
      <Modal open={open} onClose={onClose} title={`Editar: @${user.username}`}>
        <form onSubmit={editForm.handleSubmit(d => editMutation.mutate({ id: user._id!, data: d }))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre para mostrar" placeholder="Nombre completo" {...editForm.register('displayName')} />
            <Input label="Email" type="email" placeholder="email@..." error={editForm.formState.errors.email?.message} {...editForm.register('email')} />
          </div>
          <Select label="Rol" options={roleOptions} error={editForm.formState.errors.role?.message} {...editForm.register('role')} />
          <Input
            label="Nueva contraseña (dejar vacío para no cambiar)"
            type="password"
            placeholder="••••••••"
            error={editForm.formState.errors.password?.message}
            {...editForm.register('password')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={editMutation.isPending}>Actualizar</Button>
          </div>
        </form>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo usuario">
      <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Username" placeholder="usuario_123" error={createForm.formState.errors.username?.message} {...createForm.register('username')} />
          <Input label="Contraseña" type="password" placeholder="••••••••" error={createForm.formState.errors.password?.message} {...createForm.register('password')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre para mostrar" placeholder="Nombre completo" {...createForm.register('displayName')} />
          <Input label="Email" type="email" placeholder="email@..." error={createForm.formState.errors.email?.message} {...createForm.register('email')} />
        </div>
        <Select label="Rol" options={roleOptions} error={createForm.formState.errors.role?.message} {...createForm.register('role')} />

        {/* Permissions summary */}
        <div className="bg-[#060B0F] border border-[#1E3A5F]/40 rounded-lg p-3 text-[11px] font-['JetBrains_Mono'] text-[#475569] space-y-1">
          <p><span className="text-[#00D9B8]">viewer</span> — solo puede ver contenido</p>
          <p><span className="text-yellow-400]">editor</span> — puede editar eventos, speakers y papers</p>
          <p><span className="text-[#00D9B8]">admin</span> — acceso completo al contenido</p>
          <p><span className="text-[#FF6B35]">super_admin</span> — admin + gestión de usuarios</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={createMutation.isPending}>Crear usuario</Button>
        </div>
      </form>
    </Modal>
  )
}
