import { useMemo, useState } from 'react'
import {
  Filter,
  Radio,
  Search,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react'
import LfgGroupCard from '../features/lfg/components/LfgGroupCard'
import LfgPlayerCard from '../features/lfg/components/LfgPlayerCard'

const mockPlayers = [
  {
    id: 1,
    name: 'GhostActual',
    squad: '[VNGD]',
    squadName: 'Vanguard',
    region: 'UK / EU',
    time: 'Playing now',
    mic: true,
    playStyle: 'Tactical',
    primaryRoles: ['MEDIC'],
    secondaryRoles: ['SUPPORT', 'ASSAULT'],
    serverCode: '004217',
  },
  {
    id: 2,
    name: 'GreyFox',
    squad: '',
    squadName: '',
    region: 'UK / EU',
    time: 'Playing now',
    mic: true,
    playStyle: 'Casual Tactical',
    primaryRoles: ['RECON'],
    secondaryRoles: ['ASSAULT'],
    serverCode: '',
  },
  {
    id: 3,
    name: 'DocHoliday',
    squad: '[NW]',
    squadName: 'Night Watch',
    region: 'Europe',
    time: 'Tonight',
    mic: true,
    playStyle: 'Casual',
    primaryRoles: ['MEDIC'],
    secondaryRoles: ['SUPPORT'],
    serverCode: '',
  },
  {
    id: 4,
    name: 'HeavyMetal',
    squad: '',
    squadName: '',
    region: 'UK / EU',
    time: 'Playing now',
    mic: false,
    playStyle: 'Casual',
    primaryRoles: ['DRIVER'],
    secondaryRoles: ['SUPPORT'],
    serverCode: '001842',
  },
  {
    id: 5,
    name: 'RavenSix',
    squad: '[VNGD]',
    squadName: 'Vanguard',
    region: 'Europe',
    time: '20:00 BST',
    mic: true,
    playStyle: 'Competitive',
    primaryRoles: ['ASSAULT'],
    secondaryRoles: ['RECON'],
    serverCode: '',
  },
  {
    id: 6,
    name: 'SkyHook',
    squad: '',
    squadName: '',
    region: 'UK / EU',
    time: 'Playing now',
    mic: true,
    playStyle: 'Casual Tactical',
    primaryRoles: ['PILOT'],
    secondaryRoles: ['DRIVER', 'SUPPORT'],
    serverCode: '003901',
  },
]

const mockGroups = [
  {
    id: 1,
    name: 'LAST ORDERS - Casual Run',
    host: '[LAST] Panda',
    region: 'UK / EU',
    playStyle: 'Casual Tactical',
    players: 3,
    maxPlayers: 5,
    roles: ['MEDIC', 'SUPPORT'],
    micRequired: true,
    serverCode: '004217',
  },
  {
    id: 2,
    name: 'New Players Welcome',
    host: 'GreyFox',
    region: 'UK / EU',
    playStyle: 'Casual',
    players: 2,
    maxPlayers: 5,
    roles: ['ANY ROLE'],
    micRequired: false,
    serverCode: '',
  },
  {
    id: 3,
    name: 'Vehicle Crew',
    host: 'HeavyMetal',
    region: 'Europe',
    playStyle: 'Tactical',
    players: 2,
    maxPlayers: 4,
    roles: ['DRIVER', 'SUPPORT'],
    micRequired: true,
    serverCode: '001842',
  },
]

const roleOptions = [
  'ALL ROLES',
  'ASSAULT',
  'MEDIC',
  'RECON',
  'SUPPORT',
  'DRIVER',
  'PILOT',
]

function getSavedProfile() {
  try {
    const raw = localStorage.getItem('rallystack-profile')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function FindPlayersPage() {
  const [activeTab, setActiveTab] = useState('players')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL ROLES')
  const [regionFilter, setRegionFilter] = useState('ALL REGIONS')
  const [micOnly, setMicOnly] = useState(false)
  const [profile, setProfile] = useState(getSavedProfile)
  const [selfLive, setSelfLive] = useState(
    () => getSavedProfile()?.lookingForGroup || false,
  )

  const myPlayer = useMemo(() => {
    if (!profile || !selfLive) {
      return null
    }

    return {
      id: 'self',
      name: profile.callsign || 'YOUR CALLSIGN',
      squad: '[LAST]',
      squadName: 'LAST ORDERS',
      region: profile.region || 'UK / EU',
      time: 'Playing now',
      mic: profile.mic ?? true,
      playStyle: profile.playStyle || 'Casual Tactical',
      primaryRoles: profile.primaryRoles || [],
      secondaryRoles: profile.secondaryRoles || [],
      serverCode:
        profile.session?.active && profile.session?.serverCode
          ? profile.session.serverCode
          : '',
    }
  }, [profile, selfLive])

  const toggleMyLfg = () => {
    const saved = getSavedProfile()

    if (!saved) {
      return
    }

    const nextState = !selfLive

    const updated = {
      ...saved,
      lookingForGroup: nextState,
    }

    localStorage.setItem('rallystack-profile', JSON.stringify(updated))

    setProfile(updated)
    setSelfLive(nextState)
  }

  const visiblePlayers = useMemo(() => {
    const source = myPlayer
      ? [myPlayer, ...mockPlayers]
      : mockPlayers

    return source.filter((player) => {
      const searchMatch =
        !query ||
        player.name.toLowerCase().includes(query.toLowerCase()) ||
        player.squadName.toLowerCase().includes(query.toLowerCase())

      const allRoles = [
        ...player.primaryRoles,
        ...player.secondaryRoles,
      ]

      const roleMatch =
        roleFilter === 'ALL ROLES' ||
        allRoles.includes(roleFilter)

      const regionMatch =
        regionFilter === 'ALL REGIONS' ||
        player.region === regionFilter

      const micMatch = !micOnly || player.mic

      return searchMatch && roleMatch && regionMatch && micMatch
    })
  }, [
    query,
    roleFilter,
    regionFilter,
    micOnly,
    myPlayer,
  ])

  const resetFilters = () => {
    setQuery('')
    setRoleFilter('ALL ROLES')
    setRegionFilter('ALL REGIONS')
    setMicOnly(false)
  }

  return (
    <main>
      <section className="border-b border-white/8 bg-[#0e1011]">
        <div className="mx-auto max-w-[1500px] px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-[2px] w-8 bg-amber-500" />

                <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
                  LOOKING FOR GROUP
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                FIND PLAYERS
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
                Find WARDOGS players by role, region and play style or
                jump into a group that already needs what you like to play.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleMyLfg}
              disabled={!profile}
              className={[
                'flex h-12 items-center justify-center gap-2 px-6 text-xs font-black tracking-wider transition',
                selfLive
                  ? 'border border-red-500/30 bg-red-500/[0.06] text-red-400'
                  : 'bg-amber-500 text-black hover:bg-amber-400',
                !profile ? 'cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              <Radio size={16} />

              {selfLive ? 'STOP LOOKING' : 'I\'M LOOKING TO PLAY'}
            </button>
          </div>

          {!profile && (
            <div className="mt-6 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-amber-400">
              Create and save your profile first so RallyStack knows your
              region and preferred roles.
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0b0d0e]">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={[
                'relative flex h-16 items-center gap-2 text-xs font-black tracking-wider',
                activeTab === 'players'
                  ? 'text-white'
                  : 'text-stone-600 hover:text-stone-300',
              ].join(' ')}
            >
              <UserRoundSearch size={16} />
              PLAYERS

              {activeTab === 'players' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={[
                'relative flex h-16 items-center gap-2 text-xs font-black tracking-wider',
                activeTab === 'groups'
                  ? 'text-white'
                  : 'text-stone-600 hover:text-stone-300',
              ].join(' ')}
            >
              <Users size={16} />
              GROUPS

              {activeTab === 'groups' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {activeTab === 'players' ? (
          <>
            <div className="mb-7 border border-white/8 bg-[#0e1011] p-4">
              <div className="grid gap-3 xl:grid-cols-[1fr_190px_190px_auto_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
                  />

                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search player or squad..."
                    className="h-11 w-full border border-white/8 bg-[#0b0d0e] pl-11 pr-4 text-xs text-white outline-none placeholder:text-stone-700 focus:border-amber-500/40"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="h-11 border border-white/8 bg-[#0b0d0e] px-3 text-xs font-bold text-stone-300 outline-none"
                >
                  {roleOptions.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={regionFilter}
                  onChange={(event) => setRegionFilter(event.target.value)}
                  className="h-11 border border-white/8 bg-[#0b0d0e] px-3 text-xs font-bold text-stone-300 outline-none"
                >
                  <option>ALL REGIONS</option>
                  <option>UK / EU</option>
                  <option>Europe</option>
                  <option>North America East</option>
                  <option>North America West</option>
                  <option>Oceania</option>
                  <option>Asia</option>
                </select>

                <button
                  type="button"
                  onClick={() => setMicOnly(!micOnly)}
                  className={[
                    'flex h-11 items-center justify-center gap-2 border px-4 text-[10px] font-black tracking-wider transition',
                    micOnly
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-400'
                      : 'border-white/8 text-stone-500',
                  ].join(' ')}
                >
                  <Filter size={14} />
                  MIC ONLY
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-11 items-center justify-center gap-2 border border-white/8 px-4 text-[10px] font-black tracking-wider text-stone-500 transition hover:text-white"
                >
                  <X size={14} />
                  RESET
                </button>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div className="text-xs font-bold text-stone-500">
                <span className="text-white">
                  {visiblePlayers.length}
                </span>{' '}
                players match your filters
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                LIVE LFG
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlayers.map((player) => (
                <LfgPlayerCard
                  key={player.id}
                  player={player}
                  isYou={player.id === 'self'}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-7 flex flex-col gap-5 border border-white/8 bg-[#0e1011] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-black text-white">
                  CREATE A GROUP
                </div>

                <div className="mt-1 text-xs text-stone-500">
                  Start a temporary group and tell people which roles you need.
                </div>
              </div>

              <button
                type="button"
                className="h-11 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
              >
                CREATE GROUP
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {mockGroups.map((group) => (
                <LfgGroupCard
                  key={group.id}
                  group={group}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default FindPlayersPage
