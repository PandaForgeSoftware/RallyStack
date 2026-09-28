import {
  Headphones,
  MapPin,
  Radio,
  Users,
} from 'lucide-react'

function LfgGroupCard({ group }) {
  const openSlots = group.maxPlayers - group.players

  return (
    <article className="border border-white/8 bg-[#111416] p-5 transition hover:border-amber-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            FORMING NOW
          </div>

          <h3 className="mt-3 text-xl font-black text-white">
            {group.name}
          </h3>

          <div className="mt-1 text-xs text-stone-500">
            Hosted by {group.host}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-black text-white">
            {group.players}/{group.maxPlayers}
          </div>

          <div className="text-[9px] font-black tracking-wider text-stone-600">
            PLAYERS
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/8 py-4">
        <div>
          <div className="text-[9px] font-black tracking-wider text-stone-600">
            REGION
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-stone-300">
            <MapPin size={12} />
            {group.region}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-black tracking-wider text-stone-600">
            STYLE
          </div>

          <div className="mt-1 text-xs font-bold text-stone-300">
            {group.playStyle}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[9px] font-black tracking-wider text-stone-600">
          LOOKING FOR
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {group.roles.map((role) => (
            <span
              key={role}
              className="bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-black tracking-wider text-amber-500"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {group.serverCode && (
        <div className="mt-4 flex items-center gap-2 border border-white/8 bg-black/20 px-3 py-3">
          <Radio size={14} className="text-emerald-400" />

          <div className="text-[10px] text-stone-500">
            Server code{' '}
            <span className="font-mono font-bold text-stone-300">
              {group.serverCode}
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <Headphones size={13} />
          Mic {group.micRequired ? 'required' : 'optional'}
        </div>

        <button
          type="button"
          className="flex h-10 items-center gap-2 bg-amber-500 px-4 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
        >
          <Users size={14} />
          JOIN GROUP
        </button>
      </div>

      <div className="mt-3 text-[9px] text-stone-600">
        {openSlots} open {openSlots === 1 ? 'slot' : 'slots'}
      </div>
    </article>
  )
}

export default LfgGroupCard
