import {
  useEffect,
  useState,
} from 'react'
import {
  Car,
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
  Wrench,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
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
    description: 'Utility, logistics, repairs and wider squad support.',
  },
  {
    name: 'DRIVER',
    icon: Car,
    description: 'Transport, ground vehicles and moving the squad.',
  },
  {
    name: 'PILOT',
    icon: Plane,
    description: 'Aircraft operations, transport and air support.',
  },
]

function ProfilePage() {
  const {
    user,
    profile: storedProfile,
    refreshProfile,
  } = useAuth()

  const [form, setForm] = useState({
    inGameName: '',
    region: 'UK / EU',
    playStyle: 'Casual Tactical',
    usualTimes: '',
    mic: true,
    lookingForGroup: false,
    primaryRoles: [],
    secondaryRoles: [],
  })

  const [session, setSession] = useState({
    active: false,
    serverCode: '',
  })

  const [discordConnected, setDiscordConnected] =
    useState(false)

  const [steamConnected, setSteamConnected] =
    useState(false)
  const [steamAccount, setSteamAccount] =
    useState(null)

  const [steamConnecting, setSteamConnecting] =
    useState(false)

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!storedProfile) return

    setForm({
      inGameName: storedProfile.in_game_name || '',
      region: storedProfile.region || 'UK / EU',
      playStyle:
        storedProfile.play_style || 'Casual Tactical',
      usualTimes:
        storedProfile.usual_play_times || '',
      mic: storedProfile.mic ?? true,
      lookingForGroup:
        storedProfile.looking_for_group ?? false,
      primaryRoles:
        storedProfile.primary_roles || [],
      secondaryRoles:
        storedProfile.secondary_roles || [],
    })
  }, [storedProfile])

  const loadSession = async () => {
    if (!user) return

    const { data } = await supabase
      .from('player_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .order('started_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (!data) {
      setSession({
        active: false,
        serverCode: '',
      })

      return
    }

    setSession({
      active: true,
      serverCode: data.server_code,
    })
  }

  const loadConnections = async () => {
    const { data: identityData } =
      await supabase.auth.getUserIdentities()

    const identities =
      identityData?.identities || []

    setDiscordConnected(
      identities.some(
        (identity) =>
          identity.provider === 'discord',
      ),
    )

    if (!user) return

    const { data: steam } = await supabase
      .from('linked_accounts')
      .select(`
        id,
        provider_user_id,
        provider_username,
        provider_avatar_url,
        provider_profile_url,
        metadata,
        linked_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('provider', 'steam')
      .maybeSingle()

    setSteamAccount(
      steam || null
    )

    setSteamConnected(
      Boolean(steam)
    )
  }

  useEffect(() => {
    loadSession()
    loadConnections()
  }, [user?.id])

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const getRoleState = (role) => {
    if (form.primaryRoles.includes(role)) {
      return 'primary'
    }

    if (form.secondaryRoles.includes(role)) {
      return 'secondary'
    }

    return null
  }

  const setPrimaryRole = (role) => {
    setMessage('')

    if (
      !form.primaryRoles.includes(role) &&
      form.primaryRoles.length >= 2
    ) {
      setMessage(
        'You can select up to 2 primary roles.',
      )
      return
    }

    setForm((current) => ({
      ...current,
      primaryRoles: current.primaryRoles.includes(role)
        ? current.primaryRoles
        : [...current.primaryRoles, role],
      secondaryRoles:
        current.secondaryRoles.filter(
          (item) => item !== role,
        ),
    }))
  }

  const setSecondaryRole = (role) => {
    setMessage('')

    if (
      !form.secondaryRoles.includes(role) &&
      form.secondaryRoles.length >= 3
    ) {
      setMessage(
        'You can select up to 3 secondary roles.',
      )
      return
    }

    setForm((current) => ({
      ...current,
      primaryRoles:
        current.primaryRoles.filter(
          (item) => item !== role,
        ),
      secondaryRoles:
        current.secondaryRoles.includes(role)
          ? current.secondaryRoles
          : [...current.secondaryRoles, role],
    }))
  }

  const clearRole = (role) => {
    setForm((current) => ({
      ...current,
      primaryRoles:
        current.primaryRoles.filter(
          (item) => item !== role,
        ),
      secondaryRoles:
        current.secondaryRoles.filter(
          (item) => item !== role,
        ),
    }))
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        in_game_name:
          form.inGameName.trim(),
        region: form.region,
        play_style: form.playStyle,
        usual_play_times:
          form.usualTimes,
        mic: form.mic,
        looking_for_group:
          form.lookingForGroup,
        primary_roles:
          form.primaryRoles,
        secondary_roles:
          form.secondaryRoles,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    await refreshProfile()

    setMessage('Profile saved.')
  }

  const setCurrentSession = async (serverCode) => {
    if (!user) return

    await supabase
      .from('player_sessions')
      .update({
        active: false,
      })
      .eq('user_id', user.id)
      .eq('active', true)

    const { error } = await supabase
      .from('player_sessions')
      .insert({
        user_id: user.id,
        server_code: serverCode,
        source: 'rallystack',
      })

    if (error) {
      setMessage(error.message)
      return
    }

    await loadSession()

    setMessage('Current WARDOGS session updated.')
  }

  const clearCurrentSession = async () => {
    if (!user) return

    const { error } = await supabase
      .from('player_sessions')
      .update({
        active: false,
      })
      .eq('user_id', user.id)
      .eq('active', true)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadSession()

    setMessage('Current session cleared.')
  }

  const connectDiscord = async () => {
    setMessage('')

    const { error } =
      await supabase.auth.linkIdentity({
        provider: 'discord',
      })

    if (error) {
      setMessage(
        `Discord is not ready yet: ${error.message}`,
      )
    }
  }

  const connectSteam = async () => {
    if (!user) {
      setMessage(
        'You need to be signed in before connecting Steam.',
      )

      return
    }

    setMessage('')
    setSteamConnecting(true)

    let popup = null

    const handleSteamMessage = async (
      event,
    ) => {
      if (
        event.data?.type !==
        'rallystack-steam-link'
      ) {
        return
      }

      window.removeEventListener(
        'message',
        handleSteamMessage,
      )

      setSteamConnecting(false)

      if (!event.data.ok) {
        setMessage(
          'Steam linking did not complete.',
        )

        return
      }

      await loadConnections()

      setMessage(
        'Steam account connected successfully.',
      )
    }

    window.addEventListener(
      'message',
      handleSteamMessage,
    )

    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          'steam-link',
          {
            body: {},
          },
        )

      if (error) {
        throw error
      }

      if (!data?.auth_url) {
        throw new Error(
          'Steam login URL was not returned.',
        )
      }

      popup =
        window.open(
          data.auth_url,
          'rallystack-steam-link',
          'popup=yes,width=720,height=760,resizable=yes,scrollbars=yes',
        )

      if (!popup) {
        throw new Error(
          'Your browser blocked the Steam login popup.',
        )
      }

      popup.focus()
    }
    catch (error) {
      window.removeEventListener(
        'message',
        handleSteamMessage,
      )

      setSteamConnecting(false)

      setMessage(
        `Steam connection failed: ${
          error?.message ||
          'Unknown error'
        }`,
      )
    }
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
            This profile is now stored in RallyStack rather than
            inside this browser.
          </p>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="flex h-12 items-center justify-center gap-2 bg-amber-500 px-6 text-xs font-black tracking-wider text-black disabled:opacity-50"
        >
          <Save size={17} />
          {saving
            ? 'SAVING...'
            : 'SAVE PROFILE'}
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
                  IN-GAME NAME
                </span>

                <input
                  value={form.inGameName}
                  onChange={(event) =>
                    updateField(
                      'inGameName',
                      event.target.value,
                    )
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  REGION
                </span>

                <select
                  value={form.region}
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

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  PLAY STYLE
                </span>

                <select
                  value={form.playStyle}
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
                  value={form.usualTimes}
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
          </section>

          <section className="border border-white/8 bg-[#0e1011]">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                ROLE PREFERENCES
              </div>

              <div className="mt-1 text-xs text-stone-500">
                Up to 2 primary and 3 secondary roles.
              </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => (
                <RolePreferenceCard
                  key={role.name}
                  role={role.name}
                  icon={role.icon}
                  description={
                    role.description
                  }
                  state={getRoleState(
                    role.name,
                  )}
                  onPrimary={() =>
                    setPrimaryRole(
                      role.name,
                    )
                  }
                  onSecondary={() =>
                    setSecondaryRole(
                      role.name,
                    )
                  }
                  onClear={() =>
                    clearRole(
                      role.name,
                    )
                  }
                />
              ))}
            </div>
          </section>

          <CurrentSessionCard
            session={session}
            discordConnected={
              discordConnected
            }
            onSetSession={
              setCurrentSession
            }
            onClearSession={
              clearCurrentSession
            }
          />

          <section className="border border-white/8 bg-[#0e1011] p-5">
            <button
              type="button"
              onClick={() =>
                updateField(
                  'lookingForGroup',
                  !form.lookingForGroup,
                )
              }
              className={[
                'flex w-full items-center justify-between border p-4 text-left',
                form.lookingForGroup
                  ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                  : 'border-white/8 bg-[#111416]',
              ].join(' ')}
            >
              <div>
                <div className="text-sm font-black text-white">
                  {form.lookingForGroup
                    ? 'LOOKING TO PLAY'
                    : 'NOT LOOKING FOR A GROUP'}
                </div>

                <div className="mt-1 text-xs text-stone-500">
                  This controls whether you appear on the LFG board.
                </div>
              </div>

              <div
                className={[
                  'relative h-6 w-11 rounded-full',
                  form.lookingForGroup
                    ? 'bg-emerald-500'
                    : 'bg-stone-800',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-1 h-4 w-4 rounded-full bg-white transition',
                    form.lookingForGroup
                      ? 'left-6'
                      : 'left-1',
                  ].join(' ')}
                />
              </div>
            </button>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="border border-white/8 bg-[#111416]">
            <div className="border-b border-white/8 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border border-white/10 bg-black/20">
                  <Gamepad2
                    size={28}
                    className="text-stone-600"
                  />
                </div>

                <div>
                  <div className="text-lg font-black text-white">
                    {form.inGameName ||
                      'YOUR IN-GAME NAME'}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                    <MapPin size={13} />
                    {form.region}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/8">
              <div className="p-4">
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  STYLE
                </div>

                <div className="mt-1 text-xs font-bold text-stone-300">
                  {form.playStyle}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateField(
                    'mic',
                    !form.mic,
                  )
                }
                className="p-4 text-left"
              >
                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  MIC
                </div>

                <div
                  className={[
                    'mt-1 flex items-center gap-2 text-xs font-bold',
                    form.mic
                      ? 'text-emerald-400'
                      : 'text-stone-500',
                  ].join(' ')}
                >
                  <Headphones
                    size={13}
                  />
                  {form.mic
                    ? 'YES'
                    : 'NO'}
                </div>
              </button>
            </div>

            <div className="border-t border-white/8 p-5">
              <div className="mb-3 text-[9px] font-bold tracking-wider text-stone-600">
                PRIMARY ROLES
              </div>

              <div className="flex flex-wrap gap-2">
                {form.primaryRoles.map(
                  (role) => (
                    <span
                      key={role}
                      className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 text-[10px] font-black tracking-wider text-amber-500"
                    >
                      <Star
                        size={11}
                        fill="currentColor"
                      />
                      {role}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>

          <ConnectedAccountsCard
            discordConnected={
              discordConnected
            }
            steamConnected={
              steamConnected
            }
            steamAccount={
              steamAccount
            }
            steamConnecting={
              steamConnecting
            }
            onDiscord={
              connectDiscord
            }
            onSteam={
              connectSteam
            }
          />

          <section className="border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <div className="flex gap-3">
              <Shield
                size={22}
                className="text-amber-500"
              />

              <div>
                <div className="text-[10px] font-bold tracking-[0.25em] text-amber-500">
                  SQUAD STATUS
                </div>

                <div className="mt-2 text-xl font-black text-white">
                  LAST ORDERS{' '}
                  <span className="text-amber-500">
                    [LAST]
                  </span>
                </div>

                <div className="mt-2 text-xs font-bold tracking-[0.15em] text-stone-400">
                  JOIN OR CREATE A SQUAD
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default ProfilePage
