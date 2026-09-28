import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  Crosshair,
  Gamepad2,
  Headphones,
  HeartPulse,
  MessageCircleMore,
  Plane,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const roleOptions = [
  {
    name: 'ASSAULT',
    icon: Crosshair,
    text: 'Frontline fighting and objective pressure.',
  },
  {
    name: 'MEDIC',
    icon: HeartPulse,
    text: 'Revives and squad medical support.',
  },
  {
    name: 'RECON',
    icon: Search,
    text: 'Scouting and longer-range engagements.',
  },
  {
    name: 'SUPPORT',
    icon: Wrench,
    text: 'Utility, logistics and repair support.',
  },
  {
    name: 'DRIVER',
    icon: Car,
    text: 'Ground vehicles and troop transport.',
  },
  {
    name: 'PILOT',
    icon: Plane,
    text: 'Aircraft transport and air support.',
  },
]

const defaultSetup = {
  callsign: '',
  region: 'UK / EU',
  playStyle: 'Casual Tactical',
  usualTimes: '19:00 - 23:00',
  mic: true,
  primaryRoles: [],
  secondaryRoles: [],
  discordConnected: false,
  steamConnected: false,
}

function SetupPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(defaultSetup)
  const [error, setError] = useState('')

  const updateField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const choosePrimary = (role) => {
    setError('')

    if (profile.primaryRoles.includes(role)) {
      setProfile((current) => ({
        ...current,
        primaryRoles: current.primaryRoles.filter((item) => item !== role),
      }))
      return
    }

    if (profile.primaryRoles.length >= 2) {
      setError('Choose a maximum of 2 primary roles.')
      return
    }

    setProfile((current) => ({
      ...current,
      primaryRoles: [...current.primaryRoles, role],
      secondaryRoles: current.secondaryRoles.filter((item) => item !== role),
    }))
  }

  const chooseSecondary = (role) => {
    setError('')

    if (profile.secondaryRoles.includes(role)) {
      setProfile((current) => ({
        ...current,
        secondaryRoles: current.secondaryRoles.filter((item) => item !== role),
      }))
      return
    }

    if (profile.secondaryRoles.length >= 3) {
      setError('Choose a maximum of 3 secondary roles.')
      return
    }

    setProfile((current) => ({
      ...current,
      primaryRoles: current.primaryRoles.filter((item) => item !== role),
      secondaryRoles: [...current.secondaryRoles, role],
    }))
  }

  const next = () => {
    setError('')

    if (step === 1 && !profile.callsign.trim()) {
      setError('Choose a callsign before continuing.')
      return
    }

    if (step === 2 && profile.primaryRoles.length === 0) {
      setError('Choose at least one primary role.')
      return
    }

    setStep((current) => Math.min(current + 1, 4))
  }

  const back = () => {
    setError('')
    setStep((current) => Math.max(current - 1, 1))
  }

  const finish = () => {
    const completedProfile = {
      ...profile,
      lookingForGroup: false,
      setupComplete: true,
      session: {
        active: false,
        serverCode: '',
      },
    }

    localStorage.setItem(
      'rallystack-profile',
      JSON.stringify(completedProfile),
    )

    navigate('/profile')
  }

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-9">
        <div className="text-[10px] font-black tracking-[0.3em] text-amber-500">
          FIRST TIME SETUP
        </div>

        <h1 className="mt-3 text-4xl font-black text-white">
          Set up your RallyStack
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
          A few quick choices and RallyStack will know who you want to play
          with, what roles you prefer and how other players can find you.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-4 border border-white/8 bg-[#0e1011]">
        {[
          'IDENTITY',
          'ROLES',
          'PLAY STYLE',
          'CONNECTIONS',
        ].map((label, index) => {
          const number = index + 1
          const active = step === number
          const complete = step > number

          return (
            <div
              key={label}
              className={[
                'border-r border-white/8 px-3 py-4 last:border-r-0',
                active ? 'bg-amber-500/[0.05]' : '',
              ].join(' ')}
            >
              <div
                className={[
                  'text-[9px] font-black tracking-wider',
                  active
                    ? 'text-amber-500'
                    : complete
                      ? 'text-emerald-400'
                      : 'text-stone-700',
                ].join(' ')}
              >
                {complete ? '✓' : `0${number}`}
              </div>

              <div
                className={[
                  'mt-1 text-[9px] font-black tracking-wider',
                  active ? 'text-white' : 'text-stone-600',
                ].join(' ')}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mb-5 border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs font-semibold text-red-400">
          {error}
        </div>
      )}

      <section className="border border-white/8 bg-[#0e1011]">

        {step === 1 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                STEP 1
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                Who are you?
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  CALLSIGN
                </span>

                <input
                  value={profile.callsign}
                  onChange={(event) =>
                    updateField('callsign', event.target.value)
                  }
                  placeholder="How players will see you"
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none placeholder:text-stone-700 focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  REGION
                </span>

                <select
                  value={profile.region}
                  onChange={(event) =>
                    updateField('region', event.target.value)
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
                >
                  <option>UK / EU</option>
                  <option>Europe</option>
                  <option>North America East</option>
                  <option>North America West</option>
                  <option>Oceania</option>
                  <option>Asia</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                STEP 2
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                What do you like to play?
              </h2>

              <p className="mt-2 text-xs text-stone-500">
                Choose up to 2 primary roles and 3 secondary roles.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {roleOptions.map((role) => {
                const Icon = role.icon
                const primary = profile.primaryRoles.includes(role.name)
                const secondary = profile.secondaryRoles.includes(role.name)

                return (
                  <article
                    key={role.name}
                    className={[
                      'border p-4',
                      primary
                        ? 'border-amber-500/50 bg-amber-500/[0.06]'
                        : secondary
                          ? 'border-sky-500/40 bg-sky-500/[0.04]'
                          : 'border-white/8 bg-[#111416]',
                    ].join(' ')}
                  >
                    <div className="flex gap-3">
                      <Icon
                        size={20}
                        className={
                          primary
                            ? 'text-amber-500'
                            : secondary
                              ? 'text-sky-400'
                              : 'text-stone-600'
                        }
                      />

                      <div>
                        <div className="text-xs font-black text-white">
                          {role.name}
                        </div>

                        <div className="mt-1 text-[10px] leading-4 text-stone-600">
                          {role.text}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => choosePrimary(role.name)}
                        className={[
                          'h-9 border text-[9px] font-black tracking-wider',
                          primary
                            ? 'border-amber-500 bg-amber-500 text-black'
                            : 'border-white/10 text-stone-500',
                        ].join(' ')}
                      >
                        PRIMARY
                      </button>

                      <button
                        type="button"
                        onClick={() => chooseSecondary(role.name)}
                        className={[
                          'h-9 border text-[9px] font-black tracking-wider',
                          secondary
                            ? 'border-sky-500 bg-sky-500 text-black'
                            : 'border-white/10 text-stone-500',
                        ].join(' ')}
                      >
                        SECONDARY
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                STEP 3
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                How do you play?
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  PLAY STYLE
                </span>

                <select
                  value={profile.playStyle}
                  onChange={(event) =>
                    updateField('playStyle', event.target.value)
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
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

                <input
                  value={profile.usualTimes}
                  onChange={(event) =>
                    updateField('usualTimes', event.target.value)
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => updateField('mic', !profile.mic)}
              className={[
                'mt-5 flex w-full items-center justify-between border p-4',
                profile.mic
                  ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                  : 'border-white/8 bg-[#111416]',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <Headphones
                  size={20}
                  className={
                    profile.mic ? 'text-emerald-400' : 'text-stone-600'
                  }
                />

                <div className="text-left">
                  <div className="text-xs font-black text-white">
                    MICROPHONE
                  </div>

                  <div className="mt-1 text-[10px] text-stone-600">
                    Let other players know whether you use voice comms.
                  </div>
                </div>
              </div>

              <div className="text-xs font-black text-emerald-400">
                {profile.mic ? 'YES' : 'NO'}
              </div>
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                STEP 4
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                Connect your accounts
              </h2>

              <p className="mt-2 text-xs text-stone-500">
                Optional for now. These will use real OAuth once Supabase and
                the RallyStack integrations are connected.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  updateField(
                    'discordConnected',
                    !profile.discordConnected,
                  )
                }
                className={[
                  'border p-5 text-left transition',
                  profile.discordConnected
                    ? 'border-[#5865F2]/50 bg-[#5865F2]/10'
                    : 'border-white/8 bg-[#111416]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <MessageCircleMore
                    size={25}
                    className="text-[#8d96ff]"
                  />

                  {profile.discordConnected && (
                    <Check size={18} className="text-emerald-400" />
                  )}
                </div>

                <div className="mt-5 text-sm font-black text-white">
                  DISCORD
                </div>

                <div className="mt-2 text-xs leading-5 text-stone-500">
                  LFG commands, squad community, voice presence and server
                  session shortcuts.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateField(
                    'steamConnected',
                    !profile.steamConnected,
                  )
                }
                className={[
                  'border p-5 text-left transition',
                  profile.steamConnected
                    ? 'border-sky-500/40 bg-sky-500/[0.06]'
                    : 'border-white/8 bg-[#111416]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <Gamepad2
                    size={25}
                    className="text-sky-400"
                  />

                  {profile.steamConnected && (
                    <Check size={18} className="text-emerald-400" />
                  )}
                </div>

                <div className="mt-5 text-sm font-black text-white">
                  STEAM
                </div>

                <div className="mt-2 text-xs leading-5 text-stone-500">
                  Game identity, profile information and WARDOGS presence
                  where available.
                </div>
              </button>
            </div>

            <div className="mt-5 border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>
                  <div className="text-xs font-black text-white">
                    You can change this later
                  </div>

                  <div className="mt-1 text-[10px] leading-5 text-stone-600">
                    Discord and Steam are optional. RallyStack itself will not
                    require either account to use basic LFG and loadout tools.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/8 p-5">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="flex h-11 items-center gap-2 border border-white/10 px-4 text-[10px] font-black tracking-wider text-stone-500 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft size={15} />
            BACK
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="flex h-11 items-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black"
            >
              CONTINUE
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="flex h-11 items-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black"
            >
              FINISH SETUP
              <Check size={15} />
            </button>
          )}
        </div>
      </section>
    </main>
  )
}

export default SetupPage
