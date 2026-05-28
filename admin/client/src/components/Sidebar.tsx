import { NavLink, useNavigate } from 'react-router'
import {
  Calendar, Users, FileText, Bell, RefreshCw, LogOut, Radio, ShieldCheck, UserCircle, LayoutList, Smartphone, Star, Users2,
} from 'lucide-react'
import { motion } from 'motion/react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../types'

const navItems = [
  { to: '/events', icon: Calendar, label: 'Programa', minRole: 'viewer' as UserRole },
  { to: '/panels', icon: LayoutList, label: 'Paneles', minRole: 'viewer' as UserRole },
  { to: '/speakers', icon: Users, label: 'Speakers', minRole: 'viewer' as UserRole },
  { to: '/papers', icon: FileText, label: 'Papers', minRole: 'viewer' as UserRole },
  { to: '/announcements', icon: Bell, label: 'Anuncios', minRole: 'editor' as UserRole },
  { to: '/ratings', icon: Star, label: 'Valoraciones', minRole: 'editor' as UserRole },
  { to: '/committees', icon: Users2, label: 'Committees', minRole: 'editor' as UserRole },
  { to: '/content', icon: RefreshCw, label: 'Contenido', minRole: 'admin' as UserRole },
]

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2, super_admin: 3 }
const canAccess = (userRole: UserRole, minRole: UserRole) => ROLE_RANK[userRole] >= ROLE_RANK[minRole]

export function Sidebar() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    setUser(null)
    navigate('/login')
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 w-56 flex flex-col bg-[#0D1520] border-r border-[#1E3A5F]/60 z-40"
      style={{
        backgroundImage: `radial-gradient(circle, #1E3A5F22 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1E3A5F]/60">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-[#00D9B8]/10 border border-[#00D9B8]/30 flex items-center justify-center">
            <Radio size={16} className="text-[#00D9B8]" />
          </div>
          <div>
            <p className="text-xs font-['JetBrains_Mono'] text-[#00D9B8] tracking-widest uppercase">SGSMA</p>
            <p className="text-[10px] font-['JetBrains_Mono'] text-[#475569]">2026 · admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems
          .filter(item => !user || canAccess(user.role, item.minRole))
          .map(({ to, icon: Icon, label }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Outfit'] transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#00D9B8]/10 text-[#00D9B8] border border-[#00D9B8]/20'
                      : 'text-[#64748B] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={`transition-colors ${isActive ? 'text-[#00D9B8]' : 'text-[#475569] group-hover:text-[#94A3B8]'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}

        {/* Usuarios app — admin y super_admin */}
        {user && (user.role === 'admin' || user.role === 'super_admin') && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <NavLink
              to="/app-users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Outfit'] transition-all duration-150 group ${
                  isActive ? 'bg-[#00D9B8]/10 text-[#00D9B8] border border-[#00D9B8]/20' : 'text-[#64748B] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Smartphone size={16} className={isActive ? 'text-[#00D9B8]' : 'text-[#475569] group-hover:text-[#94A3B8]'} />
                  Usuarios app
                </>
              )}
            </NavLink>
          </motion.div>
        )}

        {/* Usuarios admin — solo super_admin */}
        {user?.role === 'super_admin' && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-['Outfit'] transition-all duration-150 group ${
                  isActive ? 'bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20' : 'text-[#64748B] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck size={16} className={isActive ? 'text-[#FF6B35]' : 'text-[#475569] group-hover:text-[#94A3B8]'} />
                  Usuarios
                </>
              )}
            </NavLink>
          </motion.div>
        )}
      </nav>

      {/* Footer — perfil + logout */}
      <div className="px-3 py-4 border-t border-[#1E3A5F]/60 space-y-0.5">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-['Outfit'] transition-all duration-150 ${
              isActive ? 'bg-[#00D9B8]/10 text-[#00D9B8]' : 'text-[#64748B] hover:text-white hover:bg-white/5'
            }`
          }
        >
          <UserCircle size={16} />
          {user?.displayName || user?.username || 'Perfil'}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-['Outfit'] text-[#64748B] hover:text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all duration-150"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
