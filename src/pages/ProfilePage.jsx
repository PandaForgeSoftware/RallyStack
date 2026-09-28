import { useState } from 'react'
import {
  BadgeCheck,
  Backpack,
  Car,
  Clock3,
  Crosshair,
  Gamepad2,
  Headphones,
  HeartPulse,
  MapPin,
  Plane,
  Save,
  Search,
  Shield,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import ConnectedAccountsCard from '../features/profiles/components/ConnectedAccountsCard'
import CurrentSessionCard from '../features/profiles/components/CurrentSessionCard'
import RolePreferenceCard from '../features/profiles/components/RolePreferenceCard'

const roles = [
  {
    name: 'ASSAULT',
    icon: Crosshair,
    description: 'Frontline fighting, pushing objectives and direct combat.',
  },
  {
    name: 'MEDIC',
    icon: HeartPulse,
    description: 'Revives, medical support and keeping the squad fighting.',
  },
  {
    name: 'RECON',
    icon: Search,
    description: 'Scouting, observation and longer-range engagements.',
  },
  {
    name: 'SUPPORT',
    icon: Wrench,
    description: 'Utility, logistics, repairs and supporting the wider squad.',
  },
  {
    name: 'DRIVER',
    icon: Car,
    description: 'Transport, ground vehicles and moving the squad around.',
  },
  {
    name: 'PILOT',
    icon: Plane,
    description: 'Aircraft operations, transport and air support.',
  },
]

const defaultProfile = {
  callsign: '',
  region: 'UK / EU',
  playStyle: 'Casual Tactical',
  usualTimes: '19:00 - 23:00',
  mic: true,
  lookingForGroup: false,
  primaryRoles: [],
  secondaryRoles: [],
  discordConnected: false,
  steamConnected: false,
  session: {
    active: false,
    serverCode: '',
  },
}

function loadSavedProfile() {
  try {
    const saved = localStorage.getItem('rallystack-profile')

    if (!saved) {
      return defaultProfile
    }

    return {
      ...defaultProfile,
      ...JSON.parse(saved),
      session: {
        ...defaultProfile.session,
        ...(JSON.parse(saved).session || {}),
      },
    }
  } catch {
    return defaultProfile
  }
}

function ProfilePage() {
  const [profile, setProfile] = useState(loadSavedProfile)
  const [message, setMessage] = useState('')

  const updateField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const getRoleState = (role) => {
    if (profile.primaryRoles.includes(role)) return 'primary'
    if (profile.secondaryRoles.includes(role)) return 'secondary'
    return null
  }

  const setPrimaryRole = (role) => {
    setMessage('')

    if (profile.primaryRoles.includes(role)) return

    if (profile.primaryRoles.length >= 2) {
      setMessage('You can select up to 2 primary roles.')
      return
    }

    setProfile((current) => ({
      ...current,
      primaryRoles: [...current.primaryRoles, role],
      secondaryRoles: current.secondaryRoles.filter((item) => item !== role),
    }))
  }

  const setSecondaryRole = (role) => {
    setMessage('')

    if (profile.secondaryRoles.includes(role)) return

    if (profile.secondaryRoles.length >= 3) {
      setMessage('You can select up to 3 secondary roles.')
      return
    }

    setProfile((current) => ({
      ...current,
      primaryRoles: current.primaryRoles.filter((item) => item !== role),
      secondaryRoles: [...current.secondaryRoles, role],
    }))
  }

  const clearRole = (role) => {
    setProfile((current) => ({
      ...current,
      primaryRoles: current.primaryRoles.filter((item) => item !== role),
      secondaryRoles: current.secondaryRoles.filter((item) => item !== role),
    }))
  }

  const setSession = (serverCode) => {
    setProfile((current) => ({
      ...current,
      lookingForGroup: true,
      session: {
        active: true,
        serverCode,
      },
    }))

    setMessage('Current WARDOGS session updated.')
  }

  const clearSession = () => {
    setProfile((current) => ({
      ...current,
      session: {
        active: false,
        serverCode: '',
      },
    }))

    setMessage('Current session cleared.')
  }

  const connectDiscord = () => {
    updateField('discordConnected', true)
    setMessage('Discord connected in preview mode.')
  }

  const connectSteam = () => {
    updateField('steamConnected', true)
    setMessage('Steam connected in preview mode.')
  }

  const saveProfile = () => {
    localStorage.setItem('rallystack-profile', JSON.stringify(profile))
    setMessage('Profile saved locally.')
  }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-10 flex flex-col gap-6 border-b border-white/8 pb-9 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-500" />

            <span className="text-[10px] font-bold tracking-[0.3em] text-amber-500">
              PLAYER PROFILE
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            MY RALLYSTACK
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
            Your RallyStack identity, role preferences, connected accounts and
            current WARDOGS session.
          </p>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          className="flex h-12 items-center justify-center gap-2 bg-amber-500 px-6 text-xs font-black tracking-wider text-black transition hover:bg-amber-400"
        >
          <Save size={17} />
          SAVE PROFILE
        </button>
      </div>

      {message && (
        <div className="mb-6 border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs font-semibold text-amber-400">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_370px]">
        <div className="space-y-6">

          <section className="border border-white/8 bg-[#0e1011]">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.25em] text-stone-500">
                PLAYER DETAILS
              </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  CALLSIGN / DISPLAY NAME
                </span>

                <input
                  value={profile.callsign}
                  onChange={(event) => updateField('callsign', event.target.value)}
                  placeholder="Your callsign"
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none placeholder:text-stone-700 focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  REGION
                </span>

                <select
                  value={profile.region}
                  onChange={(event) => updateField('region', event.target.value)}
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option>UK / EU</option>
                  <option>Europe</option>
                  <option>North America East</option>
                  <option>North America West</option>
                  <option>Oceania</option>
                  <option>Asia</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  PLAY STYLE
                </span>

                <select
                  value={profile.playStyle}
                  onChange={(event) => updateField('playStyle', event.target.value)}
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option>Casual</option>
                  <option>Casual Tactical</option>
                  <option>Tactical</option>
                  <option>Competitive</option>
                  <option>New Player</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  USUAL PLAY TIMES
                </span>

                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
                  />

                  <input
                    value={profile.usualTimes}
                    onChange={(event) => updateField('usualTimes', event.target.value)}
                    className="h-12 w-full border border-white/10 bg-[#0b0d0e] pl-11 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="border border-white/8 bg-[#0e1011]">
            <div className="flex flex-col gap-2 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                  ROLE PREFERENCES
                </div>

                <div className="mt-1 text-xs text-stone-500">
                  Choose up to 2 primary and 3 secondary roles.
                </div>
              </div>

              <div className="text-[10px] font-bold tracking-wider text-stone-600">
                USED FOR LFG MATCHING
              </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => (
                <RolePreferenceCard
                  key={role.name}
                  role={role.name}
                  icon={role.icon}
                  description={role.description}
                  state={getRoleState(role.name)}
                  onPrimary={() => setPrimaryRole(role.name)}
                  onSecondary={() => setSecondaryRole(role.name)}
                  onClear={() => clearRole(role.name)}
                />
              ))}
            </div>
          </section>

          <CurrentSessionCard
            session={profile.session}
            discordConnected={profile.discordConnected}
            onSetSession={setSession}
            onClearSession={clearSession}
          />

          <section className="border border-white/8 bg-[#0e1011]">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.25em] text-stone-500">
                LOOKING FOR GROUP
              </div>
            </div>

            <div className="p-5">
              <button
                type="button"
                onClick={() =>
                  updateField('lookingForGroup', !profile.lookingForGroup)
                }
                className={[
                  'flex w-full items-center justify-between border p-4 text-left transition',
                  profile.lookingForGroup
                    ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                    : 'border-white/8 bg-[#111416]',
                ].join(' ')}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={[
                      'flex h-11 w-11 items-center justify-center border',
                      profile.lookingForGroup
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/8 text-stone-600',
                    ].join(' ')}
                  >
                    <Users size={21} />
                  </div>

                  <div>
                    <div className="text-sm font-black text-white">
                      {profile.lookingForGroup
                        ? 'LOOKING TO PLAY'
                        : 'NOT LOOKING FOR A GROUP'}
                    </div>

                    <div className="mt-1 text-xs text-stone-500">
                      Show yourself on the Find Players board.
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    'relative h-6 w-11 rounded-full transition',
                    profile.lookingForGroup
                      ? 'bg-emerald-500'
                      : 'bg-stone-800',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-1 h-4 w-4 rounded-full bg-white transition',
                      profile.lookingForGroup ? 'left-6' : 'left-1',
                    ].join(' ')}
                  />
                </div>
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-5">

          <section className="border border-white/8 bg-[#111416]">
            <div className="border-b border-white/8 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border border-white/10 bg-black/20">
                  <Gamepad2 size={28} className="text-stone-600" />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-lg font-black text-white">
                    {profile.callsign || 'YOUR CALLSIGN'}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                    <MapPin size={13} />
                    {profile.region}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/8 border-b border-white/8">
              <div className="p-4">
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  STYLE
                </div>

                <div className="mt-1 text-xs font-bold text-stone-300">
                  {profile.playStyle}
                </div>
              </div>

              <div className="p-4">
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  MIC
                </div>

                <button
                  type="button"
                  onClick={() => updateField('mic', !profile.mic)}
                  className={[
                    'mt-1 flex items-center gap-2 text-xs font-bold',
                    profile.mic ? 'text-emerald-400' : 'text-stone-500',
                  ].join(' ')}
                >
                  <Headphones size={13} />
                  {profile.mic ? 'YES' : 'NO'}
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3 text-[9px] font-bold tracking-wider text-stone-600">
                PRIMARY ROLES
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.primaryRoles.length === 0 && (
                  <span className="text-xs text-stone-600">
                    No primary roles selected.
                  </span>
                )}

                {profile.primaryRoles.map((role) => (
                  <span
                    key={role}
                    className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 text-[10px] font-black tracking-wider text-amber-500"
                  >
                    <Star size={11} fill="currentColor" />
                    {role}
                  </span>
                ))}
              </div>

              <div className="mb-3 mt-5 text-[9px] font-bold tracking-wider text-stone-600">
                SECONDARY ROLES
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.secondaryRoles.length === 0 && (
                  <span className="text-xs text-stone-600">
                    No secondary roles selected.
                  </span>
                )}

                {profile.secondaryRoles.map((role) => (
                  <span
                    key={role}
                    className="bg-sky-500/10 px-2 py-1 text-[10px] font-black tracking-wider text-sky-400"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <ConnectedAccountsCard
            discordConnected={profile.discordConnected}
            steamConnected={profile.steamConnected}
            onDiscord={connectDiscord}
            onSteam={connectSteam}
          />

          <section className="border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <div className="flex items-start gap-3">
              <Shield size={22} className="mt-1 shrink-0 text-amber-500" />

              <div>
                <div className="text-[10px] font-bold tracking-[0.25em] text-amber-500">
                  CURRENT SQUAD
                </div>

                <div className="mt-2 text-xl font-black text-white">
                  LAST ORDERS <span className="text-amber-500">[LAST]</span>
                </div>

                <div className="mt-2 text-xs font-bold tracking-[0.15em] text-stone-400">
                  ONE MORE ROUND.
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/8 pt-4">
              <div>
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  REGION
                </div>

                <div className="mt-1 text-xs font-bold text-stone-300">
                  UK / EU
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  STATUS
                </div>

                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <BadgeCheck size={13} />
                  MEMBER
                </div>
              </div>
            </div>
          </section>

          <section className="border border-white/8 bg-[#111416] p-5">
            <div className="flex items-center gap-3">
              <Backpack size={20} className="text-amber-500" />

              <div>
                <div className="text-sm font-black text-white">
                  MY LOADOUTS
                </div>

                <div className="mt-1 text-xs text-stone-500">
                  Saved builds will appear here.
                </div>
              </div>
            </div>

            <div className="mt-5 border border-dashed border-white/10 p-5 text-center">
              <div className="text-xs font-bold text-stone-500">
                NO SAVED LOADOUTS YET
              </div>

              <div className="mt-2 text-[10px] text-stone-700">
                Build your first kit in the Loadout Builder.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default ProfilePage
