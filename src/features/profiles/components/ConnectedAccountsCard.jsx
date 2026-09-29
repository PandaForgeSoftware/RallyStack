import {
  Check,
  ExternalLink,
  Gamepad2,
  Loader2,
  MessageCircleMore,
  RefreshCw,
} from 'lucide-react'

function ConnectedAccountsCard({
  discordConnected,
  discordAccount,
  steamConnected,
  steamAccount,
  steamConnecting,
  steamPresence,
  steamPresenceLoading,
  onDiscord,
  onSteam,
  onRefreshSteam,
}) {
  const steamLive =
    steamPresence?.playing_wardogs === true

  const otherGame =
    steamPresence?.playing_game === true &&
    !steamLive

  const steamOnline =
    steamPresence?.presence_available &&
    steamPresence?.persona_state !== 0

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
                <div className="mt-4 flex items-center gap-3 border border-white/8 bg-black/20 px-4 py-3">
                  {discordAccount?.provider_avatar_url ? (
                    <img
                      src={discordAccount.provider_avatar_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/10 text-[#8d96ff]">
                      <MessageCircleMore size={18} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-stone-200">
                      {discordAccount?.provider_username ||
                        'Discord account'}
                    </div>

                    <div className="mt-1 truncate text-[10px] text-stone-600">
                      Discord ID:{' '}
                      {discordAccount?.provider_user_id ||
                        'Connected'}
                    </div>
                  </div>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">
                    STEAM
                  </div>

                  <div className="mt-1 text-xs text-stone-500">
                    {steamConnected
                      ? 'Steam account connected'
                      : 'Game identity and WARDOGS presence'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {steamConnected && (
                    <button
                      type="button"
                      onClick={onRefreshSteam}
                      disabled={steamPresenceLoading}
                      title="Refresh Steam status"
                      className="text-stone-600 transition hover:text-white disabled:opacity-40"
                    >
                      <RefreshCw
                        size={14}
                        className={
                          steamPresenceLoading
                            ? 'animate-spin'
                            : ''
                        }
                      />
                    </button>
                  )}

                  {steamConnected && (
                    <div className="flex items-center gap-1 text-[9px] font-black tracking-wider text-emerald-400">
                      <Check size={13} />
                      CONNECTED
                    </div>
                  )}
                </div>
              </div>

              {steamConnected ? (
                <>
                  <div className="mt-4 flex items-center gap-3 border border-white/8 bg-black/20 px-4 py-3">
                    {steamAccount?.provider_avatar_url ? (
                      <img
                        src={steamAccount.provider_avatar_url}
                        alt=""
                        className="h-10 w-10 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1b2838] text-sky-400">
                        <Gamepad2 size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-stone-200">
                        {steamAccount?.provider_username ||
                          'Steam account'}
                      </div>

                      <div className="mt-1 truncate text-[10px] text-stone-600">
                        Steam ID:{' '}
                        {steamAccount?.provider_user_id ||
                          'Linked'}
                      </div>
                    </div>

                    {steamAccount?.provider_profile_url && (
                      <a
                        href={steamAccount.provider_profile_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Steam profile"
                        className="text-stone-600 transition hover:text-sky-400"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>

                  <div
                    className={`mt-3 border px-4 py-3 ${
                      steamLive
                        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                        : 'border-white/8 bg-black/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[9px] font-black tracking-[0.22em] text-stone-500">
                        LIVE STEAM STATUS
                      </div>

                      {steamPresenceLoading && (
                        <Loader2
                          size={13}
                          className="animate-spin text-stone-500"
                        />
                      )}
                    </div>

                    {steamPresenceLoading &&
                    !steamPresence ? (
                      <div className="mt-2 text-xs text-stone-500">
                        Checking Steam...
                      </div>
                    ) : steamLive ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          PLAYING WARDOGS
                        </div>

                        <div className="mt-2 text-[11px] text-stone-400">
                          {steamPresence.game_name ||
                            'WARDOGS'}
                        </div>

                        {steamPresence.server_ip && (
                          <div className="mt-2 border-t border-white/5 pt-2">
                            <div className="text-[9px] font-black tracking-wider text-stone-600">
                              STEAM SERVER
                            </div>

                            <div className="mt-1 font-mono text-[11px] text-stone-300">
                              {steamPresence.server_ip}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : otherGame ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          PLAYING ON STEAM
                        </div>

                        <div className="mt-2 text-[11px] text-stone-400">
                          {steamPresence.game_name ||
                            'Another game'}
                        </div>
                      </div>
                    ) : steamOnline ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        Steam online
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                        <span className="h-2 w-2 rounded-full bg-stone-700" />
                        Not currently playing WARDOGS
                      </div>
                    )}

                    {steamPresence?.checked_at && (
                      <div className="mt-3 text-[9px] text-stone-700">
                        Steam checked{' '}
                        {new Date(
                          steamPresence.checked_at,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSteam}
                  disabled={steamConnecting}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#1b2838] text-[10px] font-black tracking-wider text-white transition hover:bg-[#22354a] disabled:cursor-wait disabled:opacity-60"
                >
                  {steamConnecting ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Gamepad2 size={15} />
                  )}

                  {steamConnecting
                    ? 'OPENING STEAM'
                    : 'CONNECT STEAM'}
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