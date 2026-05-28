import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Sidebar } from './Sidebar'

interface Props {
  children: ReactNode
  title: string
  action?: ReactNode
}

export function Layout({ children, title, action }: Props) {
  return (
    <div className="min-h-screen bg-[#060B0F] flex">
      <Sidebar />
      <main className="flex-1 ml-56 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-[#1E3A5F]/40 bg-[#060B0F]/80 backdrop-blur-md">
          <h1 className="text-lg font-['Syne'] font-bold text-white tracking-tight">{title}</h1>
          {action && <div>{action}</div>}
        </header>
        <motion.div
          className="flex-1 p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
