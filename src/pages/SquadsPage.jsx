import SquadRecruitmentPanel from '../features/squads/components/SquadRecruitmentPanel'
import SquadRosterPanel from '../features/squads/components/SquadRosterPanel'
import {
  CheckCircle2,
  Crown,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const emptyForm = {
  name: '',
  tag: '',
  motto: '',
  description: '',
  region: 'UK / EU',
  visibility: 'public',
  recruiting: true,
}

function SquadTag({
  tag,
}) {
  return (
    <span className="text-amber-500">
      [{tag}]
    </span>
  )
}

function SquadsPage() {
  const {
    user,
  } = useAuth()

  const [
    squads,
    setSquads,
  ] = useState([])

  const [
    myMembership,
    setMyMembership,
  ] = useState(null)

  const [
    myMemberCount,
    setMyMemberCount,
  ] = useState(0)

  const [
    memberCounts,
    setMemberCounts,
  ] = useState({})

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    working,
    setWorking,
  ] = useState(false)

  const [
    showCreate,
    setShowCreate,
  ] = useState(false)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    form,
    setForm,
  ] = useState(
    emptyForm,
  )

  const loadSquads = async () => {
    if (!user) {
      return
    }

    setLoading(true)

    try {
      const {
        data: membership,
        error: membershipError,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .select(`
            id,
            role,
            joined_at,
            squad:squads (
              id,
              name,
              tag,
              motto,
              description,
              region,
              visibility,
              recruiting,
              join_policy,
              avatar_url,
              banner_url,
              created_by,
              created_at
            )
          `)
          .eq(
            'user_id',
            user.id,
          )
          .maybeSingle()

      if (membershipError) {
        throw membershipError
      }

      setMyMembership(
        membership || null,
      )

      if (
        membership?.squad?.id
      ) {
        const {
          count,
        } =
          await supabase
            .from(
              'squad_members',
            )
            .select(
              'id',
              {
                count:
                  'exact',

                head:
                  true,
              },
            )
            .eq(
              'squad_id',
              membership.squad.id,
            )

        setMyMemberCount(
          count || 0,
        )
      }
      else {
        setMyMemberCount(
          0,
        )
      }

      const {
        data: squadRows,
        error: squadError,
      } =
        await supabase
          .from(
            'squads',
          )
          .select(`
            id,
            name,
            tag,
            motto,
            description,
            region,
            visibility,
            recruiting,
            avatar_url,
            banner_url,
            created_by,
            created_at
          `)
          .eq(
            'visibility',
            'public',
          )
          .order(
            'name',
          )

      if (squadError) {
        throw squadError
      }

      const rows =
        squadRows || []

      setSquads(
        rows,
      )

      const ids =
        rows.map(
          (squad) =>
            squad.id,
        )

      if (
        ids.length === 0
      ) {
        setMemberCounts({})
        return
      }

      const {
        data: members,
        error: membersError,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .select(
            'squad_id',
          )
          .in(
            'squad_id',
            ids,
          )

      if (membersError) {
        throw membersError
      }

      const counts = {}

      for (
        const member of
        members || []
      ) {
        counts[
          member.squad_id
        ] =
          (
            counts[
              member.squad_id
            ] || 0
          ) + 1
      }

      setMemberCounts(
        counts,
      )
    }
    catch (error) {
      console.error(
        'Squad load failed:',
        error,
      )

      setMessage(
        error?.message ||
          'Could not load squads.',
      )
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSquads()
  }, [
    user?.id,
  ])

  const filteredSquads =
    useMemo(
      () => {
        const value =
          search
            .trim()
            .toLowerCase()

        if (!value) {
          return squads
        }

        return squads.filter(
          (squad) =>
            squad.name
              .toLowerCase()
              .includes(
                value,
              ) ||
            squad.tag
              .toLowerCase()
              .includes(
                value,
              ) ||
            (
              squad.region ||
              ''
            )
              .toLowerCase()
              .includes(
                value,
              ),
        )
      },
      [
        squads,
        search,
      ],
    )

  const updateForm = (
    field,
    value,
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      }),
    )
  }

  const createSquad =
    async () => {
      if (
        !user ||
        myMembership
      ) {
        return
      }

      const name =
        form.name.trim()

      const tag =
        form.tag
          .trim()
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            '',
          )

      if (
        name.length < 3
      ) {
        setMessage(
          'Squad name must be at least 3 characters.',
        )

        return
      }

      if (
        !/^[A-Z0-9]{2,6}$/.test(
          tag,
        )
      ) {
        setMessage(
          'Squad tag must be 2-6 letters or numbers.',
        )

        return
      }

      setWorking(true)
      setMessage('')

      const {
        error,
      } =
        await supabase
          .from(
            'squads',
          )
          .insert({
            name,
            tag,

            motto:
              form.motto
                .trim() ||
              null,

            description:
              form.description
                .trim() ||
              null,

            region:
              form.region,

            visibility:
              form.visibility,

            recruiting:
              form.recruiting,

            created_by:
              user.id,
          })

      setWorking(false)

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      setForm(
        emptyForm,
      )

      setShowCreate(
        false,
      )

      setMessage(
        'Squad created. You are now the squad owner.',
      )

      await loadSquads()
    }

  const joinSquad =
    async (
      squad,
    ) => {
      if (
        !user ||
        myMembership ||
        !squad.recruiting
      ) {
        return
      }

      if (
        squad.join_policy ===
        'invite_only'
      ) {
        setMessage(
          'This squad is invite only. You need a direct invite or invite code.',
        )

        return
      }

      if (
        squad.join_policy ===
        'application'
      ) {
        setWorking(true)
        setMessage('')

        const {
          data: existing,
          error: existingError,
        } =
          await supabase
            .from(
              'squad_applications',
            )
            .select(
              'id',
            )
            .eq(
              'squad_id',
              squad.id,
            )
            .eq(
              'user_id',
              user.id,
            )
            .eq(
              'status',
              'pending',
            )
            .maybeSingle()

        if (existingError) {
          setWorking(false)

          setMessage(
            existingError.message,
          )

          return
        }

        if (existing) {
          setWorking(false)

          setMessage(
            `You already have a pending application with ${squad.name}.`,
          )

          return
        }

        const {
          error,
        } =
          await supabase
            .from(
              'squad_applications',
            )
            .insert({
              squad_id:
                squad.id,

              user_id:
                user.id,
            })

        setWorking(false)

        if (error) {
          setMessage(
            error.message,
          )

          return
        }

        setMessage(
          `Application sent to ${squad.name}.`,
        )

        window.dispatchEvent(
          new Event(
            'rallystack-recruitment-changed',
          ),
        )

        return
      }

      setWorking(true)
      setMessage('')

      const {
        error,
      } =
        await supabase
          .from(
            'squad_members',
          )
          .insert({
            squad_id:
              squad.id,

            user_id:
              user.id,

            role:
              'member',
          })

      setWorking(false)

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      setMessage(
        `You joined ${squad.name}.`,
      )

      await loadSquads()
    }

  const leaveSquad =
    async () => {
      if (
        !myMembership ||
        myMembership.role ===
          'owner'
      ) {
        return
      }

      if (
        !window.confirm(
          `Leave ${myMembership.squad.name}?`,
        )
      ) {
        return
      }

      setWorking(true)

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
            myMembership.id,
          )

      setWorking(false)

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      setMessage(
        'You left the squad.',
      )

      await loadSquads()
    }

  const disbandSquad =
    async () => {
      if (
        !myMembership ||
        myMembership.role !==
          'owner'
      ) {
        return
      }

      if (
        !window.confirm(
          `Permanently disband ${myMembership.squad.name}? This removes the whole squad and its roster.`,
        )
      ) {
        return
      }

      setWorking(true)

      const {
        error,
      } =
        await supabase
          .from(
            'squads',
          )
          .delete()
          .eq(
            'id',
            myMembership.squad.id,
          )

      setWorking(false)

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      setMessage(
        'Squad disbanded.',
      )

      await loadSquads()
    }

  const toggleRecruiting =
    async () => {
      if (
        myMembership?.role !==
        'owner'
      ) {
        return
      }

      const squad =
        myMembership.squad

      setWorking(true)

      const {
        error,
      } =
        await supabase
          .from(
            'squads',
          )
          .update({
            recruiting:
              !squad.recruiting,
          })
          .eq(
            'id',
            squad.id,
          )

      setWorking(false)

      if (error) {
        setMessage(
          error.message,
        )

        return
      }

      await loadSquads()
    }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col gap-5 border-b border-white/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-500" />

            <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
              RALLYSTACK COMMUNITY
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            SQUADS
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
            Build a permanent group, recruit players and keep your crew together between WARDOGS sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadSquads
          }
          disabled={
            loading
          }
          className="flex h-11 items-center justify-center gap-2 border border-white/10 bg-[#111416] px-5 text-[10px] font-black tracking-wider text-stone-300 hover:border-white/20 hover:text-white"
        >
          <RefreshCw
            size={14}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          REFRESH
        </button>
      </div>

      {message && (
        <div className="mb-6 border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs font-semibold text-amber-400">
          {message}
        </div>
      )}

      {myMembership ? (
        <section className="mb-8 border border-amber-500/25 bg-amber-500/[0.04]">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-500">
                {myMembership.role ===
                'owner' ? (
                  <Crown size={25} />
                ) : (
                  <Shield size={25} />
                )}
              </div>

              <div>
                <div className="text-[9px] font-black tracking-[0.25em] text-amber-500">
                  YOUR SQUAD
                </div>

                <div className="mt-2 text-2xl font-black text-white">
                  {
                    myMembership
                      .squad
                      .name
                  }{' '}
                  <SquadTag
                    tag={
                      myMembership
                        .squad
                        .tag
                    }
                  />
                </div>

                {myMembership.squad.motto && (
                  <div className="mt-2 text-xs font-bold tracking-[0.12em] text-stone-400">
                    {
                      myMembership
                        .squad
                        .motto
                    }
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    {myMemberCount}{' '}
                    {myMemberCount ===
                    1
                      ? 'MEMBER'
                      : 'MEMBERS'}
                  </span>

                  <span>
                    ROLE:{' '}
                    <strong className="text-stone-300">
                      {myMembership.role.toUpperCase()}
                    </strong>
                  </span>

                  <span>
                    {
                      myMembership
                        .squad
                        .recruiting
                        ? 'RECRUITING'
                        : 'RECRUITMENT CLOSED'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {myMembership.role ===
                'owner' && (
                <>
                  <button
                    type="button"
                    onClick={
                      toggleRecruiting
                    }
                    disabled={
                      working
                    }
                    className="h-10 border border-white/10 bg-[#111416] px-4 text-[10px] font-black tracking-wider text-stone-300 hover:text-white"
                  >
                    {myMembership
                      .squad
                      .recruiting
                      ? 'CLOSE RECRUITMENT'
                      : 'OPEN RECRUITMENT'}
                  </button>

                  <button
                    type="button"
                    onClick={
                      disbandSquad
                    }
                    disabled={
                      working
                    }
                    className="flex h-10 items-center gap-2 border border-red-500/20 bg-red-500/[0.05] px-4 text-[10px] font-black tracking-wider text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={13} />
                    DISBAND
                  </button>
                </>
              )}

              {myMembership.role !==
                'owner' && (
                <button
                  type="button"
                  onClick={
                    leaveSquad
                  }
                  disabled={
                    working
                  }
                  className="flex h-10 items-center gap-2 border border-white/10 bg-[#111416] px-4 text-[10px] font-black tracking-wider text-stone-300 hover:text-white"
                >
                  <LogOut size={13} />
                  LEAVE SQUAD
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-8 border border-white/8 bg-[#0e1011] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-white">
                YOU ARE NOT IN A SQUAD
              </div>

              <div className="mt-2 text-xs text-stone-500">
                Join a recruiting squad below or create your own.
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreate(
                  !showCreate,
                )
              }
              className="flex h-11 items-center justify-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black"
            >
              <Plus size={15} />

              CREATE SQUAD
            </button>
          </div>
        </section>
      )}

      {!myMembership &&
        showCreate && (
          <section className="mb-8 border border-amber-500/20 bg-[#101213]">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
                CREATE SQUAD
              </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  SQUAD NAME
                </span>

                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'name',
                      event.target
                        .value,
                    )
                  }
                  placeholder="LAST ORDERS"
                  maxLength={50}
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  TAG
                </span>

                <input
                  value={
                    form.tag
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'tag',
                      event.target
                        .value
                        .toUpperCase(),
                    )
                  }
                  placeholder="LAST"
                  maxLength={6}
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm uppercase text-white outline-none focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  MOTTO
                </span>

                <input
                  value={
                    form.motto
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'motto',
                      event.target
                        .value,
                    )
                  }
                  placeholder="ONE MORE ROUND."
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  REGION
                </span>

                <select
                  value={
                    form.region
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'region',
                      event.target
                        .value,
                    )
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
                >
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
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  VISIBILITY
                </span>

                <select
                  value={
                    form.visibility
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'visibility',
                      event.target
                        .value,
                    )
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] px-4 text-sm text-white outline-none"
                >
                  <option value="public">
                    Public
                  </option>

                  <option value="invite_only">
                    Invite only
                  </option>

                  <option value="private">
                    Private
                  </option>
                </select>
              </label>

              <button
                type="button"
                onClick={() =>
                  updateForm(
                    'recruiting',
                    !form.recruiting,
                  )
                }
                className={[
                  'h-12 border px-4 text-left text-xs font-black',
                  form.recruiting
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400'
                    : 'border-white/10 bg-[#0b0d0e] text-stone-500',
                ].join(' ')}
              >
                {form.recruiting
                  ? 'RECRUITING: YES'
                  : 'RECRUITING: NO'}
              </button>

              <label className="md:col-span-2">
                <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                  DESCRIPTION
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'description',
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  className="w-full resize-none border border-white/10 bg-[#0b0d0e] px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={
                    createSquad
                  }
                  disabled={
                    working
                  }
                  className="h-11 bg-amber-500 px-6 text-[10px] font-black tracking-wider text-black disabled:opacity-50"
                >
                  {working
                    ? 'CREATING...'
                    : 'CREATE SQUAD'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(
                      false,
                    )
                  }
                  className="h-11 border border-white/10 px-6 text-[10px] font-black tracking-wider text-stone-400"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </section>
        )}

      {myMembership && (
        <SquadRosterPanel
          squadId={
            myMembership.squad.id
          }
          currentUserId={
            user.id
          }
          currentUserRole={
            myMembership.role
          }
          onChanged={
            loadSquads
          }
        />
      )}
            <SquadRecruitmentPanel
        user={
          user
        }
        myMembership={
          myMembership
        }
        onChanged={
          loadSquads
        }
        onMessage={
          setMessage
        }
      />
<section className="border border-white/8 bg-[#0e1011]">
        <div className="flex flex-col gap-4 border-b border-white/8 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-black tracking-[0.25em] text-stone-500">
              SQUAD DIRECTORY
            </div>

            <div className="mt-1 text-xs text-stone-600">
              Public RallyStack squads currently available.
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600"
            />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search squads..."
              className="h-11 w-full border border-white/10 bg-[#0b0d0e] pl-10 pr-4 text-xs text-white outline-none focus:border-amber-500/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-xs font-bold tracking-wider text-stone-600">
            LOADING SQUADS...
          </div>
        ) : filteredSquads.length ===
          0 ? (
          <div className="flex min-h-56 items-center justify-center text-xs text-stone-600">
            No squads match your search.
          </div>
        ) : (
          <div className="grid gap-px bg-white/5 md:grid-cols-2 xl:grid-cols-3">
            {filteredSquads.map(
              (squad) => {
                const isMine =
                  myMembership
                    ?.squad
                    ?.id ===
                  squad.id

                const count =
                  memberCounts[
                    squad.id
                  ] || 0

                return (
                  <article
                    key={
                      squad.id
                    }
                    className="bg-[#101213] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-black text-white">
                          {
                            squad.name
                          }{' '}
                          <SquadTag
                            tag={
                              squad.tag
                            }
                          />
                        </div>

                        <div className="mt-2 text-[10px] font-bold tracking-wider text-stone-600">
                          {
                            squad.region ||
                            'ANY REGION'
                          }
                        </div>
                      </div>

                      {squad.recruiting ? (
                        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider text-emerald-400">
                          <CheckCircle2 size={12} />
                          RECRUITING
                        </div>
                      ) : (
                        <div className="text-[9px] font-black tracking-wider text-stone-600">
                          CLOSED
                        </div>
                      )}
                    </div>

                    {squad.motto && (
                      <div className="mt-4 text-xs font-bold tracking-[0.1em] text-stone-400">
                        {squad.motto}
                      </div>
                    )}

                    {squad.description && (
                      <p className="mt-3 min-h-12 text-xs leading-5 text-stone-600">
                        {
                          squad.description
                        }
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                        <Users size={13} />
                        {count}{' '}
                        {count === 1
                          ? 'MEMBER'
                          : 'MEMBERS'}
                      </div>

                      {isMine ? (
                        <div className="text-[9px] font-black tracking-wider text-amber-500">
                          YOUR SQUAD
                        </div>
                      ) : !myMembership &&
                        squad.recruiting ? (
                        <button
                          type="button"
                          onClick={() =>
                            joinSquad(
                              squad,
                            )
                          }
                          disabled={
                            working
                          }
                          className="flex h-9 items-center gap-2 bg-amber-500 px-4 text-[9px] font-black tracking-wider text-black disabled:opacity-50"
                        >
                          <UserPlus size={13} />
                          {squad.join_policy ===
                          'application'
                            ? 'APPLY'
                            : squad.join_policy ===
                                'invite_only'
                              ? 'INVITE ONLY'
                              : 'JOIN'}
                        </button>
                      ) : myMembership ? (
                        <div className="text-[9px] font-bold text-stone-700">
                          ALREADY IN A SQUAD
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold text-stone-700">
                          NOT RECRUITING
                        </div>
                      )}
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default SquadsPage