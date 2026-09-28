import {
  Clock3,
  Headphones,
  MapPin,
  Radio,
  Shield,
  Star,
  UserPlus,
} from 'lucide-react'

function LfgPlayerCard({ player, isYou = false }) {
  return (
    <article
      className={[
        'border bg-[#111416] transition',
        isYou
          ? 'border-amber-500/40'
          : 'border-white/8 hover:border-white/15',
      ].join(' ')}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-white/10 bg-black/30 text-lg font-black text-stone-400">
            {player.name.slice(0, 2).toUpperCase()}

            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#111416] bg-emerald-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black text-white">
                {player.name}
              </h3>

              {isYou && (
                <span className="bg-amber-500/10 px-2 py-1 text-[9px] font-black tracking-wider text-amber-500">
                  YOU
                </span>
              )}

              {player.squad && (
                <span className="text-xs font-black text-amber-500">
                  {player.squad}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-stone-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                {player.region}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock3 size={12} />
                {player.time}
              </span>

              <span
                className={[
                  'flex items-center gap-1.5',
                  player.mic ? 'text-emerald-400' : 'text-stone-600',
                ].join(' ')}
              >
                <Headphones size={12} />
                {player.mic ? 'Mic' : 'No mic'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-y border-white/8 py-4">
          <div className="mb-3 text-[9px] font-black tracking-[0.2em] text-stone-600">
            PREFERRED ROLES
          </div>

          <div className="flex flex-wrap gap-2">
            {player.primaryRoles.map((role) => (
              <span
                key={`primary-${role}`}
                className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-black tracking-wider text-amber-500"
              >
                <Star size={10} fill="currentColor" />
                {role}
              </span>
            ))}

            {player.secondaryRoles.map((role) => (
              <span
                key={`secondary-${role}`}
                className="bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-black tracking-wider text-sky-400"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[9px] font-black tracking-wider text-stone-600">
              PLAY STYLE
            </div>

            <div className="mt-1 text-xs font-bold text-stone-300">
              {player.playStyle}
            </div>
          </div>

          <div>
            <div className="text-[9px] font-black tracking-wider text-stone-600">
              SQUAD
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-stone-300">
              <Shield size={12} className="text-stone-600" />
              {player.squadName || 'No squad'}
            </div>
          </div>
        </div>

        {player.serverCode && (
          <div className="mt-4 flex items-center justify-between border border-emerald-500/15 bg-emerald-500/[0.04] px-3 py-3">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-emerald-400" />

              <div>
                <div className="text-[9px] font-black tracking-wider text-emerald-400">
                  PLAYING WARDOGS
                </div>

                <div className="mt-0.5 text-[10px] text-stone-500">
                  Join code {player.serverCode}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isYou && (
          <button
            type="button"
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-white/10 text-[10px] font-black tracking-wider text-white transition hover:border-amber-500/40 hover:bg-amber-500/[0.04]"
          >
            <UserPlus size={15} />
            INVITE TO GROUP
          </button>
        )}
      </div>
    </article>
  )
}

export default LfgPlayerCard
