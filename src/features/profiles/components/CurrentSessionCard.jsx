import {
  Check,
  Copy,
  Radio,
  Server,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'

function CurrentSessionCard({
  session,
  discordConnected,
  onSetSession,
  onClearSession,
}) {
  const [serverCode, setServerCode] = useState(session?.serverCode || '')
  const [copied, setCopied] = useState(false)

  const submitServer = () => {
    const cleanCode = serverCode.trim()

    if (!cleanCode) {
      return
    }

    onSetSession(cleanCode)
  }

  const copyCode = async () => {
    if (!session?.serverCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(session.serverCode)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="border border-white/8 bg-[#0e1011]">
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black tracking-[0.25em] text-amber-500">
            CURRENT SESSION
          </div>

          <div className="mt-1 text-xs text-stone-500">
            Temporary activity for LFG and friends.
          </div>
        </div>

        {session?.active && (
          <div className="flex items-center gap-2 text-[9px] font-black tracking-wider text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            PLAYING NOW
          </div>
        )}
      </div>

      <div className="p-5">
        {!session?.active ? (
          <>
            <div className="border border-dashed border-white/10 bg-[#111416] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/8 bg-black/20 text-stone-500">
                  <Radio size={20} />
                </div>

                <div>
                  <div className="text-sm font-black text-white">
                    SET WHERE YOU'RE PLAYING
                  </div>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                    Enter the WARDOGS server join code once. RallyStack will
                    eventually resolve the official server, map, region and live
                    population automatically.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  value={serverCode}
                  onChange={(event) => setServerCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      submitServer()
                    }
                  }}
                  placeholder="Enter server code"
                  className="h-12 min-w-0 flex-1 border border-white/10 bg-[#0b0d0e] px-4 font-mono text-sm tracking-wider text-white outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-700 focus:border-amber-500/50"
                />

                <button
                  type="button"
                  onClick={submitServer}
                  className="h-12 bg-amber-500 px-6 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
                >
                  SET SERVER
                </button>
              </div>

              {discordConnected && (
                <div className="mt-4 border-l-2 border-[#5865F2] bg-[#5865F2]/[0.05] px-4 py-3">
                  <div className="text-[10px] font-black tracking-wider text-[#8d96ff]">
                    DISCORD SHORTCUT
                  </div>

                  <div className="mt-1 text-xs text-stone-500">
                    Later you can simply use{' '}
                    <span className="font-mono text-stone-300">
                      /server CODE
                    </span>{' '}
                    and this card updates automatically.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-[10px] leading-5 text-stone-600">
              This is session data, not permanent profile data. RallyStack will
              expire it automatically after a set period.
            </div>
          </>
        ) : (
          <div className="border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Server size={22} />
                </div>

                <div>
                  <div className="text-[9px] font-black tracking-[0.2em] text-emerald-400">
                    WARDOGS SERVER
                  </div>

                  <div className="mt-1 text-xl font-black text-white">
                    Official server
                  </div>

                  <div className="mt-2 text-xs text-stone-500">
                    Live server details will resolve from the server code.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClearSession}
                className="flex h-9 items-center justify-center gap-2 border border-white/10 px-3 text-[9px] font-black tracking-wider text-stone-500 transition hover:border-red-500/30 hover:text-red-400"
              >
                <X size={13} />
                LEAVE SESSION
              </button>
            </div>

            <div className="grid border-t border-white/8 sm:grid-cols-3">
              <div className="p-4">
                <div className="text-[9px] font-black tracking-wider text-stone-600">
                  JOIN CODE
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-lg font-black tracking-[0.12em] text-white">
                    {session.serverCode}
                  </span>

                  <button
                    type="button"
                    onClick={copyCode}
                    className="text-stone-500 transition hover:text-white"
                  >
                    {copied ? (
                      <Check size={15} className="text-emerald-400" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="border-y border-white/8 p-4 sm:border-x sm:border-y-0">
                <div className="text-[9px] font-black tracking-wider text-stone-600">
                  SERVER POPULATION
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-stone-300">
                  <Users size={15} className="text-stone-600" />
                  Live when API connected
                </div>
              </div>

              <div className="p-4">
                <div className="text-[9px] font-black tracking-wider text-stone-600">
                  SOURCE
                </div>

                <div className="mt-2 text-sm font-bold text-[#8d96ff]">
                  {discordConnected ? 'Discord / RallyStack' : 'RallyStack'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default CurrentSessionCard
