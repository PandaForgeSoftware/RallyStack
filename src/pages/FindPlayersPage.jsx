import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Clock3,
  ExternalLink,
  Filter,
  Mic,
  Radio,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react'
import LfgPlayerCard from '../features/lfg/components/LfgPlayerCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const DISCORD_LFG_URL =
  'https://discord.com/channels/1554082200583147593/1554115548051415151'

const roleOptions = [
  'ALL ROLES',
  'ASSAULT',
  'MEDIC',
  'RECON',
  'SUPPORT',
  'DRIVER',
  'PILOT',
]

function formatActivity(
  group,
) {
  if (
    group.custom_activity
  ) {
    return group.custom_activity
  }

  if (
    !group.activity
  ) {
    return 'WARDOGS'
  }

  return group.activity
    .replaceAll(
      '_',
      ' ',
    )
    .toUpperCase()
}

function formatExpiry(
  value,
) {
  if (!value) {
    return ''
  }

  const difference =
    new Date(
      value,
    ).getTime() -
    Date.now()

  if (
    difference <=
    0
  ) {
    return 'EXPIRING'
  }

  const minutes =
    Math.ceil(
      difference /
      60_000,
    )

  if (
    minutes <
    60
  ) {
    return `${minutes}M LEFT`
  }

  const hours =
    Math.floor(
      minutes /
      60,
    )

  const remainingMinutes =
    minutes %
    60

  if (
    remainingMinutes ===
    0
  ) {
    return `${hours}H LEFT`
  }

  return `${hours}H ${remainingMinutes}M LEFT`
}

function openDiscord() {
  window.open(
    DISCORD_LFG_URL,
    '_blank',
    'noopener,noreferrer',
  )
}

function LiveGroupCard({
  group,
  members,
  isMine,
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(false)

  const full =
    group.status ===
      'full' ||
    group.player_count >=
      group.max_players

  const copyServer =
    async () => {
      if (
        !group.server_code
      ) {
        return
      }

      try {
        await navigator.clipboard.writeText(
          group.server_code,
        )

        setCopied(
          true,
        )

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1500,
        )
      }
      catch {
        setCopied(
          false,
        )
      }
    }

  return (
    <article className="border border-white/8 bg-[#0e1011]">
      <div className="border-b border-white/8 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-black text-white">
                {formatActivity(
                  group,
                )}
              </div>

              {isMine && (
                <span className="border border-amber-500/25 bg-amber-500/[0.06] px-2 py-1 text-[8px] font-black tracking-wider text-amber-400">
                  YOUR GROUP
                </span>
              )}
            </div>

            <div className="mt-2 text-[10px] font-bold tracking-wider text-stone-600">
              HOSTED BY{' '}
              <span className="text-stone-300">
                {group.creator_display_name ||
                  'RallyStack player'}
              </span>
            </div>
          </div>

          <div
            className={[
              'border px-2.5 py-1 text-[8px] font-black tracking-wider',
              full
                ? 'border-red-500/25 bg-red-500/[0.06] text-red-400'
                : group.status ===
                    'running'
                  ? 'border-sky-500/25 bg-sky-500/[0.06] text-sky-400'
                  : 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400',
            ].join(
              ' ',
            )}
          >
            {full
              ? 'FULL'
              : (
                    group.status ||
                    'recruiting'
                  ).toUpperCase()}
          </div>
        </div>

        {group.note && (
          <p className="mt-4 text-xs leading-5 text-stone-500">
            {group.note}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 border-b border-white/8">
        <div className="border-b border-r border-white/8 p-4">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-600">
            <Users
              size={12}
            />
            PLAYERS
          </div>

          <div className="mt-2 text-sm font-black text-white">
            {group.player_count}
            {' / '}
            {group.max_players}
          </div>
        </div>

        <div className="border-b border-white/8 p-4">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-600">
            <ShieldCheck
              size={12}
            />
            REGION
          </div>

          <div className="mt-2 text-xs font-bold text-stone-300">
            {group.region ||
              'Not set'}
          </div>
        </div>

        <div className="border-r border-white/8 p-4">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-600">
            <Radio
              size={12}
            />
            PLAY STYLE
          </div>

          <div className="mt-2 text-xs font-bold text-stone-300">
            {group.play_style ||
              'Not set'}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-600">
            <Mic
              size={12}
            />
            MIC
          </div>

          <div
            className={[
              'mt-2 text-xs font-black',
              group.mic_required
                ? 'text-emerald-400'
                : 'text-stone-400',
            ].join(
              ' ',
            )}
          >
            {group.mic_required
              ? 'REQUIRED'
              : 'OPTIONAL'}
          </div>
        </div>
      </div>

      {members.length >
        0 && (
        <div className="border-b border-white/8 p-4">
          <div className="mb-3 text-[9px] font-black tracking-wider text-stone-600">
            GROUP MEMBERS
          </div>

          <div className="flex flex-wrap gap-2">
            {members.map(
              (
                member,
              ) => (
                <span
                  key={
                    member.id
                  }
                  className={[
                    'border px-2.5 py-1.5 text-[9px] font-bold',
                    member.is_creator
                      ? 'border-amber-500/20 bg-amber-500/[0.05] text-amber-400'
                      : 'border-white/8 bg-[#111416] text-stone-400',
                  ].join(
                    ' ',
                  )}
                >
                  {member.display_name ||
                    'Player'}

                  {member.is_creator
                    ? ' | LEADER'
                    : ''}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {group.server_code && (
        <button
          type="button"
          onClick={
            copyServer
          }
          className="flex w-full items-center justify-between border-b border-white/8 px-4 py-3 text-left transition hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <Server
              size={13}
              className="text-amber-500"
            />

            <span className="text-[9px] font-black tracking-wider text-stone-600">
              SERVER
            </span>
          </div>

          <div className="text-[10px] font-black tracking-wider text-amber-400">
            {copied
              ? 'COPIED'
              : group.server_code}
          </div>
        </button>
      )}

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-600">
          <Clock3
            size={12}
          />

          {formatExpiry(
            group.expires_at,
          )}
        </div>

        <button
          type="button"
          onClick={
            openDiscord
          }
          className="flex h-9 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black transition hover:bg-amber-400"
        >
          <ExternalLink
            size={12}
          />

          {isMine
            ? 'OPEN IN DISCORD'
            : 'JOIN IN DISCORD'}
        </button>
      </div>
    </article>
  )
}

function FindPlayersPage() {
  const {
    user,
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
    liveOnly,
    setLiveOnly,
  ] =
    useState(true)

  const [
    players,
    setPlayers,
  ] =
    useState([])

  const [
    groups,
    setGroups,
  ] =
    useState([])

  const [
    groupMembers,
    setGroupMembers,
  ] =
    useState([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false)

  const [
    message,
    setMessage,
  ] =
    useState('')

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(null)

  const loadLiveData =
    async ({
      quiet = false,
    } = {}) => {
      if (!user) {
        setPlayers([])
        setGroups([])
        setGroupMembers([])
        setLoading(false)

        return
      }

      if (quiet) {
        setRefreshing(
          true,
        )
      }
      else {
        setLoading(
          true,
        )
      }

      try {
        const now =
          new Date()
            .toISOString()

        const [
          directoryResult,
          sessionResult,
          groupsResult,
          membersResult,
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

            supabase
              .from(
                'live_lfg_groups',
              )
              .select(`
                id,
                activity,
                custom_activity,
                region,
                play_style,
                max_players,
                mic_required,
                note,
                server_code,
                server_source,
                status,
                creator_user_id,
                creator_display_name,
                created_at,
                expires_at,
                player_count
              `)
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              ),

            supabase
              .from(
                'lfg_members',
              )
              .select(`
                id,
                group_id,
                user_id,
                display_name,
                is_creator,
                joined_at
              `)
              .eq(
                'active',
                true,
              )
              .order(
                'joined_at',
                {
                  ascending:
                    true,
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

        if (
          groupsResult.error
        ) {
          throw groupsResult.error
        }

        if (
          membersResult.error
        ) {
          throw membersResult.error
        }

        const liveGroups =
          groupsResult.data ||
          []

        const members =
          membersResult.data ||
          []

        const groupById =
          new Map(
            liveGroups.map(
              (
                group,
              ) => [
                group.id,
                group,
              ],
            ),
          )

        const lfgByUser =
          new Map()

        for (
          const member of
          members
        ) {
          if (
            member.user_id
          ) {
            lfgByUser.set(
              member.user_id,
              member,
            )
          }
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

        const mappedPlayers =
          (
            directoryResult.data ||
            []
          ).map(
            (
              row,
            ) => {
              const session =
                sessionByUser.get(
                  row.user_id,
                )

              const lfgMembership =
                lfgByUser.get(
                  row.user_id,
                )

              const lfgGroup =
                lfgMembership
                  ? groupById.get(
                      lfgMembership.group_id,
                    )
                  : null

              const lookingForGroup =
                Boolean(
                  lfgMembership,
                )

              let time =
                row.usual_play_times ||
                'No usual time set'

              if (
                session
              ) {
                time =
                  'Playing now'
              }
              else if (
                lookingForGroup
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

                lookingForGroup,

                playingNow:
                  Boolean(
                    session,
                  ),

                serverCode:
                  lfgGroup
                    ?.server_code ||
                  session
                    ?.server_code ||
                  '',

                lfgGroupId:
                  lfgMembership
                    ?.group_id ||
                  null,
              }
            },
          )

        setPlayers(
          mappedPlayers,
        )

        setGroups(
          liveGroups,
        )

        setGroupMembers(
          members,
        )

        setLastUpdated(
          new Date(),
        )

        setMessage('')
      }
      catch (
        error
      ) {
        console.error(
          'Could not load live RallyStack LFG:',
          error,
        )

        setMessage(
          error?.message ||
            'Could not load RallyStack live data.',
        )
      }
      finally {
        setLoading(
          false,
        )

        setRefreshing(
          false,
        )
      }
    }

  useEffect(
    () => {
      if (!user) {
        setLoading(
          false,
        )

        return
      }

      loadLiveData()

      const interval =
        window.setInterval(
          () =>
            loadLiveData({
              quiet:
                true,
            }),
          10_000,
        )

      const handleFocus =
        () =>
          loadLiveData({
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

  const membersByGroup =
    useMemo(
      () => {
        const map =
          new Map()

        for (
          const member of
          groupMembers
        ) {
          const list =
            map.get(
              member.group_id,
            ) ||
            []

          list.push(
            member,
          )

          map.set(
            member.group_id,
            list,
          )
        }

        return map
      },
      [
        groupMembers,
      ],
    )

  const myLiveMembership =
    useMemo(
      () =>
        groupMembers.find(
          (
            member,
          ) =>
            member.user_id ===
            user?.id,
        ) ||
        null,
      [
        groupMembers,
        user?.id,
      ],
    )

  const visiblePlayers =
    useMemo(
      () => {
        const search =
          query
            .trim()
            .toLowerCase()

        return players.filter(
          (
            player,
          ) => {
            const searchMatch =
              !search ||
              player.name
                .toLowerCase()
                .includes(
                  search,
                ) ||
              (
                player.squadName ||
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
              ...player.primaryRoles,
              ...player.secondaryRoles,
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

            const liveMatch =
              !liveOnly ||
              player
                .lookingForGroup

            return (
              searchMatch &&
              roleMatch &&
              regionMatch &&
              micMatch &&
              liveMatch
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
        liveOnly,
      ],
    )

  const livePlayerCount =
    useMemo(
      () =>
        players.filter(
          (
            player,
          ) =>
            player
              .lookingForGroup,
        ).length,
      [
        players,
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

      setLiveOnly(
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
                  DISCORD LIVE LFG
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                FIND PLAYERS
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
                Find RallyStack players currently looking to play and browse live groups created through Discord.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-[190px] items-center justify-between gap-4 border border-white/8 bg-[#111416] px-4 py-3">
                <div>
                  <div className="text-[8px] font-black tracking-wider text-stone-600">
                    YOUR LFG STATUS
                  </div>

                  <div
                    className={[
                      'mt-1 text-xs font-black',
                      myLiveMembership
                        ? 'text-emerald-400'
                        : 'text-stone-500',
                    ].join(
                      ' ',
                    )}
                  >
                    {myLiveMembership
                      ? 'LIVE IN DISCORD LFG'
                      : 'NOT IN AN LFG'}
                  </div>
                </div>

                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full',
                    myLiveMembership
                      ? 'bg-emerald-500'
                      : 'bg-stone-700',
                  ].join(
                    ' ',
                  )}
                />
              </div>

              <button
                type="button"
                onClick={
                  openDiscord
                }
                className="flex h-12 items-center justify-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
              >
                <ExternalLink
                  size={14}
                />

                OPEN DISCORD
              </button>

              <button
                type="button"
                onClick={() =>
                  loadLiveData()
                }
                disabled={
                  loading ||
                  refreshing
                }
                className="flex h-12 items-center justify-center gap-2 border border-white/10 bg-[#111416] px-4 text-[10px] font-black tracking-wider text-stone-400 transition hover:text-white disabled:opacity-40"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                REFRESH
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border border-amber-500/15 bg-amber-500/[0.03] px-4 py-3 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <div>
              LFG status is controlled by Discord. Create, join, leave or delete a group there and RallyStack updates automatically.
            </div>

            <div className="shrink-0 text-[9px] font-black tracking-wider text-amber-500">
              DISCORD IS THE SOURCE OF TRUTH
            </div>
          </div>

          {message && (
            <div className="mt-4 border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-xs text-red-400">
              {message}
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
              ].join(
                ' ',
              )}
            >
              <UserRoundSearch
                size={16}
              />

              PLAYERS

              <span className="ml-1 text-[9px] text-emerald-400">
                {livePlayerCount}
              </span>

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
              ].join(
                ' ',
              )}
            >
              <Users
                size={16}
              />

              GROUPS

              <span className="ml-1 text-[9px] text-amber-400">
                {groups.length}
              </span>

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
                        event
                          .target
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
                      event
                        .target
                        .value,
                    )
                  }
                  className="h-11 border border-white/8 bg-[#0b0d0e] px-3 text-xs font-bold text-stone-300 outline-none"
                >
                  {roleOptions.map(
                    (
                      role,
                    ) => (
                      <option
                        key={
                          role
                        }
                      >
                        {role}
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
                      event
                        .target
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
                    setLiveOnly(
                      !liveOnly,
                    )
                  }
                  className={[
                    'flex h-11 items-center justify-center gap-2 border px-4 text-[10px] font-black tracking-wider transition',
                    liveOnly
                      ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-400'
                      : 'border-white/8 text-stone-500',
                  ].join(
                    ' ',
                  )}
                >
                  <Radio
                    size={14}
                  />

                  LIVE LFG ONLY
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
                  ].join(
                    ' ',
                  )}
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

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold text-stone-500">
                <span className="text-white">
                  {visiblePlayers.length}
                </span>{' '}
                {visiblePlayers.length ===
                1
                  ? 'player matches'
                  : 'players match'}{' '}
                your filters
              </div>

              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <div className="text-[9px] font-bold tracking-wider text-stone-700">
                    UPDATED{' '}
                    {lastUpdated.toLocaleTimeString(
                      [],
                      {
                        hour:
                          '2-digit',
                        minute:
                          '2-digit',
                        second:
                          '2-digit',
                      },
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  LIVE DISCORD LFG
                </div>
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
                  size={30}
                  className="text-stone-700"
                />

                <div className="mt-4 text-sm font-black text-white">
                  NO LIVE PLAYERS
                </div>

                <div className="mt-2 max-w-md text-xs leading-5 text-stone-600">
                  Nobody currently matches your filters. Live status only appears when a player is in an active RallyStack Discord LFG.
                </div>

                <button
                  type="button"
                  onClick={
                    openDiscord
                  }
                  className="mt-5 flex h-10 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black"
                >
                  <ExternalLink
                    size={12}
                  />

                  OPEN DISCORD LFG
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlayers.map(
                  (
                    player,
                  ) => (
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
          <>
            <div className="mb-7 flex flex-col gap-5 border border-white/8 bg-[#0e1011] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Users
                    size={16}
                    className="text-amber-500"
                  />

                  LIVE DISCORD GROUPS
                </div>

                <div className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                  Groups are created and joined through Discord. RallyStack mirrors them here automatically, including players, server and expiry.
                </div>
              </div>

              <button
                type="button"
                onClick={
                  openDiscord
                }
                className="flex h-11 shrink-0 items-center justify-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
              >
                <ExternalLink
                  size={13}
                />

                CREATE / JOIN IN DISCORD
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center border border-white/8 bg-[#0e1011] text-xs font-black tracking-wider text-stone-600">
                LOADING LIVE GROUPS...
              </div>
            ) : groups.length ===
              0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center border border-white/8 bg-[#0e1011] px-6 text-center">
                <Users
                  size={32}
                  className="text-stone-700"
                />

                <div className="mt-4 text-sm font-black text-white">
                  NO ACTIVE GROUPS
                </div>

                <div className="mt-2 max-w-md text-xs leading-5 text-stone-600">
                  There are no active RallyStack LFG groups right now. Create one with /lfg create in Discord and it will appear here automatically.
                </div>

                <button
                  type="button"
                  onClick={
                    openDiscord
                  }
                  className="mt-5 flex h-10 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black"
                >
                  <ExternalLink
                    size={12}
                  />

                  OPEN DISCORD
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {groups.map(
                  (
                    group,
                  ) => {
                    const members =
                      membersByGroup.get(
                        group.id,
                      ) ||
                      []

                    const isMine =
                      members.some(
                        (
                          member,
                        ) =>
                          member.user_id ===
                          user?.id,
                      )

                    return (
                      <LiveGroupCard
                        key={
                          group.id
                        }
                        group={
                          group
                        }
                        members={
                          members
                        }
                        isMine={
                          isMine
                        }
                      />
                    )
                  },
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default FindPlayersPage