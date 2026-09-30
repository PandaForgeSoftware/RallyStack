import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

function placementCells({
  row,
  column,
  width,
  height,
  columns,
}) {

  const result = []

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

      result.push(
        (
          row + y
        ) *
          columns +
        (
          column + x
        ),
      )
    }
  }

  return result
}

function isPlacementValid({
  backpack,
  row,
  column,
  width,
  height,
  occupied,
}) {

  if (
    !backpack.columns ||
    !backpack.rows
  ) {
    return false
  }

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

  const cells =
    placementCells({
      row,
      column,
      width,
      height,
      columns:
        backpack.columns,
    })

  return cells.every(
    (cell) =>
      !blocked.has(
        cell,
      ) &&
      !occupied.has(
        cell,
      ),
  )
}

function calculatePlacements(
  backpack,
  instances,
  manualPositions,
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

  const occupied =
    new Set()

  const placements =
    []

  const unresolved =
    []

  for (
    const instance of
    instances
  ) {

    const preferred =
      manualPositions[
        instance.key
      ]

    if (!preferred) {

      unresolved.push(
        instance,
      )

      continue
    }

    const valid =
      isPlacementValid({
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

      continue
    }

    const cells =
      placementCells({
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

      cells,
    })
  }

  for (
    const instance of
    unresolved
  ) {

    const width =
      instance
        .footprint
        .width

    const height =
      instance
        .footprint
        .height

    let found =
      null

    for (
      let row = 0;
      row <=
      backpack.rows -
        height;
      row += 1
    ) {

      for (
        let column = 0;
        column <=
        backpack.columns -
          width;
        column += 1
      ) {

        const valid =
          isPlacementValid({
            backpack,
            row,
            column,
            width,
            height,
            occupied,
          })

        if (!valid) {
          continue
        }

        const cells =
          placementCells({
            row,
            column,
            width,
            height,
            columns:
              backpack.columns,
          })

        found = {
          ...instance,
          row,
          column,
          width,
          height,
          cells,
        }

        break
      }

      if (found) {
        break
      }
    }

    if (!found) {

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

    found
      .cells
      .forEach(
        (cell) =>
          occupied.add(
            cell,
          ),
      )

    placements.push(
      found,
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
    openCategory,
    setOpenCategory,
  ] =
    useState(
      'RECOMMENDED',
    )

  const [
    openCalibre,
    setOpenCalibre,
  ] =
    useState(
      null,
    )

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    manualPositions,
    setManualPositions,
  ] =
    useState({})

  const [
    draggingKey,
    setDraggingKey,
  ] =
    useState(null)

  const [
    message,
    setMessage,
  ] =
    useState('')

  const usableAmmo =
    useMemo(
      () =>
        looseAmmo,
      [looseAmmo],
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

  useEffect(
    () => {

      const validKeys =
        new Set(
          instances.map(
            (instance) =>
              instance.key,
          ),
        )

      setManualPositions(
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
                validKeys.has(
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
        calculatePlacements(
          backpack,
          instances,
          manualPositions,
        ),
      [
        backpack,
        instances,
        manualPositions,
      ],
    )

  const ammoGroups =
    useMemo(
      () => {

        const needle =
          query
            .trim()
            .toLowerCase()

        const visible =
          usableAmmo.filter(
            (item) => {

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

              const compatible =
                openCategory !==
                  'RECOMMENDED' ||
                equippedCalibres
                  .size === 0 ||
                equippedCalibres
                  .has(
                    item.calibre,
                  )

              return (
                searchMatch &&
                compatible
              )
            },
          )

        const grouped = {}

        visible.forEach(
          (item) => {

            if (
              !grouped[
                item.calibre
              ]
            ) {

              grouped[
                item.calibre
              ] = []
            }

            grouped[
              item.calibre
            ].push(
              item,
            )
          },
        )

        return grouped
      },
      [
        usableAmmo,
        query,
        openCategory,
        equippedCalibres,
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
        calculatePlacements(
          backpack,
          nextInstances,
          manualPositions,
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
    (
      instance,
    ) => {

      setMessage('')

      setManualPositions(
        (current) => {

          const next = {
            ...current,
          }

          delete next[
            instance.key
          ]

          return next
        },
      )

      changeAmmoStacks(
        instance
          .item
          .id,
        -1,
      )
    }

  const moveItem =
    (
      instanceKey,
      destinationRow,
      destinationColumn,
    ) => {

      const moving =
        layout
          .placements
          .find(
            (item) =>
              item.key ===
              instanceKey,
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
            item.key !==
            instanceKey,
        )
        .forEach(
          (item) => {

            item
              .cells
              .forEach(
                (cell) =>
                  occupied.add(
                    cell,
                  ),
              )
          },
        )

      const valid =
        isPlacementValid({
          backpack,
          row:
            destinationRow,
          column:
            destinationColumn,
          width:
            moving.width,
          height:
            moving.height,
          occupied,
        })

      if (!valid) {

        setMessage(
          'That item will not fit there.',
        )

        return
      }

      setMessage('')

      setManualPositions(
        (current) => ({
          ...current,

          [instanceKey]: {
            row:
              destinationRow,

            column:
              destinationColumn,
          },
        }),
      )
    }

  const categoryHasItems =
    (
      category,
    ) =>
      category ===
        'RECOMMENDED' ||
      category ===
        'LOOSE AMMO'

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
                Add items from the categories below, then drag them anywhere they fit inside the backpack.
              </p>

            </div>

            <div className="flex gap-3">

              <div className="border border-white/8 bg-[#111416] px-5 py-3 text-right">

                <div className="text-[8px] font-black tracking-wider text-stone-600">
                  USED
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  {
                    layout.usedCells
                  }
                  <span className="text-stone-600">
                    /
                    {
                      backpack.capacity
                    }
                  </span>
                </div>

              </div>

              <div className="border border-amber-500/20 bg-amber-500/[0.04] px-5 py-3 text-right">

                <div className="text-[8px] font-black tracking-wider text-amber-600">
                  FREE
                </div>

                <div className="mt-1 text-xl font-black text-amber-400">
                  {
                    layout.remaining
                  }
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-[1700px] px-5 py-6 lg:px-8">

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">

          <aside className="space-y-3">

            <div className="border border-white/8 bg-[#0e1011]">

              <div className="border-b border-white/8 p-4">

                <div className="text-xs font-black tracking-[0.16em] text-white">
                  ADD TO BACKPACK
                </div>

                <div className="mt-1 text-[9px] text-stone-600">
                  OPEN A CATEGORY
                </div>

                <div className="mt-4 flex h-10 items-center gap-3 border border-white/8 bg-black/20 px-3">

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
                    placeholder="Search..."
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
                        size={13}
                        className="text-stone-600"
                      />
                    </button>

                  )}

                </div>

              </div>

              <div className="max-h-[680px] overflow-y-auto p-2">

                {categories.map(
                  (category) => {

                    const open =
                      openCategory ===
                      category

                    return (
                      <div
                        key={category}
                        className="mb-2 border border-white/8 bg-[#111416]"
                      >

                        <button
                          type="button"
                          onClick={() => {

                            setOpenCategory(
                              open
                                ? null
                                : category,
                            )

                            setOpenCalibre(
                              null,
                            )

                            setMessage(
                              '',
                            )
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left"
                        >

                          <span className={[
                            'text-[9px] font-black tracking-[0.14em]',
                            open
                              ? 'text-amber-400'
                              : 'text-stone-500',
                          ].join(' ')}>
                            {category}
                          </span>

                          <ChevronDown
                            size={14}
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

                            {categoryHasItems(
                              category,
                            ) ? (

                              <div className="space-y-2">

                                {Object.entries(
                                  ammoGroups,
                                ).map(
                                  ([
                                    calibreName,
                                    items,
                                  ]) => {

                                    const calibreOpen =
                                      openCalibre ===
                                      calibreName

                                    return (
                                      <div
                                        key={calibreName}
                                        className="border border-white/8 bg-black/20"
                                      >

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setOpenCalibre(
                                              calibreOpen
                                                ? null
                                                : calibreName,
                                            )
                                          }
                                          className="flex w-full items-center justify-between px-3 py-2 text-left"
                                        >

                                          <span className="text-[9px] font-black text-stone-300">
                                            {calibreName}
                                          </span>

                                          <ChevronRight
                                            size={13}
                                            className={[
                                              'transition',
                                              calibreOpen
                                                ? 'rotate-90 text-amber-500'
                                                : 'text-stone-700',
                                            ].join(' ')}
                                          />

                                        </button>

                                        {calibreOpen && (

                                          <div className="space-y-2 border-t border-white/8 p-2">

                                            {items.map(
                                              (item) => {

                                                const footprint =
                                                  footprintForItem(
                                                    item,
                                                  )

                                                return (
                                                  <div
                                                    key={item.id}
                                                    className="border border-white/8 bg-[#121617] p-2"
                                                  >

                                                    <div className="flex gap-3">

                                                      <WardogsItemImage
                                                        item={item}
                                                        className="h-14 w-20 shrink-0 border border-white/8"
                                                        imageClassName="p-1"
                                                      />

                                                      <div className="min-w-0 flex-1">

                                                        <div className="truncate text-[9px] font-black text-white">
                                                          {
                                                            item.name
                                                          }
                                                        </div>

                                                        <div className="mt-1 text-[8px] text-stone-600">
                                                          {
                                                            footprint.width
                                                          }
                                                          ×
                                                          {
                                                            footprint.height
                                                          }
                                                          {' / '}
                                                          {
                                                            money(
                                                              item.price,
                                                            )
                                                          }
                                                        </div>

                                                      </div>

                                                    </div>

                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        tryAddItem(
                                                          item,
                                                        )
                                                      }
                                                      className="mt-2 flex h-8 w-full items-center justify-center gap-2 bg-amber-500 text-[8px] font-black tracking-wider text-black"
                                                    >
                                                      <Plus size={12} />

                                                      ADD TO BAG
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

                              <div className="p-4 text-center text-[9px] leading-4 text-stone-700">
                                Verified items for this category are being added next.
                              </div>

                            )}

                          </div>

                        )}

                      </div>
                    )
                  },
                )}

              </div>

            </div>

          </aside>

          <section className="flex flex-col items-center">

            <div className="mb-4 text-center">

              <div className="text-[9px] font-black tracking-[0.18em] text-stone-600">
                EQUIPPED BACKPACK
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                {
                  backpack.name
                }
              </div>

              <div className="mt-1 text-sm font-black text-amber-500">
                {
                  money(
                    backpack.price,
                  )
                }
              </div>

            </div>

            <div className="relative w-full max-w-[620px] border border-white/8 bg-[#0e1011] p-8">

              <WardogsItemImage
                item={backpack}
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                imageClassName="p-16"
              />

              {backpack.exactLayoutPending ? (

                <div className="relative z-10 mx-auto max-w-[440px] border border-white/10 bg-black/55 p-8">

                  <div className="text-center">

                    <div className="text-4xl font-black text-white">
                      {
                        layout.usedCells
                      }
                      /
                      {
                        backpack.capacity
                      }
                    </div>

                    <div className="mt-2 text-[9px] font-black tracking-wider text-stone-600">
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
                            item={
                              instance.item
                            }
                            className="h-14 w-20 shrink-0"
                            imageClassName="p-1"
                          />

                          <div className="min-w-0 flex-1">

                            <div className="truncate text-[10px] font-black text-white">
                              {
                                instance
                                  .item
                                  .name
                              }
                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                instance,
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
                  className="relative z-10 mx-auto grid w-full max-w-[520px] gap-1 border border-white/10 bg-black/60 p-3"
                  style={{
                    gridTemplateColumns:
                      `repeat(${backpack.columns}, minmax(0, 1fr))`,

                    gridTemplateRows:
                      `repeat(${backpack.rows}, minmax(0, 1fr))`,

                    aspectRatio:
                      `${backpack.columns} / ${backpack.rows}`,
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

                            if (!blocked) {
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

                            moveItem(
                              draggingKey,
                              row,
                              column,
                            )

                            setDraggingKey(
                              null,
                            )
                          }}
                          className={[
                            'min-h-0 border transition',
                            blocked
                              ? 'pointer-events-none border-transparent bg-transparent'
                              : draggingKey
                                ? 'border-amber-500/20 bg-amber-500/[0.025]'
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
                          key={
                            placement.key
                          }
                          draggable
                          onDragStart={() => {

                            setDraggingKey(
                              placement.key,
                            )

                            setMessage(
                              '',
                            )
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
                          }}
                          className={[
                            'relative z-20 min-h-0 min-w-0 cursor-grab overflow-hidden border bg-[#171b1d] active:cursor-grabbing',
                            draggingKey ===
                            placement.key
                              ? 'border-amber-300 opacity-60'
                              : 'border-amber-500/45',
                          ].join(' ')}
                        >

                          <WardogsItemImage
                            item={
                              placement.item
                            }
                            className="absolute inset-0"
                            imageClassName="p-0.5"
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

                          <div className="pointer-events-none absolute left-1 top-1 bg-emerald-500 px-1 py-0.5 text-[7px] font-black text-black">
                            {
                              money(
                                placement
                                  .item
                                  .price,
                              )
                            }
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
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

              )}

              {message && (

                <div className="relative z-20 mx-auto mt-4 max-w-[520px] border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-center text-[10px] font-bold text-red-400">
                  {message}
                </div>

              )}

              {!backpack.exactLayoutPending && (

                <div className="relative z-20 mx-auto mt-4 max-w-[520px] text-center text-[8px] font-bold tracking-[0.14em] text-stone-700">
                  DRAG PACKED ITEMS TO REARRANGE THEM
                </div>

              )}

            </div>

          </section>

          <aside>

            <div className="border border-amber-500/20 bg-[#111416] p-5">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                LOADOUT SUMMARY
              </div>

              <div className="mt-5 flex justify-between text-[10px] text-stone-500">

                <span>
                  EQUIPMENT
                </span>

                <span className="font-black text-white">
                  {
                    money(
                      equipmentValue,
                    )
                  }
                </span>

              </div>

              <div className="mt-3 flex justify-between text-[10px] text-stone-500">

                <span>
                  BAG CONTENTS
                </span>

                <span className="font-black text-white">
                  {
                    money(
                      contentsValue,
                    )
                  }
                </span>

              </div>

              <div className="mt-5 border-t border-white/8 pt-5">

                <div className="text-[8px] font-black tracking-[0.18em] text-amber-600">
                  TOTAL VALUE
                </div>

                <div className="mt-1 text-3xl font-black text-amber-400">
                  {
                    money(
                      totalValue,
                    )
                  }
                </div>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="border border-white/8 bg-black/20 p-3">

                  <div className="text-[8px] font-black text-stone-600">
                    WEIGHT
                  </div>

                  <div className="mt-1 text-sm font-black text-white">
                    {
                      knownWeight.toFixed(
                        2,
                      )
                    }
                    {' '}
                    KG
                  </div>

                </div>

                <div className="border border-white/8 bg-black/20 p-3">

                  <div className="text-[8px] font-black text-stone-600">
                    ROUNDS
                  </div>

                  <div className="mt-1 text-sm font-black text-emerald-400">
                    {
                      totalRounds
                    }
                  </div>

                </div>

              </div>

              <div className="mt-5 border-t border-white/8 pt-4">

                <div className="flex justify-between text-[9px] text-stone-600">

                  <span>
                    USED CELLS
                  </span>

                  <span className="font-black text-white">
                    {
                      layout.usedCells
                    }
                  </span>

                </div>

                <div className="mt-2 flex justify-between text-[9px] text-stone-600">

                  <span>
                    FREE CELLS
                  </span>

                  <span className="font-black text-amber-400">
                    {
                      layout.remaining
                    }
                  </span>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  )
}

export default BackpackPackingView