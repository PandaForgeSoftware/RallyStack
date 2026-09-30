import {
  useMemo,
  useState,
} from 'react'

import {
  Backpack,
  Crosshair,
  Minus,
  Package,
  Plus,
  Search,
  Shield,
  ShoppingCart,
} from 'lucide-react'

import {
  backpacks,
  dataVersion,
  looseAmmo,
  weapons,
} from '../data/wardogsLoadoutData'

const money = (value) =>
  `$${Number(value || 0).toLocaleString()}`

const equipmentSlots = [
  {
    id: 'primary',
    title: 'PRIMARY WEAPON',
    icon: Crosshair,
  },
  {
    id: 'sidearm',
    title: 'SIDEARM',
    icon: Crosshair,
  },
  {
    id: 'specialist',
    title: 'SPECIALIST',
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
]

const catalogueTabs = [
  'ALL',
  'WEAPONS',
  'LOOSE AMMO',
  'MAGAZINES',
  'ATTACHMENTS',
  'GEAR',
]

function LoadoutsPage() {

  const [
    activeTab,
    setActiveTab,
  ] = useState('builder')

  const [
    catalogueTab,
    setCatalogueTab,
  ] = useState('ALL')

  const [
    query,
    setQuery,
  ] = useState('')

  const [
    equipped,
    setEquipped,
  ] = useState({
    primary: null,
    sidearm: null,
    specialist: null,
  })

  const [
    selectedBackpackId,
    setSelectedBackpackId,
  ] = useState('assault')

  const [
    packedAmmo,
    setPackedAmmo,
  ] = useState({})

  const [
    selectedItem,
    setSelectedItem,
  ] = useState(null)

  const selectedBackpack =
    backpacks.find(
      (item) =>
        item.id ===
        selectedBackpackId,
    ) ||
    backpacks[0]

  const equippedWeapons =
    Object.values(equipped)
      .filter(Boolean)

  const equippedCalibres =
    useMemo(
      () =>
        new Set(
          equippedWeapons.map(
            (item) =>
              item.calibre,
          ),
        ),
      [equipped],
    )

  const visibleWeapons =
    useMemo(
      () => {
        const needle =
          query
            .trim()
            .toLowerCase()

        return weapons.filter(
          (item) =>
            !needle ||
            item.name
              .toLowerCase()
              .includes(needle) ||
            item.category
              .toLowerCase()
              .includes(needle) ||
            item.calibre
              .toLowerCase()
              .includes(needle),
        )
      },
      [query],
    )

  const visibleAmmo =
    useMemo(
      () => {
        const needle =
          query
            .trim()
            .toLowerCase()

        return looseAmmo.filter(
          (item) => {
            const textMatch =
              !needle ||
              item.name
                .toLowerCase()
                .includes(needle) ||
              item.calibre
                .toLowerCase()
                .includes(needle)

            const calibreMatch =
              equippedCalibres.size === 0 ||
              equippedCalibres.has(
                item.calibre,
              )

            return (
              textMatch &&
              calibreMatch
            )
          },
        )
      },
      [
        query,
        equippedCalibres,
      ],
    )

  const ammoRows =
    useMemo(
      () =>
        Object.entries(
          packedAmmo,
        )
          .map(
            ([
              id,
              stacks,
            ]) => {
              const ammo =
                looseAmmo.find(
                  (item) =>
                    item.id === id,
                )

              if (!ammo) {
                return null
              }

              return {
                ...ammo,
                stacks,
                rounds:
                  ammo.stack *
                  stacks,
              }
            },
          )
          .filter(Boolean),
      [packedAmmo],
    )

  const totalCost =
    useMemo(
      () => {
        const weaponCost =
          equippedWeapons.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.price,
            0,
          )

        const ammoCost =
          ammoRows.reduce(
            (
              total,
              item,
            ) =>
              total +
              (
                item.price *
                item.stacks
              ),
            0,
          )

        return (
          weaponCost +
          ammoCost +
          selectedBackpack.price
        )
      },
      [
        equipped,
        ammoRows,
        selectedBackpack,
      ],
    )

  const knownWeight =
    useMemo(
      () =>
        equippedWeapons.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.weight,
          selectedBackpack.weight,
        ),
      [
        equipped,
        selectedBackpack,
      ],
    )

  const totalLooseRounds =
    ammoRows.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.rounds,
      0,
    )

  const equipWeapon =
    (
      item,
    ) => {

      setEquipped(
        (
          current,
        ) => ({
          ...current,
          [item.slot]:
            item,
        }),
      )

      setSelectedItem(
        item,
      )
    }

  const clearSlot =
    (
      slot,
    ) => {

      setEquipped(
        (
          current,
        ) => ({
          ...current,
          [slot]:
            null,
        }),
      )
    }

  const changeAmmoStacks =
    (
      id,
      difference,
    ) => {

      setPackedAmmo(
        (
          current,
        ) => {

          const next =
            Math.max(
              0,
              (
                current[id] ||
                0
              ) +
                difference,
            )

          const updated = {
            ...current,
          }

          if (
            next === 0
          ) {
            delete updated[id]
          }
          else {
            updated[id] =
              next
          }

          return updated
        },
      )
    }

  const showWeapons =
    catalogueTab ===
      'ALL' ||
    catalogueTab ===
      'WEAPONS'

  const showAmmo =
    catalogueTab ===
      'ALL' ||
    catalogueTab ===
      'LOOSE AMMO'

  const waitingCategory =
    [
      'MAGAZINES',
      'ATTACHMENTS',
      'GEAR',
    ].includes(
      catalogueTab,
    )

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#090b0c]">

      <section className="border-b border-white/8 bg-[#0e1011]">
        <div className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">

          <div className="mb-3 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-500" />

            <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
              LIVE WARDOGS DATA
            </span>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h1 className="text-4xl font-black text-white">
                LOADOUT BUILDER
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-stone-500">
                Equip a weapon, add compatible loose ammunition,
                choose your backpack and watch the cost and known
                carried weight update live.
              </p>
            </div>

            <div className="text-right text-[9px] font-bold tracking-wider text-stone-600">
              {dataVersion.label}
              <div className="mt-1">
                {dataVersion.date}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#0b0d0e]">
        <div className="mx-auto flex max-w-[1600px] gap-8 px-5 lg:px-8">

          {[
            ['builder', 'BUILDER'],
            ['mine', 'MY LOADOUTS'],
            ['community', 'COMMUNITY'],
          ].map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveTab(id)
                }
                className={[
                  'relative h-16 text-xs font-black tracking-wider',
                  activeTab === id
                    ? 'text-white'
                    : 'text-stone-600',
                ].join(' ')}
              >
                {label}

                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
                )}
              </button>
            ),
          )}

        </div>
      </section>

      {activeTab !==
      'builder' ? (
        <section className="mx-auto max-w-[1600px] px-5 py-24 text-center lg:px-8">
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

          <p className="mt-3 text-sm text-stone-600">
            Cloud saving and sharing comes after the builder mechanics.
          </p>
        </section>
      ) : (
        <>

          <section className="mx-auto grid max-w-[1600px] gap-3 px-5 py-6 sm:grid-cols-2 xl:grid-cols-4 lg:px-8">

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                LOADOUT VALUE
              </div>

              <div className="mt-2 text-2xl font-black text-white">
                {money(totalCost)}
              </div>
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                KNOWN WEIGHT
              </div>

              <div className="mt-2 text-2xl font-black text-white">
                {knownWeight.toFixed(2)} KG
              </div>

              <div className="mt-1 text-[9px] text-stone-600">
                Weapon + backpack. Loose ammo weight not published in this dataset.
              </div>
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                LOOSE AMMO
              </div>

              <div className="mt-2 text-2xl font-black text-emerald-400">
                {totalLooseRounds}
              </div>

              <div className="mt-1 text-[9px] text-stone-600">
                {ammoRows.length} ammo types
              </div>
            </div>

            <div className="border border-white/8 bg-[#111416] p-4">
              <div className="text-[9px] font-bold tracking-[0.2em] text-stone-600">
                BACKPACK
              </div>

              <div className="mt-2 text-2xl font-black text-amber-500">
                {selectedBackpack.capacity} CELLS
              </div>

              <div className="mt-1 text-[9px] text-stone-600">
                {selectedBackpack.name}
              </div>
            </div>

          </section>

          <section className="mx-auto grid max-w-[1600px] gap-5 px-5 pb-10 xl:grid-cols-[310px_minmax(0,1fr)_430px] lg:px-8">

            <aside className="space-y-5">

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="border-b border-white/8 px-5 py-4">
                  <div className="text-xs font-black tracking-wider text-white">
                    EQUIPPED
                  </div>
                </div>

                <div className="space-y-2 p-3">

                  {equipmentSlots.map(
                    (slot) => {

                      const Icon =
                        slot.icon

                      const weaponItem =
                        equipped[
                          slot.id
                        ]

                      const isBackpack =
                        slot.id ===
                        'backpack'

                      return (
                        <div
                          key={slot.id}
                          className="border border-white/8 bg-[#111416] p-3"
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center border border-white/8 text-amber-500">
                              <Icon size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-black tracking-wider text-stone-600">
                                {slot.title}
                              </div>

                              <div className="mt-1 truncate text-xs font-black text-white">
                                {isBackpack
                                  ? selectedBackpack.name
                                  : weaponItem?.name ||
                                    'EMPTY'}
                              </div>
                            </div>

                            {weaponItem && (
                              <button
                                type="button"
                                onClick={() =>
                                  clearSlot(
                                    slot.id,
                                  )
                                }
                                className="text-[9px] font-black text-red-400"
                              >
                                CLEAR
                              </button>
                            )}

                          </div>

                        </div>
                      )
                    },
                  )}

                </div>
              </section>

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="border-b border-white/8 px-5 py-4">
                  <div className="text-xs font-black tracking-wider text-white">
                    BACKPACK
                  </div>
                </div>

                <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">

                  {backpacks.map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedBackpackId(
                            item.id,
                          )
                        }
                        className={[
                          'w-full border p-3 text-left',
                          selectedBackpackId ===
                          item.id
                            ? 'border-amber-500/40 bg-amber-500/[0.05]'
                            : 'border-white/8 bg-[#111416]',
                        ].join(' ')}
                      >

                        <div className="flex justify-between gap-3">

                          <div>
                            <div className="text-[10px] font-black text-white">
                              {item.name}
                            </div>

                            <div className="mt-1 text-[9px] text-stone-600">
                              {item.capacity} cells
                              {' / '}
                              {item.weight} kg
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-amber-500">
                              {money(item.price)}
                            </div>

                            {item.slings > 0 && (
                              <div className="mt-1 text-[8px] text-stone-600">
                                {item.slings} sling
                                {item.slings > 1
                                  ? 's'
                                  : ''}
                              </div>
                            )}
                          </div>

                        </div>
                      </button>
                    ),
                  )}

                </div>
              </section>

            </aside>

            <section className="border border-white/8 bg-[#0e1011]">

              <div className="border-b border-white/8 p-4">

                <div className="flex h-11 items-center gap-3 border border-white/8 bg-black/20 px-3">

                  <Search
                    size={16}
                    className="text-stone-600"
                  />

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value,
                      )
                    }
                    placeholder="Search weapon, calibre or ammo..."
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone-700"
                  />

                </div>

                <div className="mt-3 flex flex-wrap gap-2">

                  {catalogueTabs.map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() =>
                          setCatalogueTab(
                            tab,
                          )
                        }
                        className={[
                          'border px-3 py-2 text-[9px] font-black tracking-wider',
                          catalogueTab ===
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

              <div className="max-h-[760px] overflow-y-auto p-4">

                {showWeapons && (
                  <div>

                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-[10px] font-black tracking-[0.2em] text-stone-500">
                        WEAPONS
                      </div>

                      <div className="text-[9px] text-stone-700">
                        {visibleWeapons.length} records
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">

                      {visibleWeapons.map(
                        (item) => (
                          <article
                            key={item.id}
                            onClick={() =>
                              setSelectedItem(
                                item,
                              )
                            }
                            className="cursor-pointer border border-white/8 bg-[#111416] p-4 transition hover:border-amber-500/30"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div>
                                <div className="text-sm font-black text-white">
                                  {item.name}
                                </div>

                                <div className="mt-1 text-[9px] font-bold tracking-wider text-amber-500">
                                  {item.category}
                                </div>
                              </div>

                              <div className="text-right text-sm font-black text-white">
                                {money(item.price)}
                              </div>

                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/8 py-3 text-center">

                              <div>
                                <div className="text-[8px] text-stone-600">
                                  DAMAGE
                                </div>
                                <div className="mt-1 text-xs font-black text-white">
                                  {item.damage ??
                                    '—'}
                                </div>
                              </div>

                              <div>
                                <div className="text-[8px] text-stone-600">
                                  RPM
                                </div>
                                <div className="mt-1 text-xs font-black text-white">
                                  {item.rpm ??
                                    '—'}
                                </div>
                              </div>

                              <div>
                                <div className="text-[8px] text-stone-600">
                                  WEIGHT
                                </div>
                                <div className="mt-1 text-xs font-black text-white">
                                  {item.weight}kg
                                </div>
                              </div>

                            </div>

                            <div className="mt-3 flex items-center justify-between">

                              <div className="text-[10px] text-stone-500">
                                {item.calibre}
                              </div>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  equipWeapon(
                                    item,
                                  )
                                }}
                                className="bg-amber-500 px-3 py-2 text-[9px] font-black tracking-wider text-black"
                              >
                                EQUIP
                              </button>

                            </div>

                          </article>
                        ),
                      )}

                    </div>

                  </div>
                )}

                {showAmmo && (
                  <div className={showWeapons ? 'mt-8' : ''}>

                    <div className="mb-3 flex items-center justify-between">

                      <div>
                        <div className="text-[10px] font-black tracking-[0.2em] text-stone-500">
                          LOOSE AMMO
                        </div>

                        <div className="mt-1 text-[9px] text-stone-700">
                          {equippedCalibres.size > 0
                            ? 'Filtered to equipped weapon calibres'
                            : 'Equip a weapon to filter compatible rounds'}
                        </div>
                      </div>

                      <div className="text-[9px] text-stone-700">
                        {visibleAmmo.length} records
                      </div>

                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">

                      {visibleAmmo.map(
                        (item) => {

                          const stacks =
                            packedAmmo[
                              item.id
                            ] ||
                            0

                          return (
                            <article
                              key={item.id}
                              onClick={() =>
                                setSelectedItem(
                                  item,
                                )
                              }
                              className="border border-white/8 bg-[#111416] p-4"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <div>
                                  <div className="text-xs font-black text-white">
                                    {item.name}
                                  </div>

                                  <div className="mt-1 text-[9px] text-stone-600">
                                    STACK {item.stack}
                                  </div>
                                </div>

                                <div className="text-sm font-black text-amber-500">
                                  {money(item.price)}
                                </div>

                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/8 py-3 text-center">

                                <div>
                                  <div className="text-[8px] text-stone-600">
                                    DAMAGE
                                  </div>

                                  <div className="mt-1 text-xs font-black text-white">
                                    {item.damage}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[8px] text-stone-600">
                                    PEN
                                  </div>

                                  <div className="mt-1 text-xs font-black text-white">
                                    {item.penetration}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[8px] text-stone-600">
                                    SPEED
                                  </div>

                                  <div className="mt-1 text-xs font-black text-white">
                                    {item.speed}
                                  </div>
                                </div>

                              </div>

                              <div className="mt-3 flex items-center justify-between">

                                <div className="text-[9px] text-stone-600">
                                  {stacks > 0
                                    ? `${stacks} STACK${stacks > 1 ? 'S' : ''} PACKED`
                                    : 'NOT PACKED'}
                                </div>

                                <div className="flex items-center gap-1">

                                  <button
                                    type="button"
                                    disabled={stacks === 0}
                                    onClick={(event) => {
                                      event.stopPropagation()

                                      changeAmmoStacks(
                                        item.id,
                                        -1,
                                      )
                                    }}
                                    className="flex h-8 w-8 items-center justify-center border border-white/10 text-stone-500 disabled:opacity-30"
                                  >
                                    <Minus size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()

                                      changeAmmoStacks(
                                        item.id,
                                        1,
                                      )
                                    }}
                                    className="flex h-8 items-center gap-2 bg-amber-500 px-3 text-[9px] font-black text-black"
                                  >
                                    <Plus size={13} />
                                    ADD STACK
                                  </button>

                                </div>

                              </div>

                            </article>
                          )
                        },
                      )}

                    </div>

                  </div>
                )}

                {waitingCategory && (
                  <div className="flex min-h-[480px] items-center justify-center text-center">

                    <div>
                      <Package
                        size={42}
                        strokeWidth={1}
                        className="mx-auto text-stone-700"
                      />

                      <div className="mt-4 text-sm font-black text-white">
                        {catalogueTab}
                      </div>

                      <div className="mt-2 text-xs text-stone-600">
                        This category is wired into the UI.
                        The verified item dataset is the next pass.
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </section>

            <aside className="space-y-5">

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

                  <div>
                    <div className="text-xs font-black tracking-wider text-white">
                      BACKPACK
                    </div>

                    <div className="mt-1 text-[9px] text-stone-600">
                      {selectedBackpack.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-amber-500">
                      {selectedBackpack.capacity}
                    </div>

                    <div className="text-[8px] text-stone-600">
                      CELLS
                    </div>
                  </div>

                </div>

                <div className="p-5">

                  {selectedBackpack.exactLayoutPending ? (
                    <div className="flex min-h-[280px] items-center justify-center border border-dashed border-white/10 p-8 text-center">

                      <div>
                        <div className="text-lg font-black text-white">
                          30 CELL CAPACITY
                        </div>

                        <div className="mt-2 text-xs leading-5 text-stone-600">
                          Halftrack uses multiple compartments.
                          We are not inventing a fake rectangular
                          layout before its exact compartment geometry
                          is verified.
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div
                      className="mx-auto grid max-w-[370px] gap-1"
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
                        (_, index) => {

                          const blocked =
                            selectedBackpack.blocked.includes(
                              index,
                            )

                          return (
                            <div
                              key={index}
                              className={[
                                'aspect-square min-h-11 border',
                                blocked
                                  ? 'border-transparent bg-transparent'
                                  : 'border-white/10 bg-[#15191b]',
                              ].join(' ')}
                            />
                          )
                        },
                      )}

                    </div>
                  )}

                  {selectedBackpack.slings > 0 && (
                    <div className="mt-4 space-y-2">

                      {Array.from({
                        length:
                          selectedBackpack.slings,
                      }).map(
                        (_, index) => (
                          <div
                            key={index}
                            className="border border-dashed border-amber-500/25 bg-amber-500/[0.03] p-3"
                          >
                            <div className="text-[9px] font-black text-amber-500">
                              WEAPON SLING {index + 1}
                            </div>
                          </div>
                        ),
                      )}

                    </div>
                  )}

                </div>
              </section>

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
                  <ShoppingCart
                    size={15}
                    className="text-amber-500"
                  />

                  <div className="text-xs font-black tracking-wider text-white">
                    PACKED LOOSE AMMO
                  </div>
                </div>

                <div className="max-h-[300px] space-y-2 overflow-y-auto p-3">

                  {ammoRows.length === 0 ? (
                    <div className="p-5 text-center text-xs text-stone-700">
                      No loose ammunition packed.
                    </div>
                  ) : (
                    ammoRows.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="border border-white/8 bg-[#111416] p-3"
                        >

                          <div className="flex justify-between gap-4">

                            <div>
                              <div className="text-[10px] font-black text-white">
                                {item.name}
                              </div>

                              <div className="mt-1 text-[9px] text-stone-600">
                                {item.stacks} stack
                                {item.stacks > 1
                                  ? 's'
                                  : ''}
                                {' / '}
                                {item.rounds} rounds
                              </div>
                            </div>

                            <div className="text-xs font-black text-amber-500">
                              {money(
                                item.price *
                                item.stacks,
                              )}
                            </div>

                          </div>

                        </div>
                      ),
                    )
                  )}

                </div>
              </section>

              <section className="border border-white/8 bg-[#0e1011] p-5">

                <div className="text-[9px] font-black tracking-wider text-stone-600">
                  SELECTED ITEM
                </div>

                {selectedItem ? (
                  <div className="mt-3">

                    <div className="text-lg font-black text-white">
                      {selectedItem.name}
                    </div>

                    <div className="mt-2 text-xs text-amber-500">
                      {selectedItem.calibre}
                    </div>

                    {'category' in
                    selectedItem && (
                      <div className="mt-1 text-xs text-stone-500">
                        {selectedItem.category}
                      </div>
                    )}

                    {'unlockLevel' in
                    selectedItem && (
                      <div className="mt-4 border-t border-white/8 pt-3 text-[10px] text-stone-500">
                        Unlock level:{' '}
                        {selectedItem.unlockLevel ??
                          'Not recorded'}
                        <br />
                        Unlock fee:{' '}
                        {selectedItem.unlockCost === null
                          ? 'Not recorded'
                          : selectedItem.unlockCost === 0
                            ? 'Free'
                            : money(selectedItem.unlockCost)}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="mt-3 text-xs text-stone-700">
                    Select a weapon or ammo item to inspect it.
                  </div>
                )}

              </section>

            </aside>

          </section>
        </>
      )}

    </main>
  )
}

export default LoadoutsPage