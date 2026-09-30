import {
  useMemo,
  useState,
} from 'react'

import {
  Backpack,
  Crosshair,
  Package,
  RotateCw,
  Save,
  Search,
  Share2,
  Shield,
} from 'lucide-react'

const equipmentSlots = [
  {
    id: 'primary',
    number: '1',
    title: 'PRIMARY WEAPON',
    icon: Crosshair,
  },
  {
    id: 'sidearm',
    number: '2',
    title: 'SIDEARM',
    icon: Crosshair,
  },
  {
    id: 'specialist',
    number: '3',
    title: 'SPECIALIST ITEM',
    icon: Package,
  },
  {
    id: 'helmet',
    title: 'HELMET',
    icon: Shield,
  },
  {
    id: 'armor',
    title: 'ARMOUR',
    icon: Shield,
  },
  {
    id: 'vest',
    title: 'TACTICAL VEST',
    icon: Shield,
  },
  {
    id: 'backpack',
    title: 'BACKPACK',
    icon: Backpack,
  },
  {
    id: 'traversal',
    title: 'TRAVERSAL',
    icon: Package,
  },
]

const backpackLayouts = [
  {
    id: 'pouch',
    name: 'Pouch',
    columns: 3,
    rows: 2,
    usableCells: 6,
    slings: 0,
  },
  {
    id: 'scout',
    name: 'Scout Backpack',
    columns: 4,
    rows: 2,
    usableCells: 8,
    slings: 0,
  },
  {
    id: 'field',
    name: 'Field Backpack',
    columns: 6,
    rows: 2,
    usableCells: 12,
    slings: 0,
  },
  {
    id: 'operator',
    name: 'Operator Backpack',
    columns: 5,
    rows: 3,
    usableCells: 15,
    slings: 0,
  },
  {
    id: 'assault',
    name: 'Assault Backpack',
    columns: 5,
    rows: 5,
    usableCells: 21,
    slings: 0,
  },
  {
    id: 'ruck',
    name: 'Ruck Backpack',
    columns: 6,
    rows: 4,
    usableCells: 24,
    slings: 0,
  },
  {
    id: 'gunner',
    name: 'Gunner Backpack + Sling',
    columns: 6,
    rows: 4,
    usableCells: 24,
    slings: 1,
  },
  {
    id: 'arsenal',
    name: 'Arsenal Backpack + 2 Slings',
    columns: 6,
    rows: 4,
    usableCells: 24,
    slings: 2,
  },
]

const vendorTabs = [
  'ALL',
  'WEAPONS',
  'GEAR',
  'ITEMS',
  'AMMO',
  'ATTACHMENTS',
]

function buildDisabledCells(backpack) {

  const total =
    backpack.columns *
    backpack.rows

  const amountToDisable =
    Math.max(
      0,
      total -
        backpack.usableCells,
    )

  const disabled =
    new Set()

  if (
    amountToDisable === 0
  ) {
    return disabled
  }

  const cornerIndexes = [
    0,
    backpack.columns - 1,
    total - backpack.columns,
    total - 1,
  ]

  for (
    let index = 0;
    index < amountToDisable;
    index += 1
  ) {

    if (
      cornerIndexes[index] !==
      undefined
    ) {

      disabled.add(
        cornerIndexes[index],
      )
    }
  }

  return disabled
}

function LoadoutsPage() {

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      'builder',
    )

  const [
    vendorTab,
    setVendorTab,
  ] =
    useState(
      'ALL',
    )

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState(
      'primary',
    )

  const [
    selectedBackpackId,
    setSelectedBackpackId,
  ] =
    useState(
      'assault',
    )

  const [
    loadoutName,
    setLoadoutName,
  ] =
    useState(
      'UNTITLED LOADOUT',
    )

  const selectedBackpack =
    backpackLayouts.find(
      (
        backpack,
      ) =>
        backpack.id ===
        selectedBackpackId,
    ) ||
    backpackLayouts[0]

  const disabledCells =
    useMemo(
      () =>
        buildDisabledCells(
          selectedBackpack,
        ),
      [
        selectedBackpack,
      ],
    )

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#090b0c]">
      <section className="border-b border-white/8 bg-[#0e1011]">
        <div className="mx-auto max-w-[1600px] px-5 py-10 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-[2px] w-8 bg-amber-500" />

                <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
                  WARDOGS LOADOUT PLANNER
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                BUILD YOUR KIT.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-500">
                Build the complete deployment before spending your cash.
                Weapons, gear, attachments, ammunition and backpack space
                will all live here.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-11 items-center gap-2 border border-white/10 px-4 text-[10px] font-black tracking-wider text-stone-400"
              >
                <Share2 size={15} />
                SHARE
              </button>

              <button
                type="button"
                className="flex h-11 items-center gap-2 bg-amber-500 px-5 text-[10px] font-black tracking-wider text-black"
              >
                <Save size={15} />
                SAVE LOADOUT
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0b0d0e]">
        <div className="mx-auto flex max-w-[1600px] gap-8 px-5 lg:px-8">
          {[
            [
              'builder',
              'BUILDER',
            ],
            [
              'mine',
              'MY LOADOUTS',
            ],
            [
              'community',
              'COMMUNITY',
            ],
          ].map(
            (
              [
                id,
                label,
              ],
            ) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    id,
                  )
                }
                className={[
                  'relative h-16 text-xs font-black tracking-wider',
                  activeTab ===
                  id
                    ? 'text-white'
                    : 'text-stone-600 hover:text-stone-300',
                ].join(' ')}
              >
                {label}

                {activeTab ===
                  id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
                )}
              </button>
            ),
          )}
        </div>
      </section>

      {activeTab ===
        'builder' ? (
        <section className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">
          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                LOADOUT
              </div>

              <input
                value={loadoutName}
                onChange={(event) =>
                  setLoadoutName(
                    event.target.value,
                  )
                }
                className="mt-2 w-full bg-transparent text-lg font-black text-white outline-none"
              />
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                VALUE
              </div>

              <div className="mt-2 text-xl font-black text-white">
                $0
              </div>
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                WEIGHT
              </div>

              <div className="mt-2 text-xl font-black text-white">
                0.00 KG
              </div>
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                BACKPACK
              </div>

              <div className="mt-2 text-xl font-black text-amber-500">
                {selectedBackpack.usableCells}{' '}
                CELLS
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_440px]">
            <aside className="border border-white/8 bg-[#0e1011]">
              <div className="border-b border-white/8 px-5 py-4">
                <div className="text-xs font-black tracking-[0.18em] text-white">
                  EQUIPMENT SLOTS
                </div>
              </div>

              <div className="space-y-2 p-3">
                {equipmentSlots.map(
                  (
                    slot,
                  ) => {
                    const Icon =
                      slot.icon

                    const isBackpack =
                      slot.id ===
                      'backpack'

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() =>
                          setSelectedSlot(
                            slot.id,
                          )
                        }
                        className={[
                          'flex w-full items-center gap-3 border p-3 text-left transition',
                          selectedSlot ===
                          slot.id
                            ? 'border-amber-500/40 bg-amber-500/[0.05]'
                            : 'border-white/8 bg-[#111416] hover:border-white/15',
                        ].join(' ')}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/8 bg-black/20 text-amber-500">
                          {slot.number ? (
                            <span className="text-sm font-black">
                              {
                                slot.number
                              }
                            </span>
                          ) : (
                            <Icon
                              size={
                                17
                              }
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-[10px] font-black tracking-wider text-stone-400">
                            {
                              slot.title
                            }
                          </div>

                          <div className="mt-1 truncate text-xs font-bold text-white">
                            {isBackpack
                              ? selectedBackpack.name
                              : 'EMPTY'}
                          </div>
                        </div>
                      </button>
                    )
                  },
                )}
              </div>
            </aside>

            <section className="border border-white/8 bg-[#0e1011]">
              <div className="border-b border-white/8 p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex h-11 flex-1 items-center gap-3 border border-white/8 bg-black/20 px-3">
                    <Search
                      size={16}
                      className="text-stone-600"
                    />

                    <input
                      placeholder="Search WARDOGS equipment..."
                      className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone-700"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {vendorTabs.map(
                    (
                      tab,
                    ) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() =>
                          setVendorTab(
                            tab,
                          )
                        }
                        className={[
                          'border px-3 py-2 text-[9px] font-black tracking-wider',
                          vendorTab ===
                          tab
                            ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-400'
                            : 'border-white/8 text-stone-600',
                        ].join(' ')}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
                <div>
                  <Package
                    size={44}
                    strokeWidth={1}
                    className="mx-auto text-stone-700"
                  />

                  <div className="mt-5 text-sm font-black tracking-wider text-white">
                    WARDOGS ITEM DATABASE
                  </div>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-stone-600">
                    The builder engine is ready for weapons,
                    attachments, ammunition, armour, medical,
                    tactical and specialist equipment.
                  </p>

                  <div className="mt-5 text-[10px] font-bold tracking-[0.18em] text-amber-500">
                    REAL ITEM DATA CONNECTS NEXT
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="border border-white/8 bg-[#0e1011]">
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                  <div>
                    <div className="text-xs font-black tracking-[0.18em] text-white">
                      BACKPACK
                    </div>

                    <div className="mt-1 text-[10px] text-stone-600">
                      {
                        selectedBackpack.name
                      }
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-amber-500">
                      {
                        selectedBackpack.usableCells
                      }
                    </div>

                    <div className="text-[8px] font-bold tracking-wider text-stone-600">
                      USABLE CELLS
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div
                    className="mx-auto grid max-w-[380px] gap-1"
                    style={{
                      gridTemplateColumns:
                        `repeat(${selectedBackpack.columns}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({
                      length:
                        selectedBackpack.columns *
                        selectedBackpack.rows,
                    }).map(
                      (
                        _,
                        index,
                      ) => {
                        const disabled =
                          disabledCells.has(
                            index,
                          )

                        return (
                          <div
                            key={index}
                            className={[
                              'aspect-square min-h-12 border transition',
                              disabled
                                ? 'border-transparent bg-transparent'
                                : 'border-white/10 bg-[#15191b] hover:border-amber-500/30 hover:bg-amber-500/[0.03]',
                            ].join(' ')}
                          />
                        )
                      },
                    )}
                  </div>

                  {selectedBackpack.slings >
                    0 && (
                    <div className="mt-5 grid gap-2">
                      {Array.from({
                        length:
                          selectedBackpack.slings,
                      }).map(
                        (
                          _,
                          index,
                        ) => (
                          <div
                            key={index}
                            className="flex h-16 items-center justify-between border border-dashed border-amber-500/25 bg-amber-500/[0.03] px-4"
                          >
                            <div>
                              <div className="text-[9px] font-black tracking-wider text-amber-500">
                                SLING{' '}
                                {index +
                                  1}
                              </div>

                              <div className="mt-1 text-xs text-stone-600">
                                Empty weapon slot
                              </div>
                            </div>

                            <Crosshair
                              size={18}
                              className="text-stone-700"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <div className="text-[9px] font-bold tracking-wider text-stone-600">
                      PACKED 0 /{' '}
                      {
                        selectedBackpack.usableCells
                      }
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-2 text-[9px] font-black tracking-wider text-stone-500"
                    >
                      <RotateCw size={13} />
                      ROTATE ITEM
                    </button>
                  </div>
                </div>
              </section>

              <section className="border border-white/8 bg-[#0e1011]">
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="text-xs font-black tracking-[0.18em] text-white">
                    BACKPACK TYPE
                  </div>
                </div>

                <div className="grid gap-2 p-3">
                  {backpackLayouts.map(
                    (
                      backpack,
                    ) => (
                      <button
                        key={
                          backpack.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedBackpackId(
                            backpack.id,
                          )
                        }
                        className={[
                          'flex items-center justify-between border px-3 py-3 text-left',
                          selectedBackpackId ===
                          backpack.id
                            ? 'border-amber-500/40 bg-amber-500/[0.05]'
                            : 'border-white/8 bg-[#111416]',
                        ].join(' ')}
                      >
                        <div>
                          <div className="text-[10px] font-black text-white">
                            {
                              backpack.name
                            }
                          </div>

                          <div className="mt-1 text-[9px] text-stone-600">
                            {
                              backpack.columns
                            }
                            ×
                            {
                              backpack.rows
                            }{' '}
                            GRID
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-amber-500">
                            {
                              backpack.usableCells
                            }
                          </div>

                          <div className="text-[8px] text-stone-600">
                            CELLS
                          </div>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-[1600px] px-5 py-20 text-center lg:px-8">
          <Package
            size={48}
            strokeWidth={1}
            className="mx-auto text-stone-700"
          />

          <h2 className="mt-5 text-2xl font-black text-white">
            {activeTab ===
            'mine'
              ? 'MY LOADOUTS'
              : 'COMMUNITY LOADOUTS'}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm text-stone-600">
            Saved and shared builds will appear here once
            cloud loadout storage is connected.
          </p>
        </section>
      )}
    </main>
  )
}

export default LoadoutsPage