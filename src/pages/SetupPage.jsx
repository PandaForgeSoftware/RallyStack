import {
  useEffect,
  useState,
} from 'react'
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
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
  inGameName: '',
  region: 'UK / EU',
  playStyle: 'Casual Tactical',
  usualTimes: '19:00 - 23:00',
  mic: true,
  primaryRoles: [],
  secondaryRoles: [],
}

function loadDraft() {
  try {
    const saved = sessionStorage.getItem('rallystack-setup-draft')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function SetupPage() {
  const navigate = useNavigate()
  const { user, profile: storedProfile, refreshProfile } = useAuth()

  const [step, setStep] = useState(() => {
    const saved = Number(
      sessionStorage.getItem('rallystack-setup-step') || 1,
    )

    return saved >= 1 && saved <= 4 ? saved : 1
  })

  const [profile, setProfile] = useState(
    () => loadDraft() || defaultSetup,
  )

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [discordConnected, setDiscordConnected] = useState(false)

  useEffect(() => {
    if (loadDraft()) return
    if (!storedProfile) return

    setProfile({
      inGameName: storedProfile.in_game_name || '',
      region: storedProfile.region || 'UK / EU',
      playStyle: storedProfile.play_style || 'Casual Tactical',
      usualTimes: storedProfile.usual_play_times || '19:00 - 23:00',
      mic: storedProfile.mic ?? true,
      primaryRoles: storedProfile.primary_roles || [],
      secondaryRoles: storedProfile.secondary_roles || [],
    })
  }, [storedProfile])

  useEffect(() => {
    const checkDiscord = async () => {
      const { data } = await supabase.auth.getUserIdentities()

      const identities = data?.identities || []

      setDiscordConnected(
        identities.some((identity) => identity.provider === 'discord'),
      )
    }

    checkDiscord()
  }, [])

  const persistDraft = (nextProfile = profile, nextStep = step) => {
    sessionStorage.setItem(
      'rallystack-setup-draft',
      JSON.stringify(nextProfile),
    )

    sessionStorage.setItem(
      'rallystack-setup-step',
      String(nextStep),
    )
  }

  const updateField = (field, value) => {
    const updated = {
      ...profile,
      [field]: value,
    }

    setProfile(updated)
    persistDraft(updated, step)
  }

  const choosePrimary = (role) => {
    setError('')

    let updated

    if (profile.primaryRoles.includes(role)) {
      updated = {
        ...profile,
        primaryRoles: profile.primaryRoles.filter(
          (item) => item !== role,
        ),
      }
    } else {
      if (profile.primaryRoles.length >= 2) {
        setError('Choose a maximum of 2 primary roles.')
        return
      }

      updated = {
        ...profile,
        primaryRoles: [...profile.primaryRoles, role],
        secondaryRoles: profile.secondaryRoles.filter(
          (item) => item !== role,
        ),
      }
    }

    setProfile(updated)
    persistDraft(updated, step)
  }

  const chooseSecondary = (role) => {
    setError('')

    let updated

    if (profile.secondaryRoles.includes(role)) {
      updated = {
        ...profile,
        secondaryRoles: profile.secondaryRoles.filter(
          (item) => item !== role,
        ),
      }
    } else {
      if (profile.secondaryRoles.length >= 3) {
        setError('Choose a maximum of 3 secondary roles.')
        return
      }

      updated = {
        ...profile,
        primaryRoles: profile.primaryRoles.filter(
          (item) => item !== role,
        ),
        secondaryRoles: [...profile.secondaryRoles, role],
      }
    }

    setProfile(updated)
    persistDraft(updated, step)
  }

  const next = () => {
    setError('')

    if (step === 1 && !profile.inGameName.trim()) {
      setError('Enter your in-game name before continuing.')
      return
    }

    if (step === 2 && profile.primaryRoles.length === 0) {
      setError('Choose at least one primary role.')
      return
    }

    const nextStep = Math.min(step + 1, 4)

    setStep(nextStep)
    persistDraft(profile, nextStep)
  }

  const back = () => {
    setError('')

    const nextStep = Math.max(step - 1, 1)

    setStep(nextStep)
    persistDraft(profile, nextStep)
  }

  const connectDiscord = async () => {
    setError('')

    persistDraft(profile, 4)

    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: 'discord',
    })

    if (linkError) {
      setError(
        `Discord is not ready yet: ${linkError.message}`,
      )
    }
  }

  const finish = async () => {
    if (!user) return

    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        in_game_name: profile.inGameName.trim(),
        region: profile.region,
        play_style: profile.playStyle,
        usual_play_times: profile.usualTimes,
        mic: profile.mic,
        primary_roles: profile.primaryRoles,
        secondary_roles: profile.secondaryRoles,
        setup_complete: true,
      })
      .eq('id', user.id)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    sessionStorage.removeItem('rallystack-setup-draft')
    sessionStorage.removeItem('rallystack-setup-step')

    await refreshProfile()

    navigate('/profile', {
      replace: true,
    })
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
          Set your in-game identity, roles and play preferences once.
          RallyStack will use them for LFG and squad matching.
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
                Who are you in WARDOGS?
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  IN-GAME NAME
                </span>

                <input
                  value={profile.inGameName}
                  onChange={(event) =>
                    updateField(
                      'inGameName',
                      event.target.value,
                    )
                  }
                  placeholder="Your WARDOGS name"
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
                    updateField(
                      'region',
                      event.target.value,
                    )
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
                const primary =
                  profile.primaryRoles.includes(role.name)

                const secondary =
                  profile.secondaryRoles.includes(role.name)

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
                        onClick={() =>
                          choosePrimary(role.name)
                        }
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
                        onClick={() =>
                          chooseSecondary(role.name)
                        }
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
                    updateField(
                      'playStyle',
                      event.target.value,
                    )
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
                    updateField(
                      'usualTimes',
                      event.target.value,
                    )
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                updateField('mic', !profile.mic)
              }
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
                    profile.mic
                      ? 'text-emerald-400'
                      : 'text-stone-600'
                  }
                />

                <div className="text-left">
                  <div className="text-xs font-black text-white">
                    MICROPHONE
                  </div>

                  <div className="mt-1 text-[10px] text-stone-600">
                    Tell other players whether you use voice comms.
                  </div>
                </div>
              </div>

              <div
                className={[
                  'text-xs font-black',
                  profile.mic
                    ? 'text-emerald-400'
                    : 'text-stone-500',
                ].join(' ')}
              >
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
                These are optional. Your RallyStack profile works without
                either connection.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={
                  discordConnected
                    ? undefined
                    : connectDiscord
                }
                className={[
                  'border p-5 text-left transition',
                  discordConnected
                    ? 'border-[#5865F2]/50 bg-[#5865F2]/10'
                    : 'border-white/8 bg-[#111416] hover:border-[#5865F2]/40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <MessageCircleMore
                    size={25}
                    className="text-[#8d96ff]"
                  />

                  {discordConnected && (
                    <Check
                      size={18}
                      className="text-emerald-400"
                    />
                  )}
                </div>

                <div className="mt-5 text-sm font-black text-white">
                  DISCORD
                </div>

                <div className="mt-2 text-xs leading-5 text-stone-500">
                  {discordConnected
                    ? 'Discord identity connected.'
                    : 'Connect Discord for LFG commands, squad features and server session shortcuts.'}
                </div>

                <div className="mt-4 text-[9px] font-black tracking-wider text-[#8d96ff]">
                  {discordConnected
                    ? 'CONNECTED'
                    : 'CONNECT DISCORD'}
                </div>
              </button>

              <div className="border border-white/8 bg-[#111416] p-5">
                <div className="flex items-center justify-between">
                  <Gamepad2
                    size={25}
                    className="text-sky-400"
                  />

                  <span className="text-[9px] font-black tracking-wider text-stone-600">
                    NEXT
                  </span>
                </div>

                <div className="mt-5 text-sm font-black text-white">
                  STEAM
                </div>

                <div className="mt-2 text-xs leading-5 text-stone-500">
                  Steam will use Valve's real login flow. We will wire
                  that immediately after Discord.
                </div>

                <div className="mt-4 text-[9px] font-black tracking-wider text-sky-400">
                  STEAM LINKING NEXT
                </div>
              </div>
            </div>

            <div className="mt-5 border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>
                  <div className="text-xs font-black text-white">
                    Connections are optional
                  </div>

                  <div className="mt-1 text-[10px] leading-5 text-stone-600">
                    RallyStack will never require Discord or Steam just
                    to use basic loadout and LFG features.
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
              disabled={saving}
              className="flex h-11 items-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'FINISH SETUP'}
              {!saving && <Check size={15} />}
            </button>
          )}
        </div>
      </section>
    </main>
  )
}

export default SetupPage
