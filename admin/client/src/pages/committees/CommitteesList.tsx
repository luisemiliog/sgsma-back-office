import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Users2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { committeesApi, type CommitteeGroup, type CommitteeMember } from '../../api/committees'
import { Layout } from '../../components/Layout'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'

const GROUP_OPTIONS = [
  { value: '',                     label: 'Select group...' },
  { value: 'conference_leadership', label: 'Conference Leadership' },
  { value: 'technical_program',     label: 'Technical Program Committee' },
  { value: 'tutorial_panel',        label: 'Tutorial & Panel Coordination' },
  { value: 'board',                 label: 'SGSMA Association Board' },
  { value: 'regional',              label: 'Regional Organizing Committee' },
  { value: 'local',                 label: 'Local Organizing Committee' },
]

const schema = z.object({
  group:       z.string().min(1, 'Required'),
  name:        z.string().min(1, 'Required'),
  role:        z.string(),
  affiliation: z.string(),
  country:     z.string(),
})
type FormData = z.infer<typeof schema>

export function CommitteesList() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<CommitteeMember | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: groups = [], isLoading } = useQuery<CommitteeGroup[]>({
    queryKey: ['committees'],
    queryFn:  committeesApi.list,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { group: '', name: '', role: '', affiliation: '', country: '' },
  })

  function openAdd(group = '') {
    setEditing(null)
    reset({ group, name: '', role: '', affiliation: '', country: '' })
    setShowModal(true)
  }

  function openEdit(member: CommitteeMember) {
    setEditing(member)
    reset({
      group:       member.group,
      name:        member.name,
      role:        member.role,
      affiliation: member.affiliation,
      country:     member.country,
    })
    setShowModal(true)
  }

  const createMutation = useMutation({
    mutationFn: committeesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] })
      toast.success('Member added')
      setShowModal(false)
    },
    onError: () => toast.error('Error adding member'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommitteeMember> }) =>
      committeesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] })
      toast.success('Member updated')
      setShowModal(false)
    },
    onError: () => toast.error('Error updating member'),
  })

  const deleteMutation = useMutation({
    mutationFn: committeesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] })
      toast.success('Member removed')
    },
    onError: () => toast.error('Error removing member'),
  })

  function onSubmit(data: FormData) {
    if (editing?._id) {
      updateMutation.mutate({ id: editing._id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const totalMembers = groups.reduce((n, g) => n + g.members.length, 0)

  return (
    <Layout
      title="Committees"
      action={
        <Button size="sm" onClick={() => openAdd()}>
          <Plus size={14} />
          Add member
        </Button>
      }
    >
      <div className="mb-4 text-xs font-['JetBrains_Mono'] text-[#475569]">
        {totalMembers} members across {groups.filter(g => g.members.length > 0).length} committees
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="space-y-8">
          {groups.map((group, gi) => (
            <motion.section
              key={group.group}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Users2 size={14} className="text-[#00D9B8]" />
                  <h2 className="text-sm font-['Syne'] font-semibold text-white">{group.label}</h2>
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#475569] bg-[#0D1520] border border-[#1E3A5F] px-2 py-0.5 rounded-full">
                    {group.members.length}
                  </span>
                </div>
                <button
                  onClick={() => openAdd(group.group)}
                  className="flex items-center gap-1 text-xs font-['Outfit'] text-[#475569] hover:text-[#00D9B8] transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              <div className="bg-[#0D1520] border border-[#1E3A5F]/60 rounded-xl overflow-hidden">
                {group.members.length === 0 ? (
                  <div className="py-8 text-center text-[#475569] text-xs font-['Outfit']">
                    No members yet —{' '}
                    <button
                      onClick={() => openAdd(group.group)}
                      className="text-[#00D9B8] hover:underline"
                    >
                      add one
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1E3A5F]/40">
                        <th className="text-left px-4 py-2.5 text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest">Name</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest">Role</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest hidden md:table-cell">Affiliation</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-['JetBrains_Mono'] text-[#475569] uppercase tracking-widest hidden lg:table-cell w-16">Country</th>
                        <th className="px-4 py-2.5 w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map((member) => (
                        <tr
                          key={member._id}
                          className="border-b border-[#1E3A5F]/20 last:border-0 hover:bg-white/[0.02] group/row"
                        >
                          <td className="px-4 py-3 text-sm font-['Outfit'] text-white">{member.name}</td>
                          <td className="px-4 py-3 text-xs font-['Outfit'] text-[#94A3B8]">{member.role || '—'}</td>
                          <td className="px-4 py-3 text-xs font-['Outfit'] text-[#64748B] hidden md:table-cell">{member.affiliation || '—'}</td>
                          <td className="px-4 py-3 text-xs font-['JetBrains_Mono'] text-[#475569] hidden lg:table-cell">{member.country || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity justify-end">
                              <button
                                onClick={() => openEdit(member)}
                                className="p-1.5 rounded-md text-[#475569] hover:text-[#00D9B8] hover:bg-[#00D9B8]/5 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => member._id && deleteMutation.mutate(member._id)}
                                className="p-1.5 rounded-md text-[#475569] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.section>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit member' : 'Add member'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Committee group"
            options={GROUP_OPTIONS}
            error={errors.group?.message}
            {...register('group')}
          />
          <Input
            label="Name"
            placeholder="Full name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Role / Title"
            placeholder="e.g. TPC Chair, Board Member"
            {...register('role')}
          />
          <Input
            label="Affiliation"
            placeholder="University or institution"
            {...register('affiliation')}
          />
          <Input
            label="Country"
            placeholder="e.g. USA, Chile"
            {...register('country')}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Save changes' : 'Add member'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
