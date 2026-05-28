import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isChecked, setUser, setChecked } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isChecked) return
    authApi.me()
      .then((user) => setUser(user))
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setChecked())
  }, [isChecked, navigate, setUser, setChecked])

  if (!isChecked) {
    return (
      <div className="min-h-screen bg-[#060B0F] flex items-center justify-center">
        <div className="size-8 border-2 border-[#00D9B8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
