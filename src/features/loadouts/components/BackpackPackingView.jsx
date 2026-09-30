import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ChevronDown,
  ChevronLeft,
  Minus,
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

function getFootprint(
  item,
) {

  if (
    Number.isFinite(
      item?.inventoryWidth,
    ) &&
    Number.isFinite(
      item?.inventoryHeight,
    )
  ) {

    return {
      width:
        item.inventoryWidth,

      height:
        item.inventoryHeight,
    }
  }

  if (
    Number.isFinite(
      item?.width,
    ) &&
    Number.isFinite(
      item?.height,
    )
  ) {

    return {
      width:
        item.width,

      height:
        item.height,
    }
  }

  if (
    item?.id ===
    'broadhead-arrow'
  ) {

    return {
      width: 1,
      height: 3,
    }
  }

  if (
    item?.id ===
      'explosive-arrow' ||
    item?.id ===
      '93mm'
  ) {

    return {
      width: 3,
      height: 1,
    }
  }

  if (
    item?.calibre ===
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
  items,
  packed,
) {

  const instances = []

  Object.entries(
    packed,
  ).forEach(
    ([
      itemId,
      quantity,
    ]) => {

      const item =
        items.find(
          (candidate) =>
            candidate.id ===
            itemId,
        )

      if (!item) {
        return
      }

      for (
        let index = 0;
        index < quantity;
        index += 1
      ) {

        instances.push({
          key:
            `${item.id}-${index}`,

          item,

          footprint:
            getFootprint(
              item,
            ),
        })
      }
    },
  )

  return instances
}

function cellsForPlacement({
  row,
  column,
  width,
  height,
  columns,
}) {

  const cells = []

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

      cells.push(
        (
          row + y
        ) *
          columns +
        column +
        x,
      )
    }
  }

  return cells
}

function canPlace({
  backpack,
  row,
  column,
  width,
  height,
  occupied,
}) {

  if (
    row < 0 ||
    column < 0 ||
    row + height >
      backpack.rows ||
    column + width >
      backpack.columns
  ) {

    return false
  }

  const blocked =
    new Set(
      backpack.blocked ||
        [],
    )

  return cellsForPlacement({
    row,
    column,
    width,
    height,
    columns:
      backpack.columns,
  }).every(
    (cell) =>
      !blocked.has(
        cell,
      ) &&
      !occupied.has(
        cell,
      ),
  )
}

function buildLayout(
  backpack,
  instances,
  positions,
) {

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
    backpack.exactLayoutPending ||
    !backpack.columns ||
    !backpack.rows
  ) {

    return {
      placements: [],
      fits:
        usedCells <=
        backpack.capacity,
      usedCells,
      remaining:
        Math.max(
          0,
          backpack.capacity -
            usedCells,
        ),
    }
  }

  const occupied =
    new Set()

  const placements =
    []

  const unresolved =
    []

  instances.forEach(
    (instance) => {

      const preferred =
        positions[
          instance.key
        ]

      if (!preferred) {

        unresolved.push(
          instance,
        )

        return
      }

      const valid =
        canPlace({
          backpack,
          row:
            preferred.row,
          column:
            preferred.column,
          width:
            instance
              .footprint
              .width,
          height:
            instance
              .footprint
              .height,
          occupied,
        })

      if (!valid) {

        unresolved.push(
          instance,
        )

        return
      }

      const cells =
        cellsForPlacement({
          row:
            preferred.row,
          column:
            preferred.column,
          width:
            instance
              .footprint
              .width,
          height:
            instance
              .footprint
              .height,
          columns:
            backpack.columns,
        })

      cells.forEach(
        (cell) =>
          occupied.add(
            cell,
          ),
      )

      placements.push({
        ...instance,
        ...preferred,
        width:
          instance
            .footprint
            .width,
        height:
          instance
            .footprint
            .height,
        cells,
      })
    },
  )

  unresolved.forEach(
    (instance) => {

      if (
        placements.length >
        instances.length
      ) {
        return
      }

      let found =
        null

      for (
        let row = 0;
        row <
        backpack.rows;
        row += 1
      ) {

        for (
          let column = 0;
          column <
          backpack.columns;
          column += 1
        ) {

          const valid =
            canPlace({
              backpack,
              row,
              column,
              width:
                instance
                  .footprint
                  .width,
              height:
                instance
                  .footprint
                  .height,
              occupied,
            })

          if (!valid) {
            continue
          }

          const cells =
            cellsForPlacement({
              row,
              column,
              width:
                instance
                  .footprint
                  .width,
              height:
                instance
                  .footprint
                  .height,
              columns:
                backpack.columns,
            })

          found = {
            ...instance,
            row,
            column,
            width:
              instance
                .footprint
                .width,
            height:
              instance
                .footprint
                .height,
            cells,
          }

          break
        }

        if (found) {
          break
        }
      }

      if (!found) {
        return
      }

      found.cells.forEach(
        (cell) =>
          occupied.add(
            cell,
          ),
      )

      placements.push(
        found,
      )
    },
  )

  return {
    placements,

    fits:
      placements.length ===
      instances.length,

    usedCells,

    remaining:
      Math.max(
        0,
        backpack.capacity -
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
    calibre,
    setCalibre,
  ] =
    useState(null)

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    positions,
    setPositions,
  ] =
    useState({})

  const [
    draggingKey,
    setDraggingKey,
  ] =
    useState(null)

  const [
    error,
    setError,
  ] =
    useState('')

  const instances =
    useMemo(
      () =>
        makeInstances(
          looseAmmo,
          packedAmmo,
        ),
      [
        looseAmmo,
        packedAmmo,
      ],
    )

  useEffect(
    () => {

      const valid =
        new Set(
          instances.map(
            (item) =>
              item.key,
          ),
        )

      setPositions(
        (current) => {

          const next = {}

          Object.entries(
            current,
          ).forEach(
            ([
              key,
              value,
            ]) => {

              if (
                valid.has(
                  key,
                )
              ) {

                next[key] =
                  value
              }
            },
          )

          return next
        },
      )
    },
    [instances],
  )

  const layout =
    useMemo(
      () =>
        buildLayout(
          backpack,
          instances,
          positions,
        ),
      [
        backpack,
        instances,
        positions,
      ],
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

            const calibreMatch =
              !calibre ||
              item.calibre ===
                calibre

            return (
              (
                !recommended ||
                compatible
              ) &&
              searchMatch &&
              calibreMatch
            )
          },
        )
      },
      [
        looseAmmo,
        category,
        calibre,
        query,
        equippedCalibres,
      ],
    )

  const groupedAmmo =
    useMemo(
      () => {

        const groups = {}

        looseAmmo.forEach(
          (item) => {

            if (
              !groups[
                item.calibre
              ]
            ) {

              groups[
                item.calibre
              ] = []
            }

            groups[
              item.calibre
            ].push(
              item,
            )
          },
        )

        return groups
      },
      [looseAmmo],
    )

  const tryAdd =
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
          looseAmmo,
          nextPacked,
        )

      const test =
        buildLayout(
          backpack,
          nextInstances,
          positions,
        )

      if (!test.fits) {

        setError(
          `${item.name} will not fit.`,
        )

        return
      }

      setError('')

      changeAmmoStacks(
        item.id,
        1,
      )
    }

  const removeInstance =
    (placement) => {

      setPositions(
        (current) => {

          const next = {
            ...current,
          }

          delete next[
            placement.key
          ]

          return next
        },
      )

      changeAmmoStacks(
        placement
          .item
          .id,
        -1,
      )

      setError('')
    }

  const moveInstance =
    (
      key,
      row,
      column,
    ) => {

      const moving =
        layout
          .placements
          .find(
            (item) =>
              item.key ===
              key,
          )

      if (!moving) {
        return
      }

      const occupied =
        new Set()

      layout
        .placements
        .filter(
          (item) =>
            item.key !== key,
        )
        .forEach(
          (item) =>
            item.cells.forEach(
              (cell) =>
                occupied.add(
                  cell,
                ),
            ),
        )

      const valid =
        canPlace({
          backpack,
          row,
          column,
          width:
            moving.width,
          height:
            moving.height,
          occupied,
        })

      if (!valid) {

        setError(
          'That space is blocked or already occupied.',
        )

        return
      }

      setPositions(
        (current) => ({
          ...current,

          [key]: {
            row,
            column,
          },
        }),
      )

      setError('')
    }

  const realCategory =
    category ===
      'RECOMMENDED' ||
    category ===
      'LOOSE AMMO'

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#090b0c]">

      <div className="mx-auto max-w-[1680px] px-5 py-6 lg:px-8">

        <div className="mb-5 flex items-center justify-between">

          <button
            type="button"
            onClick={onBack}
            className="flex h-11 items-center gap-2 border border-white/10 bg-[#121516] px-5 text-[9px] font-black tracking-[0.15em] text-white hover:border-amber-500/40 hover:text-amber-400"
          >
            <ChevronLeft size={16} />

            BACK TO OPERATOR
          </button>

          <div className="text-right">

            <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
              BACKPACK CAPACITY
            </div>

            <div className="mt-1 text-xl font-black text-white">
              {layout.usedCells}
              <span className="text-stone-600">
                {' / '}
                {backpack.capacity}
              </span>
            </div>

          </div>

        </div>

        <div className="grid gap-5 xl:grid-cols-[330px_minmax(520px,1fr)_280px]">

          <aside className="border border-white/8 bg-[#0e1011]">

            <div className="border-b border-white/8 p-4">

              <div className="text-xs font-black tracking-[0.16em] text-white">
                ADD ITEMS
              </div>

              <div className="mt-1 text-[8px] tracking-wider text-stone-600">
                CHOOSE A CATEGORY
              </div>

              <div className="mt-4 flex h-10 items-center gap-2 border border-white/8 bg-black/20 px-3">

                <Search
                  size={14}
                  className="text-stone-600"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-stone-700"
                  placeholder="Search items..."
                />

              </div>

            </div>

            <div className="max-h-[720px] overflow-y-auto p-2">

              {categories.map(
                (entry) => {

                  const open =
                    category ===
                    entry

                  return (
                    <div
                      key={entry}
                      className="mb-2 border border-white/8 bg-[#111416]"
                    >

                      <button
                        type="button"
                        onClick={() => {

                          setCategory(
                            open
                              ? null
                              : entry,
                          )

                          setCalibre(
                            null,
                          )
                        }}
                        className="flex w-full items-center justify-between px-4 py-3"
                      >

                        <span className={[
                          'text-[9px] font-black tracking-[0.12em]',
                          open
                            ? 'text-amber-400'
                            : 'text-stone-500',
                        ].join(' ')}>
                          {entry}
                        </span>

                        <ChevronDown
                          size={13}
                          className={[
                            'transition',
                            open
                              ? 'rotate-180 text-amber-500'
                              : 'text-stone-700',
                          ].join(' ')}
                        />

                      </button>

                      {open && (

                        <div className="border-t border-white/8 p-2">

                          {realCategory ? (

                            <div className="space-y-2">

                              {Object.keys(
                                groupedAmmo,
                              ).map(
                                (
                                  calibreName,
                                ) => {

                                  const items =
                                    visibleAmmo.filter(
                                      (item) =>
                                        item.calibre ===
                                        calibreName,
                                    )

                                  if (
                                    items.length ===
                                    0
                                  ) {
                                    return null
                                  }

                                  const calibreOpen =
                                    calibre ===
                                    calibreName

                                  return (
                                    <div
                                      key={
                                        calibreName
                                      }
                                      className="border border-white/8 bg-black/20"
                                    >

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCalibre(
                                            calibreOpen
                                              ? null
                                              : calibreName,
                                          )
                                        }
                                        className="flex w-full items-center justify-between px-3 py-2"
                                      >

                                        <span className="text-[9px] font-black text-white">
                                          {
                                            calibreName
                                          }
                                        </span>

                                        <span className="text-[8px] text-stone-600">
                                          {
                                            items.length
                                          }
                                        </span>

                                      </button>

                                      {calibreOpen && (

                                        <div className="space-y-1 border-t border-white/8 p-2">

                                          {items.map(
                                            (item) => {

                                              const footprint =
                                                getFootprint(
                                                  item,
                                                )

                                              return (
                                                <div
                                                  key={
                                                    item.id
                                                  }
                                                  className="flex items-center gap-2 border border-white/8 bg-[#121617] p-2"
                                                >

                                                  <WardogsItemImage
                                                    item={
                                                      item
                                                    }
                                                    className="h-12 w-16 shrink-0"
                                                    imageClassName="p-1"
                                                  />

                                                  <div className="min-w-0 flex-1">

                                                    <div className="truncate text-[8px] font-black text-white">
                                                      {
                                                        item.name
                                                      }
                                                    </div>

                                                    <div className="mt-1 text-[7px] text-stone-600">
                                                      {
                                                        footprint.width
                                                      }
                                                      ×
                                                      {
                                                        footprint.height
                                                      }
                                                      {' • '}
                                                      {
                                                        money(
                                                          item.price,
                                                        )
                                                      }
                                                    </div>

                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      tryAdd(
                                                        item,
                                                      )
                                                    }
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center bg-amber-500 text-black"
                                                  >
                                                    <Plus size={12} />
                                                  </button>

                                                </div>
                                              )
                                            },
                                          )}

                                        </div>

                                      )}

                                    </div>
                                  )
                                },
                              )}

                            </div>

                          ) : (

                            <div className="p-4 text-center text-[8px] leading-4 text-stone-700">
                              Verified {entry.toLowerCase()} items are being added to the catalogue.
                            </div>

                          )}

                        </div>

                      )}

                    </div>
                  )
                },
              )}

            </div>

          </aside>

          <section className="flex min-h-[720px] flex-col items-center border border-white/8 bg-[#0e1011] p-6">

            <div className="flex w-full items-start justify-center gap-5">

              <WardogsItemImage
                item={backpack}
                className="h-24 w-28"
                imageClassName="p-1"
              />

              <div>

                <div className="text-[8px] font-black tracking-[0.2em] text-stone-600">
                  EQUIPPED BACKPACK
                </div>

                <div className="mt-1 text-2xl font-black text-white">
                  {backpack.name}
                </div>

                <div className="mt-1 text-sm font-black text-amber-500">
                  {money(
                    backpack.price,
                  )}
                </div>

              </div>

            </div>

            {!backpack.exactLayoutPending ? (

              <div className="mt-8 flex flex-1 items-start justify-center">

                <div
                  className="relative grid gap-[4px] border border-white/10 bg-black/60 p-3"
                  style={{
                    gridTemplateColumns:
                      `repeat(${backpack.columns}, 74px)`,

                    gridTemplateRows:
                      `repeat(${backpack.rows}, 74px)`,
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

                      const row =
                        Math.floor(
                          index /
                          backpack.columns,
                        )

                      const column =
                        index %
                        backpack.columns

                      const blocked =
                        (
                          backpack.blocked ||
                          []
                        ).includes(
                          index,
                        )

                      return (
                        <div
                          key={
                            `cell-${index}`
                          }
                          onDragOver={(event) => {

                            if (
                              !blocked
                            ) {

                              event.preventDefault()
                            }
                          }}
                          onDrop={(event) => {

                            event.preventDefault()

                            if (
                              blocked ||
                              !draggingKey
                            ) {
                              return
                            }

                            moveInstance(
                              draggingKey,
                              row,
                              column,
                            )

                            setDraggingKey(
                              null,
                            )
                          }}
                          className={[
                            'h-[74px] w-[74px] border',
                            blocked
                              ? 'border-transparent bg-transparent'
                              : draggingKey
                                ? 'border-amber-500/25 bg-amber-500/[0.03]'
                                : 'border-white/10 bg-[#15191b]',
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
                          key={
                            placement.key
                          }
                          title={
                            placement
                              .item
                              .name
                          }
                          draggable
                          onDragStart={() => {

                            setDraggingKey(
                              placement.key,
                            )

                            setError('')
                          }}
                          onDragEnd={() =>
                            setDraggingKey(
                              null,
                            )
                          }
                          style={{
                            gridColumn:
                              `${placement.column + 1} / span ${placement.width}`,

                            gridRow:
                              `${placement.row + 1} / span ${placement.height}`,

                            width:
                              `${placement.width * 74 + (placement.width - 1) * 4}px`,

                            height:
                              `${placement.height * 74 + (placement.height - 1) * 4}px`,
                          }}
                          className={[
                            'relative z-20 cursor-grab overflow-hidden border bg-[#111416] active:cursor-grabbing',
                            draggingKey ===
                            placement.key
                              ? 'border-amber-300 opacity-60'
                              : 'border-amber-500/50',
                          ].join(' ')}
                        >

                          <WardogsItemImage
                            item={
                              placement.item
                            }
                            className="absolute inset-[5px]"
                            imageClassName="p-1"
                          />

                          <div className="pointer-events-none absolute left-1 top-1 bg-emerald-400 px-1.5 py-0.5 text-[7px] font-black text-black">
                            {money(
                              placement
                                .item
                                .price,
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeInstance(
                                placement,
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

              </div>

            ) : (

              <div className="mt-8 flex flex-1 items-center justify-center">

                <div className="text-center">

                  <div className="text-4xl font-black text-white">
                    {layout.usedCells}
                    /
                    {backpack.capacity}
                  </div>

                  <div className="mt-2 text-[9px] text-stone-600">
                    CELLS USED
                  </div>

                </div>

              </div>

            )}

            {error && (

              <div className="mt-4 border border-red-500/25 bg-red-500/[0.05] px-4 py-3 text-[9px] font-bold text-red-400">
                {error}
              </div>

            )}

            <div className="mt-4 text-[8px] font-bold tracking-[0.16em] text-stone-700">
              DRAG ITEMS TO ANY VALID POSITION
            </div>

          </section>

          <aside className="h-fit border border-amber-500/20 bg-[#111416] p-5">

            <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
              LOADOUT SUMMARY
            </div>

            <div className="mt-5 flex justify-between text-[9px] text-stone-500">

              <span>
                EQUIPMENT
              </span>

              <span className="font-black text-white">
                {money(
                  equipmentValue,
                )}
              </span>

            </div>

            <div className="mt-3 flex justify-between text-[9px] text-stone-500">

              <span>
                BAG CONTENTS
              </span>

              <span className="font-black text-white">
                {money(
                  contentsValue,
                )}
              </span>

            </div>

            <div className="mt-5 border-t border-white/8 pt-5">

              <div className="text-[8px] font-black tracking-[0.18em] text-amber-600">
                TOTAL VALUE
              </div>

              <div className="mt-1 text-3xl font-black text-amber-400">
                {money(
                  totalValue,
                )}
              </div>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">

              <div className="border border-white/8 bg-black/20 p-3">

                <div className="text-[7px] font-black text-stone-600">
                  WEIGHT
                </div>

                <div className="mt-1 text-sm font-black text-white">
                  {knownWeight.toFixed(
                    2,
                  )}{' '}
                  KG
                </div>

              </div>

              <div className="border border-white/8 bg-black/20 p-3">

                <div className="text-[7px] font-black text-stone-600">
                  ROUNDS
                </div>

                <div className="mt-1 text-sm font-black text-emerald-400">
                  {totalRounds}
                </div>

              </div>

            </div>

            <div className="mt-5 border-t border-white/8 pt-4">

              <div className="flex justify-between text-[9px] text-stone-600">

                <span>
                  USED
                </span>

                <span className="font-black text-white">
                  {layout.usedCells}
                </span>

              </div>

              <div className="mt-2 flex justify-between text-[9px] text-stone-600">

                <span>
                  FREE
                </span>

                <span className="font-black text-amber-400">
                  {layout.remaining}
                </span>

              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  )
}

export default BackpackPackingView