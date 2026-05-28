import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { speakersApi } from '../../api/speakers'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Speaker } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  role: z.enum(['keynote', 'panelist', 'instructor', 'committee']),
  affiliation: z.string().optional(),
  country: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  slug: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const roleOptions = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'panelist', label: 'Panelista' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'committee', label: 'Comité' },
]

interface Props { open: boolean; onClose: () => void; speaker: Speaker | null }

export function SpeakerForm({ open, onClose, speaker }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'panelist' },
  })

  useEffect(() => {
    reset(speaker ?? {
      role: 'panelist', name: '', affiliation: '', country: '', jobTitle: '', bio: '', photoUrl: '', email: '', slug: '',
    })
  }, [speaker, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      speaker?._id ? speakersApi.update(speaker._id, data) : speakersApi.create(data as Omit<Speaker, '_id'>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['speakers'] })
      toast.success(speaker ? 'Speaker actualizado' : 'Speaker creado')
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  return (
    <Modal open={open} onClose={onClose} title={speaker ? 'Editar speaker' : 'Nuevo speaker'} size="lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" placeholder="Dr. García" error={errors.name?.message} {...register('name')} />
          <Select label="Rol" options={roleOptions} error={errors.role?.message} {...register('role')} />
        </div>
        <Input label="Cargo (job title)" placeholder="Professor, University of..." {...register('jobTitle')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Institución / Afiliación" placeholder="Universidad de..." {...register('affiliation')} />
          <Input label="País" placeholder="Chile" {...register('country')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" placeholder="speaker@univ.edu" error={errors.email?.message} {...register('email')} />
          <Input label="Foto URL" placeholder="https://..." error={errors.photoUrl?.message} {...register('photoUrl')} />
        </div>
        <Input label="Slug" placeholder="juan-garcia (auto-generado por API)" {...register('slug')} />
        <Textarea label="Bio" placeholder="Breve descripción..." {...register('bio')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {speaker ? 'Actualizar' : 'Crear speaker'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
