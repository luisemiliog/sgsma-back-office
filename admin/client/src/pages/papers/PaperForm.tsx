import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { papersApi } from '../../api/papers'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Paper } from '../../types'

const schema = z.object({
  paperId: z.string().optional(),
  title: z.string().min(1, 'Requerido'),
  authors: z.string().min(1, 'Requerido'),
  institution: z.string().optional(),
  sessionId: z.string().optional(),
  abstract: z.string().optional(),
  keywords: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; onClose: () => void; paper: Paper | null }

export function PaperForm({ open, onClose, paper }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (paper) {
      reset({
        paperId: paper.paperId ?? '',
        title: paper.title,
        authors: paper.authors.join(', '),
        institution: paper.institution ?? '',
        sessionId: paper.sessionId ?? '',
        abstract: paper.abstract ?? '',
        keywords: paper.keywords?.join(', ') ?? '',
      })
    } else {
      reset({ paperId: '', title: '', authors: '', institution: '', sessionId: '', abstract: '', keywords: '' })
    }
  }, [paper, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const parsed: Omit<Paper, '_id'> = {
        paperId: data.paperId || undefined,
        title: data.title,
        authors: data.authors.split(',').map(a => a.trim()).filter(Boolean),
        institution: data.institution || undefined,
        sessionId: data.sessionId || undefined,
        abstract: data.abstract || null,
        keywords: data.keywords?.split(',').map(k => k.trim()).filter(Boolean),
      }
      return paper?._id ? papersApi.update(paper._id, parsed) : papersApi.create(parsed)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['papers'] })
      toast.success(paper ? 'Paper actualizado' : 'Paper creado')
      onClose()
    },
    onError: () => toast.error('Error al guardar'),
  })

  return (
    <Modal open={open} onClose={onClose} title={paper ? 'Editar paper' : 'Nuevo paper'} size="lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Paper ID" placeholder="#193" {...register('paperId')} />
          <div className="col-span-2">
            <Input label="Título" placeholder="Título del paper" error={errors.title?.message} {...register('title')} />
          </div>
        </div>
        <Input label="Autores (separados por coma)" placeholder="García, López, Martínez" error={errors.authors?.message} {...register('authors')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Institución" placeholder="Universidad, País" {...register('institution')} />
          <Input label="Session ID (event _id)" placeholder="664a..." {...register('sessionId')} />
        </div>
        <Textarea label="Abstract" placeholder="Resumen del paper..." rows={4} {...register('abstract')} />
        <Input label="Palabras clave (separadas por coma)" placeholder="PMU, WAMS, IBR" {...register('keywords')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {paper ? 'Actualizar' : 'Crear paper'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
