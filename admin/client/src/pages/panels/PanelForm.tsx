import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { panelsApi } from '../../api/panels'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Panel } from '../../types'

const participantSchema = z.object({
  speakerId: z.string().min(1, 'Requerido'),
  name: z.string().min(1, 'Requerido'),
  talkTitle: z.string().optional(),
  abstract: z.string().optional(),
})

const schema = z.object({
  title: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  day: z.coerce.number().min(1).max(10),
  date: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  track: z.coerce.number().nullable().optional(),
  chair: participantSchema,
  panelists: z.array(participantSchema),
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; onClose: () => void; panel: Panel | null }

export function PanelForm({ open, onClose, panel }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      day: 2,
      chair: { speakerId: '', name: '', talkTitle: '', abstract: '' },
      panelists: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'panelists' })

  useEffect(() => {
    if (panel) {
      reset({
        title: panel.title,
        description: panel.description ?? '',
        day: panel.day,
        date: panel.date ?? '',
        startTime: panel.startTime,
        endTime: panel.endTime,
        track: panel.track ?? undefined,
        chair: {
          speakerId: panel.chair.speakerId,
          name: panel.chair.name,
          talkTitle: panel.chair.talkTitle ?? '',
          abstract: panel.chair.abstract ?? '',
        },
        panelists: panel.panelists.map(p => ({
          speakerId: p.speakerId,
          name: p.name,
          talkTitle: p.talkTitle ?? '',
          abstract: p.abstract ?? '',
        })),
      })
    } else {
      reset({
        title: '', description: '', day: 2, date: '', startTime: '', endTime: '', track: undefined,
        chair: { speakerId: '', name: '', talkTitle: '', abstract: '' },
        panelists: [],
      })
    }
  }, [panel, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Omit<Panel, '_id'> = {
        ...data,
        track: data.track || null,
        description: data.description || undefined,
        date: data.date || undefined,
        chair: {
          ...data.chair,
          talkTitle: data.chair.talkTitle || null,
          abstract: data.chair.abstract || null,
        },
        panelists: data.panelists.map(p => ({
          ...p,
          talkTitle: p.talkTitle || null,
          abstract: p.abstract || null,
        })),
      }
      return panel?._id ? panelsApi.update(panel._id, payload) : panelsApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['panels'] })
      toast.success(panel ? 'Panel actualizado' : 'Panel creado')
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  return (
    <Modal open={open} onClose={onClose} title={panel ? 'Editar panel' : 'Nuevo panel'} size="lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        <Input label="Título" placeholder="Panel #1: Artificial Intelligence..." error={errors.title?.message} {...register('title')} />

        <div className="grid grid-cols-3 gap-3">
          <Input label="Día" type="number" placeholder="2" error={errors.day?.message} {...register('day')} />
          <Input label="Inicio" placeholder="11:00" error={errors.startTime?.message} {...register('startTime')} />
          <Input label="Fin" placeholder="12:30" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha" type="date" {...register('date')} />
          <Input label="Track" type="number" placeholder="1" {...register('track')} />
        </div>

        <Textarea label="Descripción" placeholder="Descripción del panel..." {...register('description')} />

        {/* Chair */}
        <div className="space-y-2">
          <p className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-wider">Chair</p>
          <div className="bg-[#1E3A5F]/10 border border-[#1E3A5F]/30 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Speaker ID"
                placeholder="664a..."
                error={errors.chair?.speakerId?.message}
                {...register('chair.speakerId')}
              />
              <Input
                label="Nombre"
                placeholder="Guglielmo Frigo"
                error={errors.chair?.name?.message}
                {...register('chair.name')}
              />
            </div>
            <Input label="Talk title (opcional)" placeholder="Título de la charla" {...register('chair.talkTitle')} />
          </div>
        </div>

        {/* Panelists */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] uppercase tracking-wider">
              Panelistas ({fields.length})
            </p>
            <button
              type="button"
              onClick={() => append({ speakerId: '', name: '', talkTitle: '', abstract: '' })}
              className="flex items-center gap-1 text-[11px] font-['Outfit'] text-[#475569] hover:text-[#00D9B8] transition-colors"
            >
              <Plus size={12} /> Agregar panelista
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-[11px] font-['JetBrains_Mono'] text-[#1E3A5F] text-center py-3">
              Sin panelistas. Click en "+ Agregar panelista" para añadir.
            </p>
          )}

          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="bg-[#1E3A5F]/10 border border-[#1E3A5F]/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569]">Panelista {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1 text-[#475569] hover:text-[#FF6B35] transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Speaker ID"
                    placeholder="664a..."
                    error={errors.panelists?.[idx]?.speakerId?.message}
                    {...register(`panelists.${idx}.speakerId`)}
                  />
                  <Input
                    label="Nombre"
                    placeholder="Paolo Pegoraro"
                    error={errors.panelists?.[idx]?.name?.message}
                    {...register(`panelists.${idx}.name`)}
                  />
                </div>
                <Input label="Talk title" placeholder="Challenges in measurement..." {...register(`panelists.${idx}.talkTitle`)} />
                <Textarea label="Abstract (opcional)" placeholder="Abstract de la charla..." rows={2} {...register(`panelists.${idx}.abstract`)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {panel ? 'Actualizar' : 'Crear panel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
