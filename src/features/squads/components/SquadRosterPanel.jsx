import {
  Crown,
  MapPin,
  Shield,
  Star,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../../../lib/supabase'

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',
    },
  ).format(
    new Date(value),
  )
}

function rolePriority(role) {
  if (role === 'owner') {
    return 0
  }

  if (role === 'officer') {
    return 1
  }

  return 2
}

function RoleBadge({
  role,
}) {
  const classes = {
    owner:
      'border-amber-500/30 bg-amber-500/10 text-amber-400',

    officer:
      'border-sky-500/25 bg-sky-500/[0.07] text-sky-400',

    member:
      'border-white/10 bg-white/[0.03] text-stone-400',
  }

  return (
    <span
      className={[
        'inline-flex h-6 items-center gap-1 border px-2 text-[9px] font-black tracking-wider',
        classes[role] ||
          classes.member,
      ].join(' ')}
    >
      {role === 'owner' ? (
        <Crown size={10} />
      ) : role === 'officer' ? (
        <Shield size={10} />
      ) : (
        <Users size={10} />
      )}

      {role.toUpperCase()}
    </span>
  )
}

function SquadRosterPanel({
  squadId,
  currentUserId,
  currentUserRole,
  onChanged,
}) {
  const [
    members,
    setMembers,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    workingId,
    setWorkingId,
  ] = useState(null)

  const [
    message,
    setMessage,
  ] = useState('')

  const loadRoster =
    async () => {
      if (!squadId) {
        setMembers([])
        return
      }

      setLoading(true)
      setMessage('')

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .select(`
            id,
            squad_id,
            user_id,
            role,
            joined_at,
            profile:profiles!squad_members_user_id_fkey (
              id,
              in_game_name,
              region,
              play_style,
              primary_roles,
              secondary_roles,
              looking_for_group
            )
          `)
          .eq(
            'squad_id',
            squadId,
          )

      setLoading(false)

      if (error) {
        console.error(
          'Squad roster failed:',
          error,
        )

        setMessage(
          error.message,
        )

        return
      }

      setMembers(
        data || [],
      )
    }

  useEffect(() => {
    loadRoster()
  }, [
    squadId,
  ])

  const sortedMembers =
    useMemo(
      () =>
        [...members].sort(
          (
            first,
            second,
          ) => {
            const roleSort =
              rolePriority(
                first.role,
              ) -
              rolePriority(
                second.role,
              )

            if (
              roleSort !== 0
            ) {
              return roleSort
            }

            const firstName =
              first.profile
                ?.in_game_name ||
              ''

            const secondName =
              second.profile
                ?.in_game_name ||
              ''

            return firstName.localeCompare(
              secondName,
            )
          },
        ),
      [
        members,
      ],
    )

  const changeRole =
    async (
      member,
      nextRole,
    ) => {
      if (
        currentUserRole !==
          'owner' ||
        member.role ===
          'owner'
      ) {
        return
      }

      setWorkingId(
        member.id,
      )

      setMessage('')

      const {
        error,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .update({
            role:
              nextRole,
          })
          .eq(
            'id',
            member.id,
          )

      setWorkingId(
        null,
      )

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      await loadRoster()

      if (onChanged) {
        await onChanged()
      }
    }

  const removeMember =
    async (
      member,
    ) => {
      if (
        currentUserRole !==
          'owner' ||
        member.role ===
          'owner' ||
        member.user_id ===
          currentUserId
      ) {
        return
      }

      const playerName =
        member.profile
          ?.in_game_name ||
        'this player'

      if (
        !window.confirm(
          `Remove ${playerName} from the squad?`,
        )
      ) {
        return
      }

      setWorkingId(
        member.id,
      )

      setMessage('')

      const {
        error,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .delete()
          .eq(
            'id',
            member.id,
          )

      setWorkingId(
        null,
      )

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      await loadRoster()

      if (onChanged) {
        await onChanged()
      }
    }

  return (
    <section className="mb-8 border border-white/8 bg-[#0e1011]">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
            SQUAD ROSTER
          </div>

          <div className="mt-1 text-xs text-stone-600">
            {members.length}{' '}
            {members.length === 1
              ? 'member'
              : 'members'}
          </div>
        </div>

        <Users
          size={20}
          className="text-stone-700"
        />
      </div>

      {message && (
        <div className="border-b border-red-500/20 bg-red-500/[0.04] px-5 py-3 text-xs text-red-400">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center text-xs font-bold tracking-wider text-stone-600">
          LOADING ROSTER...
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {sortedMembers.map(
            (member) => {
              const profile =
                member.profile ||
                {}

              const displayName =
                profile.in_game_name ||
                'Unnamed player'

              const roles =
                profile.primary_roles ||
                []

              const canManage =
                currentUserRole ===
                  'owner' &&
                member.role !==
                  'owner' &&
                member.user_id !==
                  currentUserId

              const busy =
                workingId ===
                member.id

              return (
                <div
                  key={
                    member.id
                  }
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm font-black text-white">
                        {
                          displayName
                        }
                      </div>

                      <RoleBadge
                        role={
                          member.role
                        }
                      />

                      {profile.looking_for_group && (
                        <span className="border border-emerald-500/20 bg-emerald-500/[0.05] px-2 py-1 text-[8px] font-black tracking-wider text-emerald-400">
                          LOOKING TO PLAY
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={11} />

                        {profile.region ||
                          'Unknown region'}
                      </span>

                      {profile.play_style && (
                        <span>
                          {
                            profile.play_style
                          }
                        </span>
                      )}

                      <span>
                        JOINED{' '}
                        {formatDate(
                          member.joined_at,
                        )}
                      </span>
                    </div>

                    {roles.length >
                      0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {roles.map(
                          (role) => (
                            <span
                              key={
                                role
                              }
                              className="flex items-center gap-1 bg-amber-500/[0.06] px-2 py-1 text-[9px] font-black tracking-wider text-amber-500"
                            >
                              <Star
                                size={9}
                                fill="currentColor"
                              />

                              {
                                role
                              }
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {member.role ===
                      'member' ? (
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            changeRole(
                              member,
                              'officer',
                            )
                          }
                          className="flex h-9 items-center gap-2 border border-sky-500/20 bg-sky-500/[0.05] px-3 text-[9px] font-black tracking-wider text-sky-400 disabled:opacity-40"
                        >
                          <UserCog size={12} />

                          PROMOTE
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            changeRole(
                              member,
                              'member',
                            )
                          }
                          className="flex h-9 items-center gap-2 border border-white/10 bg-white/[0.03] px-3 text-[9px] font-black tracking-wider text-stone-400 disabled:opacity-40"
                        >
                          <UserCog size={12} />

                          DEMOTE
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          removeMember(
                            member,
                          )
                        }
                        className="flex h-9 items-center gap-2 border border-red-500/20 bg-red-500/[0.05] px-3 text-[9px] font-black tracking-wider text-red-400 disabled:opacity-40"
                      >
                        <Trash2 size={12} />

                        REMOVE
                      </button>
                    </div>
                  )}
                </div>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

export default SquadRosterPanel