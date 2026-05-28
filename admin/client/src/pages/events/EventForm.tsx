import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eventsApi } from '../../api/events'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Event } from '../../types'

const schema = z.object({
  title: z.string().min(1, 'Requerido'),
  type: z.enum(['keynote', 'panel', 'paper_session', 'tutorial', 'townhall', 'workshop', 'ceremony', 'break', 'registration', 'sponsor', 'social']),
  day: z.coerce.number().min(1).max(10),
  date: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  location: z.string().optional(),
  track: z.coerce.number().nullable().optional(),
  description: z.string().optional(),
  panelId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const typeOptions = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel' },
  { value: 'paper_session', label: 'Paper Session' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'townhall', label: 'Townhall' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'ceremony', label: 'Ceremonia' },
  { value: 'break', label: 'Pausa' },
  { value: 'registration', label: 'Registro' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'social', label: 'Social' },
]

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  onSaved?: () => void
}

export function EventForm({ open, onClose, event, onSaved }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'keynote', day: 1 },
  })

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        type: event.type,
        day: event.day,
        date: event.date ?? '',
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location ?? '',
        track: event.track ?? undefined,
        description: event.description ?? '',
        panelId: event.panelId ?? '',
      })
    } else {
      reset({ type: 'keynote', day: 1, startTime: '', endTime: '', title: '', location: '' })
    }
  }, [event, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        location: data.location || null,
        track: data.track || null,
        description: data.description || null,
        panelId: data.panelId || null,
      }
      return event?._id
        ? eventsApi.update(event._id, payload)
        : eventsApi.create(payload as Omit<Event, '_id' | 'speakers' | 'papers'>)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events-full'] })
      onSaved?.()
      toast.success(event ? 'Evento actualizado' : 'Evento creado')
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Editar evento' : 'Nuevo evento'} size="md">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <Input label="Título" placeholder="Opening Ceremony" error={errors.title?.message} {...register('title')} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" options={typeOptions} error={errors.type?.message} {...register('type')} />
          <Input label="Día" type="number" placeholder="1" error={errors.day?.message} {...register('day')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="Fecha" type="date" {...register('date')} />
          <Input label="Inicio" placeholder="09:00" error={errors.startTime?.message} {...register('startTime')} />
          <Input label="Fin" placeholder="10:00" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Ubicación" placeholder="Auditorio Principal" {...register('location')} />
          <Input label="Track" type="number" placeholder="1" {...register('track')} />
        </div>

        <Input label="Panel ID" placeholder="664a... (solo si type=panel)" {...register('panelId')} />

        <Textarea label="Descripción" placeholder="Descripción opcional..." {...register('description')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {event ? 'Actualizar' : 'Crear evento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
