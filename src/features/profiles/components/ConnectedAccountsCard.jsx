import {
  Check,
  ExternalLink,
  Gamepad2,
  MessageCircleMore,
} from 'lucide-react'

function ConnectedAccountsCard({
  discordConnected,
  steamConnected,
  onDiscord,
  onSteam,
}) {
  return (
    <section className="border border-white/8 bg-[#111416]">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="text-[10px] font-black tracking-[0.25em] text-stone-500">
          CONNECTED ACCOUNTS
        </div>

        <div className="mt-1 text-xs text-stone-600">
          Link your community and game identities to RallyStack.
        </div>
      </div>

      <div className="divide-y divide-white/8">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#5865F2]/30 bg-[#5865F2]/10 text-[#8d96ff]">
              <MessageCircleMore size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">
                    DISCORD
                  </div>

                  <div className="mt-1 text-xs text-stone-500">
                    {discordConnected
                      ? 'Discord account connected'
                      : 'LFG, voice and squad community'}
                  </div>
                </div>

                {discordConnected && (
                  <div className="flex items-center gap-1 text-[9px] font-black tracking-wider text-emerald-400">
                    <Check size={13} />
                    CONNECTED
                  </div>
                )}
              </div>

              {discordConnected ? (
                <div className="mt-4 flex items-center justify-between border border-white/8 bg-black/20 px-4 py-3">
                  <div>
                    <div className="text-xs font-bold text-stone-300">
                      RallyStack Discord
                    </div>

                    <div className="mt-1 text-[10px] text-stone-600">
                      OAuth identity will appear here.
                    </div>
                  </div>

                  <ExternalLink size={14} className="text-stone-600" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onDiscord}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#5865F2] text-[10px] font-black tracking-wider text-white transition hover:bg-[#6872f5]"
                >
                  <MessageCircleMore size={15} />
                  CONNECT DISCORD
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <Gamepad2 size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">
                    STEAM
                  </div>

                  <div className="mt-1 text-xs text-stone-500">
                    {steamConnected
                      ? 'Steam identity connected'
                      : 'Game identity and WARDOGS presence'}
                  </div>
                </div>

                {steamConnected && (
                  <div className="flex items-center gap-1 text-[9px] font-black tracking-wider text-emerald-400">
                    <Check size={13} />
                    CONNECTED
                  </div>
                )}
              </div>

              {steamConnected ? (
                <div className="mt-4 flex items-center justify-between border border-white/8 bg-black/20 px-4 py-3">
                  <div>
                    <div className="text-xs font-bold text-stone-300">
                      Steam account
                    </div>

                    <div className="mt-1 text-[10px] text-stone-600">
                      Steam username and avatar will appear here.
                    </div>
                  </div>

                  <ExternalLink size={14} className="text-stone-600" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSteam}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#1b2838] text-[10px] font-black tracking-wider text-white transition hover:bg-[#22354a]"
                >
                  <Gamepad2 size={15} />
                  CONNECT STEAM
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ConnectedAccountsCard
