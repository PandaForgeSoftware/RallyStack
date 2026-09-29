import SquadsPage from './pages/SquadsPage'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SiteFooter from './components/layout/SiteFooter'
import SiteHeader from './components/layout/SiteHeader'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DealsPage from './pages/DealsPage'
import FindPlayersPage from './pages/FindPlayersPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import ProfilePage from './pages/ProfilePage'
import RegistrationPage from './pages/RegistrationPage'
import SetupPage from './pages/SetupPage'

function SetupEnforcer({ children }) {
  const location = useLocation()

  const {
    user,
    profile,
    loading,
  } = useAuth()

  if (loading) {
    return children
  }

  const exempt = [
    '/setup',
    '/auth/callback',
  ]

  if (
    user &&
    profile &&
    !profile.setup_complete &&
    !exempt.includes(location.pathname)
  ) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    )
  }

  if (
    user &&
    profile?.setup_complete &&
    (
      location.pathname === '/login' ||
      location.pathname === '/register'
    )
  ) {
    return (
      <Navigate
        to="/profile"
        replace
      />
    )
  }

  return children
}

function App() {
  return (
    <SetupEnforcer>

      <div className="min-h-screen bg-[#0b0d0e] text-stone-100">

        <SiteHeader />

        <Routes>

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/loadouts"
            element={
              <PlaceholderPage
                title="Loadouts"
                description="Build, save, share and discover complete WARDOGS kits with weapons, attachments, armour, backpacks and equipment."
              />
            }
          />

          <Route
            path="/find-players"
            element={<FindPlayersPage />}
          />

          <Route path="/squads" element={<SquadsPage />} />

          <Route
            path="/armory"
            element={
              <PlaceholderPage
                title="Armory"
                description="Browse the WARDOGS equipment database, weapon attachments, backpacks, armour and other gear."
              />
            }
          />

          <Route
            path="/deals"
            element={<DealsPage />}
          />

          <Route
            path="/legal"
            element={<LegalPage />}
          />

          <Route
            path="/register"
            element={<RegistrationPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/auth/callback"
            element={<AuthCallbackPage />}
          />

          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <SetupPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

        </Routes>

        <SiteFooter />

      </div>

    </SetupEnforcer>
  )
}

export default App
