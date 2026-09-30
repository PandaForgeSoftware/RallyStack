import {
  X,
} from 'lucide-react'

import WardogsItemImage from './WardogsItemImage'

const money =
  (value) =>
    `$${Number(value || 0).toLocaleString()}`

const CELL_SIZE =
  74

const CELL_GAP =
  4

const GRID_PADDING =
  12

function StableBackpackGrid({
  backpack,
  placements,
  draggingKey,
  setDraggingKey,
  moveInstance,
  removeInstance,
}) {

  if (
    !backpack.columns ||
    !backpack.rows
  ) {
    return null
  }

  const gridWidth =
    (
      backpack.columns *
      CELL_SIZE
    ) +
    (
      (
        backpack.columns -
        1
      ) *
      CELL_GAP
    )

  const gridHeight =
    (
      backpack.rows *
      CELL_SIZE
    ) +
    (
      (
        backpack.rows -
        1
      ) *
      CELL_GAP
    )

  const containerWidth =
    gridWidth +
    GRID_PADDING * 2

  const containerHeight =
    gridHeight +
    GRID_PADDING * 2

  const blocked =
    new Set(
      backpack.blocked ||
        [],
    )

  return (
    <div
      className="relative shrink-0 border border-white/10 bg-black/70"
      style={{
        width:
          `${containerWidth}px`,

        height:
          `${containerHeight}px`,
      }}
    >

      {/* Permanent backpack cells */}

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

          const disabled =
            blocked.has(
              index,
            )

          const left =
            GRID_PADDING +
            column *
            (
              CELL_SIZE +
              CELL_GAP
            )

          const top =
            GRID_PADDING +
            row *
            (
              CELL_SIZE +
              CELL_GAP
            )

          return (
            <div
              key={
                `cell-${index}`
              }
              onDragOver={(event) => {

                if (!disabled) {
                  event.preventDefault()
                }
              }}
              onDrop={(event) => {

                event.preventDefault()

                if (
                  disabled ||
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
                'absolute border transition',
                disabled
                  ? 'border-transparent bg-transparent'
                  : draggingKey
                    ? 'border-amber-500/30 bg-amber-500/[0.035]'
                    : 'border-white/10 bg-[#15191b]',
              ].join(' ')}
              style={{
                left:
                  `${left}px`,

                top:
                  `${top}px`,

                width:
                  `${CELL_SIZE}px`,

                height:
                  `${CELL_SIZE}px`,
              }}
            />
          )
        },
      )}

      {/* Packed items are a completely separate overlay */}

      {placements.map(
        (
          placement,
        ) => {

          const width =
            (
              placement.width *
              CELL_SIZE
            ) +
            (
              (
                placement.width -
                1
              ) *
              CELL_GAP
            )

          const height =
            (
              placement.height *
              CELL_SIZE
            ) +
            (
              (
                placement.height -
                1
              ) *
              CELL_GAP
            )

          const left =
            GRID_PADDING +
            placement.column *
            (
              CELL_SIZE +
              CELL_GAP
            )

          const top =
            GRID_PADDING +
            placement.row *
            (
              CELL_SIZE +
              CELL_GAP
            )

          const isDragging =
            draggingKey ===
            placement.key

          return (
            <div
              key={
                placement.key
              }
              draggable
              onDragStart={() =>
                setDraggingKey(
                  placement.key,
                )
              }
              onDragEnd={() =>
                setDraggingKey(
                  null,
                )
              }
              className={[
                'absolute z-20 cursor-grab overflow-hidden border bg-[#101314] active:cursor-grabbing',
                isDragging
                  ? 'border-amber-200 opacity-60'
                  : 'border-amber-500/55',
              ].join(' ')}
              style={{
                left:
                  `${left}px`,

                top:
                  `${top}px`,

                width:
                  `${width}px`,

                height:
                  `${height}px`,
              }}
            >

              <WardogsItemImage
                item={
                  placement.item
                }
                className="pointer-events-none absolute inset-[5px]"
                imageClassName="p-1"
              />

              <div className="pointer-events-none absolute left-1 top-1 z-30 bg-emerald-400 px-1.5 py-0.5 text-[7px] font-black text-black">
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
                className="absolute right-1 top-1 z-40 flex h-5 w-5 items-center justify-center bg-red-500 text-black"
              >
                <X size={10} />
              </button>

            </div>
          )
        },
      )}

    </div>
  )
}

export default StableBackpackGrid