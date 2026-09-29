import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Filter,
  Radio,
  RefreshCw,
  Search,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react'
import LfgPlayerCard from '../features/lfg/components/LfgPlayerCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const roleOptions = [
  'ALL ROLES',
  'ASSAULT',
  'MEDIC',
  'RECON',
  'SUPPORT',
  'DRIVER',
  'PILOT',
]

function FindPlayersPage() {
  const {
    user,
    profile:
      storedProfile,
    refreshProfile,
  } =
    useAuth()

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      'players',
    )

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState(
      'ALL ROLES',
    )

  const [
    regionFilter,
    setRegionFilter,
  ] =
    useState(
      'ALL REGIONS',
    )

  const [
    micOnly,
    setMicOnly,
  ] =
    useState(false)

  const [
    lookingOnly,
    setLookingOnly,
  ] =
    useState(true)

  const [
    players,
    setPlayers,
  ] =
    useState([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    message,
    setMessage,
  ] =
    useState('')

  const [
    toggling,
    setToggling,
  ] =
    useState(false)

  const [
    selfLive,
    setSelfLive,
  ] =
    useState(false)

  useEffect(
    () => {
      setSelfLive(
        storedProfile
          ?.looking_for_group ??
          false,
      )
    },
    [
      storedProfile
        ?.looking_for_group,
    ],
  )

  const loadPlayers =
    async ({
      quiet = false,
    } = {}) => {
      if (!user) {
        setPlayers([])
        setLoading(false)
        return
      }

      if (!quiet) {
        setLoading(true)
      }

      try {
        const now =
          new Date()
            .toISOString()

        const [
          directoryResult,
          sessionResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'player_directory',
              )
              .select(`
                user_id,
                in_game_name,
                avatar_url,
                region,
                play_style,
                usual_play_times,
                mic,
                looking_for_group,
                primary_roles,
                secondary_roles,
                squad_role,
                squad_id,
                squad_name,
                squad_tag,
                squad_recruiting,
                squad_visibility,
                updated_at
              `)
              .order(
                'looking_for_group',
                {
                  ascending:
                    false,
                },
              )
              .order(
                'in_game_name',
                {
                  ascending:
                    true,
                },
              ),

            supabase
              .from(
                'player_sessions',
              )
              .select(`
                user_id,
                server_code,
                source,
                started_at,
                expires_at
              `)
              .eq(
                'active',
                true,
              )
              .gt(
                'expires_at',
                now,
              )
              .order(
                'started_at',
                {
                  ascending:
                    false,
                },
              ),
          ])

        if (
          directoryResult.error
        ) {
          throw directoryResult.error
        }

        if (
          sessionResult.error
        ) {
          throw sessionResult.error
        }

        const sessionByUser =
          new Map()

        for (
          const session of
          sessionResult.data ||
          []
        ) {
          if (
            !sessionByUser.has(
              session.user_id,
            )
          ) {
            sessionByUser.set(
              session.user_id,
              session,
            )
          }
        }

        const mapped =
          (
            directoryResult.data ||
            []
          ).map(
            (row) => {
              const session =
                sessionByUser.get(
                  row.user_id,
                )

              let time =
                row.usual_play_times ||
                'No usual time set'

              if (session) {
                time =
                  'Playing now'
              }
              else if (
                row.looking_for_group
              ) {
                time =
                  'Looking to play'
              }

              return {
                id:
                  row.user_id,

                name:
                  row.in_game_name ||
                  'Unnamed player',

                avatarUrl:
                  row.avatar_url ||
                  '',

                squad:
                  row.squad_tag
                    ? `[${row.squad_tag}]`
                    : '',

                squadName:
                  row.squad_name ||
                  '',

                squadRole:
                  row.squad_role ||
                  '',

                region:
                  row.region ||
                  'Unknown region',

                time,

                mic:
                  row.mic ??
                  false,

                playStyle:
                  row.play_style ||
                  'Not set',

                primaryRoles:
                  row.primary_roles ||
                  [],

                secondaryRoles:
                  row.secondary_roles ||
                  [],

                serverCode:
                  session
                    ?.server_code ||
                  '',

                sessionSource:
                  session
                    ?.source ||
                  '',

                playingNow:
                  Boolean(
                    session,
                  ),

                lookingForGroup:
                  row.looking_for_group ??
                  false,

                squadRecruiting:
                  row.squad_recruiting ??
                  false,
              }
            },
          )

        setPlayers(
          mapped,
        )

        setMessage('')
      }
      catch (error) {
        console.error(
          'Could not load player directory:',
          error,
        )

        setMessage(
          error?.message ||
          'Could not load RallyStack players.',
        )
      }
      finally {
        setLoading(false)
      }
    }

  useEffect(
    () => {
      if (!user) {
        setPlayers([])
        setLoading(false)
        return
      }

      loadPlayers()

      const interval =
        window.setInterval(
          () =>
            loadPlayers({
              quiet:
                true,
            }),
          30_000,
        )

      const handleFocus =
        () =>
          loadPlayers({
            quiet:
              true,
          })

      window.addEventListener(
        'focus',
        handleFocus,
      )

      return () => {
        window.clearInterval(
          interval,
        )

        window.removeEventListener(
          'focus',
          handleFocus,
        )
      }
    },
    [
      user?.id,
    ],
  )

  const toggleMyLfg =
    async () => {
      if (
        !user ||
        !storedProfile ||
        toggling
      ) {
        return
      }

      const nextState =
        !selfLive

      setToggling(true)
      setMessage('')

      const {
        error,
      } =
        await supabase
          .from(
            'profiles',
          )
          .update({
            looking_for_group:
              nextState,
          })
          .eq(
            'id',
            user.id,
          )

      if (error) {
        setToggling(false)

        setMessage(
          error.message,
        )

        return
      }

      setSelfLive(
        nextState,
      )

      if (
        refreshProfile
      ) {
        await refreshProfile()
      }

      await loadPlayers({
        quiet:
          true,
      })

      setToggling(false)

      setMessage(
        nextState
          ? 'You are now visible as Looking To Play.'
          : 'You are no longer marked as Looking To Play.',
      )
    }

  const visiblePlayers =
    useMemo(
      () => {
        const search =
          query
            .trim()
            .toLowerCase()

        return players.filter(
          (player) => {
            const searchMatch =
              !search ||
              player.name
                .toLowerCase()
                .includes(
                  search,
                ) ||
              (
                player
                  .squadName ||
                ''
              )
                .toLowerCase()
                .includes(
                  search,
                ) ||
              (
                player.squad ||
                ''
              )
                .toLowerCase()
                .includes(
                  search,
                )

            const allRoles = [
              ...player
                .primaryRoles,
              ...player
                .secondaryRoles,
            ]

            const roleMatch =
              roleFilter ===
                'ALL ROLES' ||
              allRoles.includes(
                roleFilter,
              )

            const regionMatch =
              regionFilter ===
                'ALL REGIONS' ||
              player.region ===
                regionFilter

            const micMatch =
              !micOnly ||
              player.mic

            const lookingMatch =
              !lookingOnly ||
              player
                .lookingForGroup

            return (
              searchMatch &&
              roleMatch &&
              regionMatch &&
              micMatch &&
              lookingMatch
            )
          },
        )
      },
      [
        players,
        query,
        roleFilter,
        regionFilter,
        micOnly,
        lookingOnly,
      ],
    )

  const resetFilters =
    () => {
      setQuery('')

      setRoleFilter(
        'ALL ROLES',
      )

      setRegionFilter(
        'ALL REGIONS',
      )

      setMicOnly(
        false,
      )

      setLookingOnly(
        true,
      )
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
                Find real RallyStack players by role, region,
                squad and play style.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  loadPlayers()
                }
                disabled={
                  loading
                }
                className="flex h-12 items-center justify-center gap-2 border border-white/10 bg-[#111416] px-4 text-[10px] font-black tracking-wider text-stone-400 hover:text-white disabled:opacity-40"
              >
                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />

                REFRESH
              </button>

              <button
                type="button"
                onClick={
                  toggleMyLfg
                }
                disabled={
                  !storedProfile ||
                  toggling
                }
                className={[
                  'flex h-12 items-center justify-center gap-2 px-6 text-xs font-black tracking-wider transition',
                  selfLive
                    ? 'border border-red-500/30 bg-red-500/[0.06] text-red-400'
                    : 'bg-amber-500 text-black hover:bg-amber-400',
                  !storedProfile ||
                  toggling
                    ? 'cursor-not-allowed opacity-40'
                    : '',
                ].join(' ')}
              >
                <Radio
                  size={16}
                />

                {toggling
                  ? 'UPDATING...'
                  : selfLive
                    ? 'STOP LOOKING'
                    : 'I\'M LOOKING TO PLAY'}
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-6 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-amber-400">
              {message}
            </div>
          )}

          {!storedProfile && (
            <div className="mt-6 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-amber-400">
              Complete your RallyStack profile before joining the player directory.
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0b0d0e]">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'players',
                )
              }
              className={[
                'relative flex h-16 items-center gap-2 text-xs font-black tracking-wider',
                activeTab ===
                  'players'
                  ? 'text-white'
                  : 'text-stone-600 hover:text-stone-300',
              ].join(' ')}
            >
              <UserRoundSearch
                size={16}
              />

              PLAYERS

              {activeTab ===
                'players' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'groups',
                )
              }
              className={[
                'relative flex h-16 items-center gap-2 text-xs font-black tracking-wider',
                activeTab ===
                  'groups'
                  ? 'text-white'
                  : 'text-stone-600 hover:text-stone-300',
              ].join(' ')}
            >
              <Users
                size={16}
              />

              GROUPS

              {activeTab ===
                'groups' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {activeTab ===
        'players' ? (
          <>
            <div className="mb-7 border border-white/8 bg-[#0e1011] p-4">
              <div className="grid gap-3 xl:grid-cols-[1fr_180px_190px_auto_auto_auto]">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
                  />

                  <input
                    value={
                      query
                    }
                    onChange={(
                      event,
                    ) =>
                      setQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search player or squad..."
                    className="h-11 w-full border border-white/8 bg-[#0b0d0e] pl-11 pr-4 text-xs text-white outline-none placeholder:text-stone-700 focus:border-amber-500/40"
                  />
                </div>

                <select
                  value={
                    roleFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setRoleFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-11 border border-white/8 bg-[#0b0d0e] px-3 text-xs font-bold text-stone-300 outline-none"
                >
                  {roleOptions.map(
                    (role) => (
                      <option
                        key={
                          role
                        }
                      >
                        {
                          role
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    regionFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setRegionFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-11 border border-white/8 bg-[#0b0d0e] px-3 text-xs font-bold text-stone-300 outline-none"
                >
                  <option>
                    ALL REGIONS
                  </option>

                  <option>
                    UK / EU
                  </option>

                  <option>
                    Europe
                  </option>

                  <option>
                    North America East
                  </option>

                  <option>
                    North America West
                  </option>

                  <option>
                    Oceania
                  </option>

                  <option>
                    Asia
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    setLookingOnly(
                      !lookingOnly,
                    )
                  }
                  className={[
                    'flex h-11 items-center justify-center gap-2 border px-4 text-[10px] font-black tracking-wider transition',
                    lookingOnly
                      ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-400'
                      : 'border-white/8 text-stone-500',
                  ].join(' ')}
                >
                  <Radio
                    size={14}
                  />

                  LOOKING ONLY
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMicOnly(
                      !micOnly,
                    )
                  }
                  className={[
                    'flex h-11 items-center justify-center gap-2 border px-4 text-[10px] font-black tracking-wider transition',
                    micOnly
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-400'
                      : 'border-white/8 text-stone-500',
                  ].join(' ')}
                >
                  <Filter
                    size={14}
                  />

                  MIC ONLY
                </button>

                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="flex h-11 items-center justify-center gap-2 border border-white/8 px-4 text-[10px] font-black tracking-wider text-stone-500 transition hover:text-white"
                >
                  <X
                    size={14}
                  />

                  RESET
                </button>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div className="text-xs font-bold text-stone-500">
                <span className="text-white">
                  {
                    visiblePlayers.length
                  }
                </span>{' '}
                {visiblePlayers.length ===
                1
                  ? 'player matches'
                  : 'players match'}{' '}
                your filters
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                LIVE RALLYSTACK DIRECTORY
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center border border-white/8 bg-[#0e1011] text-xs font-black tracking-wider text-stone-600">
                LOADING PLAYERS...
              </div>
            ) : visiblePlayers.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center border border-white/8 bg-[#0e1011] px-6 text-center">
                <UserRoundSearch
                  size={28}
                  className="text-stone-700"
                />

                <div className="mt-4 text-sm font-black text-white">
                  NO PLAYERS MATCH
                </div>

                <div className="mt-2 max-w-md text-xs leading-5 text-stone-600">
                  Try changing your filters or switch off Looking Only to browse the full RallyStack player directory.
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlayers.map(
                  (player) => (
                    <LfgPlayerCard
                      key={
                        player.id
                      }
                      player={
                        player
                      }
                      isYou={
                        player.id ===
                        user?.id
                      }
                    />
                  ),
                )}
              </div>
            )}
          </>
        ) : (
          <div className="border border-white/8 bg-[#0e1011] p-8">
            <div className="mx-auto max-w-xl text-center">
              <Users
                size={30}
                className="mx-auto text-stone-700"
              />

              <div className="mt-4 text-lg font-black text-white">
                LIVE GROUPS ARE MOVING TO RALLYSTACK
              </div>

              <p className="mt-3 text-xs leading-6 text-stone-500">
                Temporary groups are currently created through the RallyStack Discord bot using
                {' '}
                <code className="text-amber-500">
                  /lfg create
                </code>
                .
                The website group board will use the same live Supabase data next, so Discord and the site show exactly the same groups.
              </p>

              <div className="mt-5 inline-flex border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-[10px] font-black tracking-wider text-amber-400">
                NO FAKE GROUP DATA
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default FindPlayersPage