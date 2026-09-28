import { NavLink } from 'react-router-dom'
import {
  Bell,
  LogOut,
  Menu,
  Search,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const navItems = [
  { label: 'HOME', path: '/' },
  { label: 'LOADOUTS', path: '/loadouts' },
  { label: 'FIND PLAYERS', path: '/find-players' },
  { label: 'SQUADS', path: '/squads' },
  { label: 'ARMORY', path: '/armory' },
]

function SiteHeader() {
  const { user, loading } = useAuth()

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0b0d0e]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1500px] items-center px-5 lg:px-8">
        <NavLink
          to="/"
          className="mr-10 flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden border border-amber-500/40 bg-amber-500/10">
            <img
              src="/rallystack-mark.svg"
              alt="RallyStack logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="leading-none">
            <div className="text-xl font-black tracking-tight text-white">
              RALLY
              <span className="text-amber-500">
                STACK
              </span>
            </div>

            <div className="mt-1 text-[9px] font-bold tracking-[0.3em] text-stone-500">
              WARDOGS COMMUNITY
            </div>
          </div>
        </NavLink>

        <nav className="hidden h-full items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'relative flex h-full items-center px-4 text-[12px] font-bold tracking-[0.12em] transition',
                  isActive
                    ? 'text-white'
                    : 'text-stone-500 hover:text-stone-200',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}

                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-amber-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button className="hidden h-10 w-10 items-center justify-center border border-white/8 text-stone-400 sm:flex">
            <Search size={18} />
          </button>

          {user && (
            <button className="hidden h-10 w-10 items-center justify-center border border-white/8 text-stone-400 sm:flex">
              <Bell size={18} />
            </button>
          )}

          {!loading && user ? (
            <>
              <NavLink
                to="/profile"
                className="hidden h-10 items-center gap-3 border border-white/8 px-4 text-sm font-semibold text-stone-300 sm:flex"
              >
                <UserRound size={17} />
                MY PROFILE
              </NavLink>

              <button
                type="button"
                onClick={signOut}
                className="hidden h-10 w-10 items-center justify-center border border-white/8 text-stone-500 transition hover:text-red-400 sm:flex"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : !loading ? (
            <>
              <NavLink
                to="/login"
                className="hidden h-10 items-center px-4 text-xs font-black tracking-wider text-stone-400 sm:flex"
              >
                SIGN IN
              </NavLink>

              <NavLink
                to="/register"
                className="hidden h-10 items-center gap-2 bg-amber-500 px-4 text-xs font-black tracking-wider text-black sm:flex"
              >
                <UserPlus size={15} />
                REGISTER
              </NavLink>
            </>
          ) : null}

          <button className="flex h-10 w-10 items-center justify-center border border-white/8 text-stone-300 lg:hidden">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
