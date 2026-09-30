import {
  useMemo,
  useState,
} from 'react'

import {
  ChevronLeft,
  Minus,
  Package,
  Plus,
  Search,
  X,
} from 'lucide-react'

import WardogsItemImage from './WardogsItemImage'

const money =
  (value) =>
    `$${Number(value || 0).toLocaleString()}`

const categories = [
  'RECOMMENDED',
  'MEDICAL',
  'LOOSE AMMO',
  'MAGAZINES',
  'GRENADES',
  'TACTICAL',
  'BUILDING',
  'RECON',
  'VEHICLE',
]

function footprintForItem(
  item,
) {

  if (
    item.id ===
    'broadhead-arrow'
  ) {
    return {
      width: 1,
      height: 3,
    }
  }

  if (
    item.id ===
      'explosive-arrow' ||
    item.id ===
      '93mm'
  ) {
    return {
      width: 3,
      height: 1,
    }
  }

  if (
    item.calibre ===
    '.45 Colt'
  ) {
    return {
      width: 1,
      height: 1,
    }
  }

  return {
    width: 2,
    height: 1,
  }
}

function makeInstances(
  ammo,
  packedAmmo,
) {

  const instances = []

  Object.entries(
    packedAmmo,
  ).forEach(
    ([
      itemId,
      amount,
    ]) => {

      const item =
        ammo.find(
          (candidate) =>
            candidate.id ===
            itemId,
        )

      if (!item) {
        return
      }

      for (
        let index = 0;
        index < amount;
        index += 1
      ) {

        instances.push({
          key:
            `${item.id}-${index}`,
          item,
          footprint:
            footprintForItem(
              item,
            ),
        })
      }
    },
  )

  return instances
}

function calculateLayout(
  backpack,
  instances,
) {

  const capacity =
    Number(
      backpack.capacity ||
        0,
    )

  const usedCells =
    instances.reduce(
      (
        total,
        instance,
      ) =>
        total +
        (
          instance
            .footprint
            .width *
          instance
            .footprint
            .height
        ),
      0,
    )

  if (
    backpack
      .exactLayoutPending ||
    !backpack.columns ||
    !backpack.rows
  ) {

    return {
      placements: [],
      fits:
        usedCells <=
        capacity,
      usedCells,
      remaining:
        Math.max(
          0,
          capacity -
            usedCells,
        ),
    }
  }

  const columns =
    backpack.columns

  const rows =
    backpack.rows

  const blocked =
    new Set(
      backpack.blocked ||
        [],
    )

  const occupied =
    new Set(
      blocked,
    )

  const placements =
    []

  for (
    const instance of
    instances
  ) {

    const {
      width,
      height,
    } =
      instance.footprint

    let placement =
      null

    for (
      let row = 0;
      row <=
      rows - height;
      row += 1
    ) {

      for (
        let column = 0;
        column <=
        columns - width;
        column += 1
      ) {

        const cells =
          []

        let valid =
          true

        for (
          let y = 0;
          y < height;
          y += 1
        ) {

          for (
            let x = 0;
            x < width;
            x += 1
          ) {

            const cell =
              (
                row + y
              ) *
                columns +
              (
                column + x
              )

            if (
              occupied.has(
                cell,
              )
            ) {

              valid =
                false

              break
            }

            cells.push(
              cell,
            )
          }

          if (!valid) {
            break
          }
        }

        if (valid) {

          placement = {
            ...instance,
            row,
            column,
            width,
            height,
            cells,
          }

          break
        }
      }

      if (placement) {
        break
      }
    }

    if (!placement) {

      return {
        placements,
        fits: false,
        usedCells,
        remaining:
          Math.max(
            0,
            capacity -
              usedCells,
          ),
      }
    }

    placement
      .cells
      .forEach(
        (cell) =>
          occupied.add(
            cell,
          ),
      )

    placements.push(
      placement,
    )
  }

  return {
    placements,
    fits: true,
    usedCells,
    remaining:
      Math.max(
        0,
        capacity -
          usedCells,
      ),
  }
}

function BackpackPackingView({
  backpack,
  looseAmmo,
  packedAmmo,
  equippedCalibres,
  changeAmmoStacks,
  equipmentValue,
  contentsValue,
  totalValue,
  knownWeight,
  totalRounds,
  onBack,
}) {

  const [
    category,
    setCategory,
  ] =
    useState(
      'RECOMMENDED',
    )

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    calibre,
    setCalibre,
  ] =
    useState('ALL')

  const [
    message,
    setMessage,
  ] =
    useState('')

  const usableAmmo =
    useMemo(
      () =>
        looseAmmo.filter(
          (item) =>
            !item.tracer,
        ),
      [looseAmmo],
    )

  const calibres =
    useMemo(
      () => [
        'ALL',
        ...Array.from(
          new Set(
            usableAmmo.map(
              (item) =>
                item.calibre,
            ),
          ),
        ),
      ],
      [usableAmmo],
    )

  const visibleItems =
    useMemo(
      () => {

        if (
          category !==
            'RECOMMENDED' &&
          category !==
            'LOOSE AMMO'
        ) {
          return []
        }

        const needle =
          query
            .trim()
            .toLowerCase()

        return usableAmmo.filter(
          (item) => {

            const recommended =
              category ===
              'RECOMMENDED'

            const compatible =
              equippedCalibres
                .size === 0 ||
              equippedCalibres
                .has(
                  item.calibre,
                )

            const calibreMatch =
              calibre ===
                'ALL' ||
              item.calibre ===
                calibre

            const searchMatch =
              !needle ||
              item.name
                .toLowerCase()
                .includes(
                  needle,
                ) ||
              item.calibre
                .toLowerCase()
                .includes(
                  needle,
                )

            return (
              (
                !recommended ||
                compatible
              ) &&
              calibreMatch &&
              searchMatch
            )
          },
        )
      },
      [
        category,
        query,
        calibre,
        usableAmmo,
        equippedCalibres,
      ],
    )

  const instances =
    useMemo(
      () =>
        makeInstances(
          usableAmmo,
          packedAmmo,
        ),
      [
        usableAmmo,
        packedAmmo,
      ],
    )

  const layout =
    useMemo(
      () =>
        calculateLayout(
          backpack,
          instances,
        ),
      [
        backpack,
        instances,
      ],
    )

  const tryAddItem =
    (item) => {

      const nextPacked = {
        ...packedAmmo,

        [item.id]:
          (
            packedAmmo[
              item.id
            ] ||
            0
          ) +
          1,
      }

      const nextInstances =
        makeInstances(
          usableAmmo,
          nextPacked,
        )

      const nextLayout =
        calculateLayout(
          backpack,
          nextInstances,
        )

      if (
        !nextLayout.fits
      ) {

        setMessage(
          `${item.name} will not fit in the remaining backpack space.`,
        )

        return
      }

      setMessage('')

      changeAmmoStacks(
        item.id,
        1,
      )
    }

  const removeItem =
    (item) => {

      setMessage('')

      changeAmmoStacks(
        item.id,
        -1,
      )
    }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#090b0c]">

      <section className="border-b border-white/8 bg-[#0e1011]">

        <div className="mx-auto max-w-[1700px] px-5 py-6 lg:px-8">

          <button
            type="button"
            onClick={onBack}
            className="mb-6 flex h-11 items-center gap-3 border border-white/10 bg-[#151819] px-5 text-[10px] font-black tracking-[0.16em] text-white transition hover:border-amber-500/40 hover:text-amber-400"
          >
            <ChevronLeft
              size={17}
            />

            BACK TO OPERATOR
          </button>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

            <div>

              <div className="text-[10px] font-black tracking-[0.28em] text-amber-500">
                BACKPACK LOADOUT
              </div>

              <h1 className="mt-2 text-4xl font-black text-white">
                PACK YOUR LOADOUT.
              </h1>

              <p className="mt-3 text-sm text-stone-500">
                Items now consume their actual inventory footprint.
              </p>

            </div>

            <div className="flex gap-3">

              <div className="border border-white/8 bg-[#111416] px-5 py-3 text-right">

                <div className="text-[8px] font-black tracking-wider text-stone-600">
                  CAPACITY
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  {layout.usedCells}
                  <span className="text-stone-600">
                    /
                    {backpack.capacity}
                  </span>
                </div>

              </div>

              <div className="border border-amber-500/20 bg-amber-500/[0.04] px-5 py-3 text-right">

                <div className="text-[8px] font-black tracking-wider text-amber-600">
                  SLOTS LEFT
                </div>

                <div className="mt-1 text-xl font-black text-amber-400">
                  {layout.remaining}
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="mx-auto grid max-w-[1700px] gap-5 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_570px] lg:px-8">

        <section className="border border-white/8 bg-[#0e1011]">

          <div className="border-b border-white/8 p-4">

            <div className="flex flex-wrap gap-2">

              {categories.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {

                      setCategory(
                        item,
                      )

                      setCalibre(
                        'ALL',
                      )

                      setQuery(
                        '',
                      )

                      setMessage(
                        '',
                      )
                    }}
                    className={[
                      'border px-3 py-2 text-[8px] font-black tracking-wider',
                      category ===
                      item
                        ? 'border-amber-500/45 bg-amber-500/[0.08] text-amber-400'
                        : 'border-white/8 text-stone-600',
                    ].join(' ')}
                  >
                    {item}
                  </button>
                ),
              )}

            </div>

            <div className="mt-4 flex h-11 items-center gap-3 border border-white/8 bg-black/20 px-3">

              <Search
                size={15}
                className="text-stone-600"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Search backpack items..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone-700"
              />

              {query && (
                <button
                  type="button"
                  onClick={() =>
                    setQuery('')
                  }
                >
                  <X
                    size={14}
                    className="text-stone-600"
                  />
                </button>
              )}

            </div>

          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">

            {(
              category ===
                'RECOMMENDED' ||
              category ===
                'LOOSE AMMO'
            ) ? (
              <>

                <div className="mb-4 flex flex-wrap gap-2">

                  {calibres.map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setCalibre(
                            item,
                          )
                        }
                        className={[
                          'border px-3 py-2 text-[8px] font-black',
                          calibre ===
                          item
                            ? 'border-amber-500/40 text-amber-400'
                            : 'border-white/8 text-stone-600',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                    ),
                  )}

                </div>

                <div className="grid gap-3 2xl:grid-cols-3">

                  {visibleItems.map(
                    (item) => {

                      const footprint =
                        footprintForItem(
                          item,
                        )

                      const amount =
                        packedAmmo[
                          item.id
                        ] ||
                        0

                      return (
                        <article
                          key={item.id}
                          className="border border-white/8 bg-[#111416]"
                        >

                          <WardogsItemImage
                            item={item}
                            className="h-36 w-full border-b border-white/8"
                            imageClassName="p-4"
                          />

                          <div className="p-4">

                            <div className="flex justify-between gap-4">

                              <div>

                                <div className="text-xs font-black text-white">
                                  {item.name}
                                </div>

                                <div className="mt-1 text-[9px] text-stone-600">
                                  {item.calibre}
                                </div>

                              </div>

                              <div className="text-sm font-black text-amber-500">
                                {money(
                                  item.price,
                                )}
                              </div>

                            </div>

                            <div className="mt-4 grid grid-cols-3 border-y border-white/8 py-3 text-center">

                              <div>

                                <div className="text-[8px] text-stone-600">
                                  SIZE
                                </div>

                                <div className="mt-1 text-xs font-black text-white">
                                  {footprint.width}
                                  ×
                                  {footprint.height}
                                </div>

                              </div>

                              <div>

                                <div className="text-[8px] text-stone-600">
                                  CELLS
                                </div>

                                <div className="mt-1 text-xs font-black text-white">
                                  {
                                    footprint.width *
                                    footprint.height
                                  }
                                </div>

                              </div>

                              <div>

                                <div className="text-[8px] text-stone-600">
                                  STACK
                                </div>

                                <div className="mt-1 text-xs font-black text-white">
                                  {item.stack}
                                </div>

                              </div>

                            </div>

                            <div className="mt-3 flex items-center justify-between">

                              <span className="text-[9px] font-black text-stone-500">
                                {amount > 0
                                  ? `${amount} PACKED`
                                  : 'NOT PACKED'}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  tryAddItem(
                                    item,
                                  )
                                }
                                className="flex h-9 items-center gap-2 bg-amber-500 px-3 text-[8px] font-black tracking-wider text-black"
                              >
                                <Plus size={13} />

                                ADD TO BAG
                              </button>

                            </div>

                          </div>

                        </article>
                      )
                    },
                  )}

                </div>

              </>
            ) : (

              <div className="flex min-h-[470px] items-center justify-center text-center">

                <div>

                  <Package
                    size={45}
                    strokeWidth={1}
                    className="mx-auto text-stone-700"
                  />

                  <div className="mt-4 text-lg font-black text-white">
                    {category}
                  </div>

                  <div className="mt-2 text-xs text-stone-600">
                    This category gets its verified item dataset next.
                  </div>

                </div>

              </div>

            )}

          </div>

        </section>

        <aside className="space-y-4">

          <section className="border border-white/8 bg-[#0e1011]">

            <div className="flex items-center justify-between border-b border-white/8 bg-[#171a1b] px-5 py-3">

              <div>

                <div className="text-xs font-black tracking-[0.15em] text-white">
                  BACKPACK
                </div>

                <div className="mt-1 text-[9px] text-stone-500">
                  {backpack.name}
                </div>

              </div>

              <div className="text-right">

                <div className="text-[9px] font-black text-stone-500">
                  CAP.
                </div>

                <div className="text-lg font-black text-white">
                  {layout.usedCells}
                  /
                  {backpack.capacity}
                </div>

              </div>

            </div>

            <div className="relative min-h-[590px] p-6">

              <WardogsItemImage
                item={backpack}
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                imageClassName="p-12"
              />

              <div className="relative z-10">

                {backpack.exactLayoutPending ? (

                  <div className="mx-auto border border-white/10 bg-black/50 p-6">

                    <div className="text-center">

                      <div className="text-3xl font-black text-white">
                        {layout.usedCells}
                        /
                        {backpack.capacity}
                      </div>

                      <div className="mt-2 text-[9px] font-black tracking-wider text-stone-500">
                        CELLS USED
                      </div>

                    </div>

                    <div className="mt-6 space-y-2">

                      {instances.map(
                        (instance) => (
                          <div
                            key={instance.key}
                            className="flex items-center gap-3 border border-white/8 bg-[#111416] p-2"
                          >

                            <WardogsItemImage
                              item={instance.item}
                              className="h-14 w-20 shrink-0"
                              imageClassName="p-1"
                            />

                            <div className="min-w-0 flex-1">

                              <div className="truncate text-[10px] font-black text-white">
                                {instance.item.name}
                              </div>

                              <div className="mt-1 text-[8px] text-stone-600">
                                {instance.footprint.width}
                                ×
                                {instance.footprint.height}
                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  instance.item,
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center border border-red-500/20 text-red-400"
                            >
                              <Minus size={12} />
                            </button>

                          </div>
                        ),
                      )}

                    </div>

                  </div>

                ) : (

                  <div
                    className="relative mx-auto grid max-w-[430px] gap-1 border border-white/10 bg-black/55 p-3"
                    style={{
                      gridTemplateColumns:
                        `repeat(${backpack.columns}, minmax(0, 1fr))`,
                    }}
                  >

                    {Array.from({
                      length:
                        backpack.columns *
                        backpack.rows,
                    }).map(
                      (
                        _,
                        index,
                      ) => {

                        const blocked =
                          (
                            backpack.blocked ||
                            []
                          ).includes(
                            index,
                          )

                        return (
                          <div
                            key={`cell-${index}`}
                            className={[
                              'aspect-square min-h-14 border',
                              blocked
                                ? 'border-transparent bg-transparent'
                                : 'border-white/10 bg-[#121617]/85',
                            ].join(' ')}
                          />
                        )
                      },
                    )}

                    {layout
                      .placements
                      .map(
                        (
                          placement,
                        ) => (
                          <div
                            key={placement.key}
                            style={{
                              gridColumn:
                                `${placement.column + 1} / span ${placement.width}`,

                              gridRow:
                                `${placement.row + 1} / span ${placement.height}`,
                            }}
                            className="relative z-20 flex min-h-0 overflow-hidden border border-amber-500/45 bg-[#171b1d]"
                          >

                            <WardogsItemImage
                              item={
                                placement.item
                              }
                              className="absolute inset-0"
                              imageClassName="p-1"
                            />

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/75 px-1 py-1">

                              <div className="truncate text-[7px] font-black text-white">
                                {
                                  placement
                                    .item
                                    .name
                                }
                              </div>

                            </div>

                            <div className="absolute left-1 top-1 bg-emerald-500 px-1 py-0.5 text-[7px] font-black text-black">
                              {money(
                                placement
                                  .item
                                  .price,
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  placement.item,
                                )
                              }
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-red-500 text-black"
                            >
                              <X size={10} />
                            </button>

                          </div>
                        ),
                      )}

                  </div>

                )}

                {message && (

                  <div className="mx-auto mt-4 max-w-[430px] border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-[10px] font-bold text-red-400">
                    {message}
                  </div>

                )}

              </div>

            </div>

          </section>

          <section className="border border-amber-500/20 bg-[#111416] p-5">

            <div className="flex justify-between text-[10px] text-stone-500">

              <span>
                EQUIPMENT
              </span>

              <span className="font-black text-white">
                {money(
                  equipmentValue,
                )}
              </span>

            </div>

            <div className="mt-3 flex justify-between text-[10px] text-stone-500">

              <span>
                BAG CONTENTS
              </span>

              <span className="font-black text-white">
                {money(
                  contentsValue,
                )}
              </span>

            </div>

            <div className="mt-4 border-t border-white/8 pt-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-amber-600">
                TOTAL LOADOUT VALUE
              </div>

              <div className="mt-1 text-3xl font-black text-amber-400">
                {money(
                  totalValue,
                )}
              </div>

              <div className="mt-4 flex justify-between">

                <div>

                  <div className="text-[8px] font-black text-stone-600">
                    KNOWN WEIGHT
                  </div>

                  <div className="mt-1 text-sm font-black text-white">
                    {knownWeight.toFixed(
                      2,
                    )}{' '}
                    KG
                  </div>

                </div>

                <div className="text-right">

                  <div className="text-[8px] font-black text-stone-600">
                    LOOSE ROUNDS
                  </div>

                  <div className="mt-1 text-sm font-black text-emerald-400">
                    {totalRounds}
                  </div>

                </div>

              </div>

            </div>

          </section>

        </aside>

      </section>

    </main>
  )
}

export default BackpackPackingView