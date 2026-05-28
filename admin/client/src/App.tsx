import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { EventsList } from './pages/events/EventsList'
import { SpeakersList } from './pages/speakers/SpeakersList'
import { PapersList } from './pages/papers/PapersList'
import { PanelsList } from './pages/panels/PanelsList'
import { Announcements } from './pages/announcements/Announcements'
import { Content } from './pages/content/Content'
import { UsersList } from './pages/users/UsersList'
import { AppUsersList } from './pages/appUsers/AppUsersList'
import { RatingsList } from './pages/ratings/RatingsList'
import { CommitteesList } from './pages/committees/CommitteesList'
import { Profile } from './pages/profile/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.PROD ? '/backoffice' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Navigate to="/events" replace />} />
                  <Route path="/events" element={<EventsList />} />
                  <Route path="/speakers" element={<SpeakersList />} />
                  <Route path="/papers" element={<PapersList />} />
                  <Route path="/panels" element={<PanelsList />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/content" element={<Content />} />
                  <Route path="/users" element={<UsersList />} />
                  <Route path="/app-users" element={<AppUsersList />} />
                  <Route path="/ratings" element={<RatingsList />} />
                  <Route path="/committees" element={<CommitteesList />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/events" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#0D1520',
            border: '1px solid #1E3A5F',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif',
          },
        }}
      />
    </QueryClientProvider>
  )
}
