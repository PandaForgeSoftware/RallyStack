import { Route, Routes } from 'react-router-dom'
import SiteHeader from './components/layout/SiteHeader'
import FindPlayersPage from './pages/FindPlayersPage'
import HomePage from './pages/HomePage'
import PlaceholderPage from './pages/PlaceholderPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <div className="min-h-screen bg-[#0b0d0e] text-stone-100">
      <SiteHeader />

      <Routes>
        <Route path="/" element={<HomePage />} />

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

        <Route
          path="/squads"
          element={
            <PlaceholderPage
              title="Squads"
              description="Discover squads, manage rosters, recruit players and organise permanent groups including LAST ORDERS [LAST]."
            />
          }
        />

        <Route
          path="/armory"
          element={
            <PlaceholderPage
              title="Armory"
              description="Browse the WARDOGS equipment database, weapon attachments, backpacks, armour and other gear."
            />
          }
        />

        <Route path="/profile" element={<ProfilePage />} />
      </Routes>

      <footer className="border-t border-white/8 bg-[#090b0c]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-8 text-xs text-stone-600 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <span className="font-black text-stone-400">RALLYSTACK</span>
            <span className="mx-2">•</span>
            Community companion for WARDOGS
          </div>

          <div>
            Not affiliated with BULKHEAD or Team17.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
