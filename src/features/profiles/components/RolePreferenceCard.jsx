function RolePreferenceCard({
  role,
  icon: Icon,
  description,
  state,
  onPrimary,
  onSecondary,
  onClear,
}) {
  const isPrimary = state === 'primary'
  const isSecondary = state === 'secondary'

  return (
    <article
      className={[
        'border p-4 transition',
        isPrimary
          ? 'border-amber-500/60 bg-amber-500/[0.07]'
          : isSecondary
            ? 'border-sky-500/40 bg-sky-500/[0.05]'
            : 'border-white/8 bg-[#111416] hover:border-white/15',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center border',
            isPrimary
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
              : isSecondary
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                : 'border-white/8 bg-black/20 text-stone-500',
          ].join(' ')}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black tracking-wider text-white">
              {role}
            </h3>

            {isPrimary && (
              <span className="bg-amber-500/10 px-2 py-1 text-[9px] font-black tracking-wider text-amber-500">
                PRIMARY
              </span>
            )}

            {isSecondary && (
              <span className="bg-sky-500/10 px-2 py-1 text-[9px] font-black tracking-wider text-sky-400">
                SECONDARY
              </span>
            )}
          </div>

          <p className="mt-2 text-xs leading-5 text-stone-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onPrimary}
          className={[
            'border px-3 py-2 text-[10px] font-black tracking-wider transition',
            isPrimary
              ? 'border-amber-500 bg-amber-500 text-black'
              : 'border-white/10 text-stone-400 hover:border-amber-500/40 hover:text-white',
          ].join(' ')}
        >
          PRIMARY
        </button>

        <button
          type="button"
          onClick={onSecondary}
          className={[
            'border px-3 py-2 text-[10px] font-black tracking-wider transition',
            isSecondary
              ? 'border-sky-500 bg-sky-500 text-black'
              : 'border-white/10 text-stone-400 hover:border-sky-500/40 hover:text-white',
          ].join(' ')}
        >
          SECONDARY
        </button>
      </div>

      {(isPrimary || isSecondary) && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 w-full py-1 text-[9px] font-bold tracking-wider text-stone-600 transition hover:text-stone-300"
        >
          CLEAR ROLE
        </button>
      )}
    </article>
  )
}

export default RolePreferenceCard
