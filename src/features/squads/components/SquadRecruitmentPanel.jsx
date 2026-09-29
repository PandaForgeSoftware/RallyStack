import {
  Check,
  Clipboard,
  Copy,
  Inbox,
  KeyRound,
  Search,
  Send,
  UserPlus,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import { supabase } from '../../../lib/supabase'

function SquadRecruitmentPanel({
  user,
  myMembership,
  onChanged,
  onMessage,
}) {
  const [
    pendingApplications,
    setPendingApplications,
  ] = useState([])

  const [
    myApplications,
    setMyApplications,
  ] = useState([])

  const [
    directInvites,
    setDirectInvites,
  ] = useState([])

  const [
    ownerInvites,
    setOwnerInvites,
  ] = useState([])

  const [
    playerSearch,
    setPlayerSearch,
  ] = useState('')

  const [
    players,
    setPlayers,
  ] = useState([])

  const [
    inviteCode,
    setInviteCode,
  ] = useState('')

  const [
    latestCode,
    setLatestCode,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    working,
    setWorking,
  ] = useState('')

  const squad =
    myMembership?.squad ||
    null

  const isOwner =
    myMembership?.role ===
    'owner'

  const tell = (
    value,
  ) => {
    if (onMessage) {
      onMessage(value)
    }
  }

  const loadRecruitment =
    async () => {
      if (!user) {
        return
      }

      setLoading(true)

      try {
        if (!myMembership) {
          const {
            data: applications,
            error: appError,
          } =
            await supabase
              .from(
                'squad_applications',
              )
              .select(`
                id,
                squad_id,
                status,
                created_at,
                squad:squads (
                  id,
                  name,
                  tag
                )
              `)
              .eq(
                'user_id',
                user.id,
              )
              .eq(
                'status',
                'pending',
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (appError) {
            throw appError
          }

          setMyApplications(
            applications || [],
          )

          const {
            data: invites,
            error: inviteError,
          } =
            await supabase
              .from(
                'squad_invites',
              )
              .select(`
                id,
                code,
                created_at,
                expires_at,
                squad:squads (
                  id,
                  name,
                  tag,
                  recruiting
                )
              `)
              .eq(
                'invited_user_id',
                user.id,
              )
              .eq(
                'active',
                true,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (inviteError) {
            throw inviteError
          }

          setDirectInvites(
            invites || [],
          )
        }
        else {
          setMyApplications([])
          setDirectInvites([])
        }

        if (
          isOwner &&
          squad?.id
        ) {
          const {
            data: applications,
            error: appError,
          } =
            await supabase
              .from(
                'squad_applications',
              )
              .select(`
                id,
                user_id,
                message,
                created_at,
                profile:profiles!squad_applications_user_id_fkey (
                  id,
                  in_game_name,
                  region,
                  play_style,
                  primary_roles,
                  secondary_roles
                )
              `)
              .eq(
                'squad_id',
                squad.id,
              )
              .eq(
                'status',
                'pending',
              )
              .order(
                'created_at',
                {
                  ascending:
                    true,
                },
              )

          if (appError) {
            throw appError
          }

          setPendingApplications(
            applications || [],
          )

          const {
            data: invites,
            error: inviteError,
          } =
            await supabase
              .from(
                'squad_invites',
              )
              .select(`
                id,
                code,
                invited_user_id,
                max_uses,
                use_count,
                active,
                expires_at,
                created_at,
                invited:profiles!squad_invites_invited_user_id_fkey (
                  id,
                  in_game_name
                )
              `)
              .eq(
                'squad_id',
                squad.id,
              )
              .eq(
                'active',
                true,
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )

          if (inviteError) {
            throw inviteError
          }

          setOwnerInvites(
            invites || [],
          )
        }
        else {
          setPendingApplications([])
          setOwnerInvites([])
        }
      }
      catch (error) {
        console.error(
          'Recruitment load failed:',
          error,
        )

        tell(
          error?.message ||
            'Could not load recruitment information.',
        )
      }
      finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadRecruitment()

    const refresh = () =>
      loadRecruitment()

    window.addEventListener(
      'rallystack-recruitment-changed',
      refresh,
    )

    return () =>
      window.removeEventListener(
        'rallystack-recruitment-changed',
        refresh,
      )
  }, [
    user?.id,
    myMembership?.id,
    squad?.id,
    isOwner,
  ])

  const refreshEverything =
    async () => {
      await loadRecruitment()

      if (onChanged) {
        await onChanged()
      }
    }

  const changeJoinPolicy =
    async (
      policy,
    ) => {
      if (
        !isOwner ||
        !squad
      ) {
        return
      }

      setWorking(
        `policy-${policy}`,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'squads',
          )
          .update({
            join_policy:
              policy,
          })
          .eq(
            'id',
            squad.id,
          )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        policy === 'open'
          ? 'Squad is now open for direct joining.'
          : policy === 'application'
            ? 'Players must now apply before joining.'
            : 'Squad is now invite only.',
      )

      await refreshEverything()
    }

  const reviewApplication =
    async (
      application,
      decision,
    ) => {
      setWorking(
        application.id,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'review_squad_application',
          {
            application_id:
              application.id,

            decision,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        decision ===
          'accepted'
          ? 'Application accepted.'
          : 'Application rejected.',
      )

      await refreshEverything()
    }

  const cancelApplication =
    async (
      application,
    ) => {
      setWorking(
        application.id,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'cancel_squad_application',
          {
            application_id:
              application.id,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        'Application cancelled.',
      )

      await refreshEverything()
    }

  const createShareCode =
    async () => {
      if (
        !isOwner ||
        !squad
      ) {
        return
      }

      setWorking(
        'share-code',
      )

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'create_squad_invite',
          {
            target_squad_id:
              squad.id,

            target_user_id:
              null,

            requested_max_uses:
              10,

            requested_expires_hours:
              168,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      setLatestCode(
        data?.code || '',
      )

      tell(
        'Squad invite code created. It can be used up to 10 times for 7 days.',
      )

      await loadRecruitment()
    }

  const copyCode =
    async (
      code,
    ) => {
      try {
        await navigator
          .clipboard
          .writeText(
            code,
          )

        tell(
          'Invite code copied.',
        )
      }
      catch {
        tell(
          `Invite code: ${code}`,
        )
      }
    }

  const searchPlayers =
    async () => {
      if (
        !isOwner
      ) {
        return
      }

      const query =
        playerSearch.trim()

      if (
        query.length < 2
      ) {
        tell(
          'Enter at least 2 characters to search players.',
        )

        return
      }

      setWorking(
        'player-search',
      )

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'profiles',
          )
          .select(`
            id,
            in_game_name,
            region,
            play_style,
            primary_roles
          `)
          .ilike(
            'in_game_name',
            `%${query}%`,
          )
          .neq(
            'id',
            user.id,
          )
          .limit(8)

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      setPlayers(
        data || [],
      )
    }

  const invitePlayer =
    async (
      player,
    ) => {
      setWorking(
        player.id,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'create_squad_invite',
          {
            target_squad_id:
              squad.id,

            target_user_id:
              player.id,

            requested_max_uses:
              1,

            requested_expires_hours:
              168,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        `${player.in_game_name || 'Player'} invited to the squad.`,
      )

      await loadRecruitment()
    }

  const revokeInvite =
    async (
      invite,
    ) => {
      setWorking(
        invite.id,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'revoke_squad_invite',
          {
            invite_id:
              invite.id,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        'Invite revoked.',
      )

      await loadRecruitment()
    }

  const acceptCode =
    async (
      code,
    ) => {
      const value =
        code
          .trim()
          .toUpperCase()

      if (!value) {
        return
      }

      setWorking(
        `accept-${value}`,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'accept_squad_invite',
          {
            invite_code:
              value,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      setInviteCode('')

      tell(
        'Squad invite accepted.',
      )

      await refreshEverything()
    }

  const declineInvite =
    async (
      invite,
    ) => {
      setWorking(
        invite.id,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'decline_squad_invite',
          {
            invite_id:
              invite.id,
          },
        )

      setWorking('')

      if (error) {
        tell(
          error.message,
        )

        return
      }

      tell(
        'Invite declined.',
      )

      await loadRecruitment()
    }

  if (
    myMembership &&
    !isOwner
  ) {
    return null
  }

  if (!myMembership) {
    return (
      <section className="mb-8 border border-white/8 bg-[#0e1011]">
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.25em] text-amber-500">
            <Inbox size={14} />
            INVITES & APPLICATIONS
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
              JOIN WITH INVITE CODE
            </div>

            <div className="flex gap-2">
              <input
                value={
                  inviteCode
                }
                onChange={(
                  event,
                ) =>
                  setInviteCode(
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]/g,
                        '',
                      ),
                  )
                }
                placeholder="ENTER CODE"
                maxLength={12}
                className="h-11 min-w-0 flex-1 border border-white/10 bg-[#0b0d0e] px-4 text-xs font-bold tracking-wider text-white outline-none focus:border-amber-500/40"
              />

              <button
                type="button"
                onClick={() =>
                  acceptCode(
                    inviteCode,
                  )
                }
                disabled={
                  !inviteCode ||
                  Boolean(
                    working,
                  )
                }
                className="flex h-11 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black disabled:opacity-40"
              >
                <KeyRound size={13} />
                JOIN
              </button>
            </div>

            {directInvites.length >
              0 && (
              <div className="mt-6">
                <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
                  DIRECT INVITES
                </div>

                <div className="space-y-2">
                  {directInvites.map(
                    (invite) => (
                      <div
                        key={
                          invite.id
                        }
                        className="border border-amber-500/15 bg-amber-500/[0.03] p-4"
                      >
                        <div className="text-sm font-black text-white">
                          {
                            invite
                              .squad
                              ?.name
                          }{' '}
                          <span className="text-amber-500">
                            [
                            {
                              invite
                                .squad
                                ?.tag
                            }
                            ]
                          </span>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              acceptCode(
                                invite.code,
                              )
                            }
                            disabled={
                              Boolean(
                                working,
                              )
                            }
                            className="flex h-9 items-center gap-2 bg-amber-500 px-3 text-[9px] font-black tracking-wider text-black"
                          >
                            <Check size={12} />
                            ACCEPT
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              declineInvite(
                                invite,
                              )
                            }
                            disabled={
                              Boolean(
                                working,
                              )
                            }
                            className="flex h-9 items-center gap-2 border border-white/10 px-3 text-[9px] font-black tracking-wider text-stone-400"
                          >
                            <X size={12} />
                            DECLINE
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
              PENDING APPLICATIONS
            </div>

            {loading ? (
              <div className="text-xs text-stone-600">
                Loading...
              </div>
            ) : myApplications.length ===
              0 ? (
              <div className="border border-white/5 bg-[#111416] p-4 text-xs text-stone-600">
                You have no pending squad applications.
              </div>
            ) : (
              <div className="space-y-2">
                {myApplications.map(
                  (application) => (
                    <div
                      key={
                        application.id
                      }
                      className="flex items-center justify-between gap-3 border border-white/8 bg-[#111416] p-4"
                    >
                      <div>
                        <div className="text-xs font-black text-white">
                          {
                            application
                              .squad
                              ?.name
                          }{' '}
                          <span className="text-amber-500">
                            [
                            {
                              application
                                .squad
                                ?.tag
                            }
                            ]
                          </span>
                        </div>

                        <div className="mt-1 text-[9px] font-bold tracking-wider text-stone-600">
                          PENDING
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          cancelApplication(
                            application,
                          )
                        }
                        disabled={
                          working ===
                          application.id
                        }
                        className="text-[9px] font-black tracking-wider text-red-400"
                      >
                        CANCEL
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8 border border-white/8 bg-[#0e1011]">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.25em] text-amber-500">
          <UserPlus size={14} />
          RECRUITMENT CONTROL
        </div>
      </div>

      <div className="space-y-8 p-5">
        <div>
          <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
            HOW PLAYERS JOIN
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {[
              {
                id:
                  'open',

                title:
                  'OPEN JOIN',

                text:
                  'Players can join immediately.',
              },

              {
                id:
                  'application',

                title:
                  'APPLICATION',

                text:
                  'Owner approves each player.',
              },

              {
                id:
                  'invite_only',

                title:
                  'INVITE ONLY',

                text:
                  'Only codes or direct invites.',
              },
            ].map(
              (option) => {
                const active =
                  squad
                    .join_policy ===
                  option.id

                return (
                  <button
                    key={
                      option.id
                    }
                    type="button"
                    onClick={() =>
                      changeJoinPolicy(
                        option.id,
                      )
                    }
                    disabled={
                      Boolean(
                        working,
                      )
                    }
                    className={[
                      'border p-4 text-left transition',
                      active
                        ? 'border-amber-500/35 bg-amber-500/[0.06]'
                        : 'border-white/8 bg-[#111416] hover:border-white/15',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'text-[10px] font-black tracking-wider',
                        active
                          ? 'text-amber-500'
                          : 'text-stone-300',
                      ].join(' ')}
                    >
                      {
                        option.title
                      }
                    </div>

                    <div className="mt-2 text-[10px] leading-4 text-stone-600">
                      {
                        option.text
                      }
                    </div>
                  </button>
                )
              },
            )}
          </div>
        </div>

        {squad.join_policy ===
          'application' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-black tracking-wider text-stone-500">
                PENDING APPLICATIONS
              </div>

              <div className="text-[9px] font-black text-amber-500">
                {
                  pendingApplications.length
                }{' '}
                WAITING
              </div>
            </div>

            {pendingApplications.length ===
              0 ? (
              <div className="border border-white/5 bg-[#111416] p-4 text-xs text-stone-600">
                No applications waiting.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApplications.map(
                  (application) => {
                    const profile =
                      application.profile ||
                      {}

                    return (
                      <div
                        key={
                          application.id
                        }
                        className="flex flex-col gap-4 border border-white/8 bg-[#111416] p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="text-sm font-black text-white">
                            {profile.in_game_name ||
                              'Unnamed player'}
                          </div>

                          <div className="mt-1 text-[10px] text-stone-600">
                            {profile.region ||
                              'Unknown region'}
                            {' | '}
                            {profile.play_style ||
                              'No play style'}
                          </div>

                          {profile.primary_roles?.length >
                            0 && (
                            <div className="mt-2 text-[9px] font-bold tracking-wider text-stone-500">
                              {
                                profile.primary_roles.join(
                                  ' | ',
                                )
                              }
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              reviewApplication(
                                application,
                                'accepted',
                              )
                            }
                            disabled={
                              working ===
                              application.id
                            }
                            className="flex h-9 items-center gap-2 bg-emerald-500 px-3 text-[9px] font-black tracking-wider text-black disabled:opacity-40"
                          >
                            <Check size={12} />
                            ACCEPT
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              reviewApplication(
                                application,
                                'rejected',
                              )
                            }
                            disabled={
                              working ===
                              application.id
                            }
                            className="flex h-9 items-center gap-2 border border-red-500/20 bg-red-500/[0.05] px-3 text-[9px] font-black tracking-wider text-red-400 disabled:opacity-40"
                          >
                            <X size={12} />
                            REJECT
                          </button>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
              SHARE INVITE CODE
            </div>

            <button
              type="button"
              onClick={
                createShareCode
              }
              disabled={
                Boolean(
                  working,
                )
              }
              className="flex h-11 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black disabled:opacity-40"
            >
              <Clipboard size={13} />
              CREATE 7-DAY CODE
            </button>

            {latestCode && (
              <div className="mt-3 flex items-center justify-between border border-amber-500/20 bg-amber-500/[0.05] p-4">
                <div>
                  <div className="text-[9px] font-black tracking-wider text-stone-600">
                    NEW INVITE CODE
                  </div>

                  <div className="mt-1 text-lg font-black tracking-[0.2em] text-amber-500">
                    {
                      latestCode
                    }
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyCode(
                      latestCode,
                    )
                  }
                  className="text-stone-400 hover:text-white"
                >
                  <Copy size={17} />
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
              DIRECT PLAYER INVITE
            </div>

            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600"
                />

                <input
                  value={
                    playerSearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setPlayerSearch(
                      event.target.value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      searchPlayers()
                    }
                  }}
                  placeholder="Search player name..."
                  className="h-11 w-full border border-white/10 bg-[#0b0d0e] pl-9 pr-3 text-xs text-white outline-none focus:border-amber-500/40"
                />
              </div>

              <button
                type="button"
                onClick={
                  searchPlayers
                }
                className="h-11 border border-white/10 px-4 text-[9px] font-black tracking-wider text-stone-300"
              >
                SEARCH
              </button>
            </div>

            {players.length >
              0 && (
              <div className="mt-2 space-y-1">
                {players.map(
                  (player) => (
                    <div
                      key={
                        player.id
                      }
                      className="flex items-center justify-between gap-3 border border-white/5 bg-[#111416] p-3"
                    >
                      <div>
                        <div className="text-xs font-black text-white">
                          {player.in_game_name ||
                            'Unnamed player'}
                        </div>

                        <div className="mt-1 text-[9px] text-stone-600">
                          {player.region ||
                            'Unknown region'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          invitePlayer(
                            player,
                          )
                        }
                        disabled={
                          working ===
                          player.id
                        }
                        className="flex h-8 items-center gap-1.5 bg-amber-500 px-3 text-[8px] font-black tracking-wider text-black disabled:opacity-40"
                      >
                        <Send size={11} />
                        INVITE
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {ownerInvites.length >
          0 && (
          <div>
            <div className="mb-3 text-[10px] font-black tracking-wider text-stone-500">
              ACTIVE INVITES
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {ownerInvites.map(
                (invite) => (
                  <div
                    key={
                      invite.id
                    }
                    className="flex items-center justify-between gap-4 border border-white/8 bg-[#111416] p-4"
                  >
                    <div>
                      <div className="text-xs font-black text-white">
                        {invite.invited
                          ?.in_game_name ||
                          'SHARE CODE'}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyCode(
                            invite.code,
                          )
                        }
                        className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-amber-500"
                      >
                        {
                          invite.code
                        }
                        <Copy size={11} />
                      </button>

                      <div className="mt-1 text-[8px] font-bold tracking-wider text-stone-700">
                        {invite.use_count}
                        /
                        {invite.max_uses}{' '}
                        USED
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        revokeInvite(
                          invite,
                        )
                      }
                      disabled={
                        working ===
                        invite.id
                      }
                      className="text-[8px] font-black tracking-wider text-red-400"
                    >
                      REVOKE
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SquadRecruitmentPanel