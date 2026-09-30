import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Package,
} from 'lucide-react'

import {
  itemImages,
} from '../../../data/wardogsItemImages'

function getImageSource(
  item,
) {

  if (!item?.id) {
    return null
  }

  if (
    itemImages[
      item.id
    ]
  ) {

    return itemImages[
      item.id
    ]
  }

  if (
    item.id.endsWith(
      '-t',
    )
  ) {

    const baseId =
      item.id.slice(
        0,
        -2,
      )

    return (
      itemImages[
        baseId
      ] ||
      null
    )
  }

  return null
}

function PackedItemImage({
  item,
}) {

  const canvasRef =
    useRef(null)

  const [
    failed,
    setFailed,
  ] =
    useState(false)

  const source =
    getImageSource(
      item,
    )

  useEffect(
    () => {

      if (
        !source ||
        !canvasRef.current
      ) {
        return
      }

      const canvas =
        canvasRef.current

      const context =
        canvas.getContext(
          '2d',
          {
            willReadFrequently:
              true,
          },
        )

      if (!context) {
        return
      }

      const image =
        new Image()

      image.onload =
        () => {

          setFailed(false)

          const sourceCanvas =
            document.createElement(
              'canvas',
            )

          sourceCanvas.width =
            image.naturalWidth

          sourceCanvas.height =
            image.naturalHeight

          const sourceContext =
            sourceCanvas.getContext(
              '2d',
              {
                willReadFrequently:
                  true,
              },
            )

          if (!sourceContext) {
            return
          }

          sourceContext.clearRect(
            0,
            0,
            sourceCanvas.width,
            sourceCanvas.height,
          )

          sourceContext.drawImage(
            image,
            0,
            0,
          )

          const pixels =
            sourceContext.getImageData(
              0,
              0,
              sourceCanvas.width,
              sourceCanvas.height,
            )

          const data =
            pixels.data

          let minX =
            sourceCanvas.width

          let minY =
            sourceCanvas.height

          let maxX =
            -1

          let maxY =
            -1

          let transparentPixels =
            0

          const totalPixels =
            sourceCanvas.width *
            sourceCanvas.height

          for (
            let index = 3;
            index < data.length;
            index += 4
          ) {

            if (
              data[index] <
              245
            ) {

              transparentPixels += 1
            }
          }

          const hasUsefulAlpha =
            transparentPixels >
            totalPixels *
              0.02

          const cornerSamples = [
            [
              0,
              0,
            ],
            [
              sourceCanvas.width -
                1,
              0,
            ],
            [
              0,
              sourceCanvas.height -
                1,
            ],
            [
              sourceCanvas.width -
                1,
              sourceCanvas.height -
                1,
            ],
          ]

          let backgroundR =
            0

          let backgroundG =
            0

          let backgroundB =
            0

          cornerSamples.forEach(
            ([
              x,
              y,
            ]) => {

              const index =
                (
                  y *
                    sourceCanvas.width +
                  x
                ) *
                4

              backgroundR +=
                data[index]

              backgroundG +=
                data[
                  index + 1
                ]

              backgroundB +=
                data[
                  index + 2
                ]
            },
          )

          backgroundR /=
            cornerSamples.length

          backgroundG /=
            cornerSamples.length

          backgroundB /=
            cornerSamples.length

          for (
            let y = 0;
            y <
            sourceCanvas.height;
            y += 1
          ) {

            for (
              let x = 0;
              x <
              sourceCanvas.width;
              x += 1
            ) {

              const index =
                (
                  y *
                    sourceCanvas.width +
                  x
                ) *
                  4

              const red =
                data[index]

              const green =
                data[
                  index + 1
                ]

              const blue =
                data[
                  index + 2
                ]

              const alpha =
                data[
                  index + 3
                ]

              let visible =
                false

              if (
                hasUsefulAlpha
              ) {

                visible =
                  alpha >
                  24
              }
              else {

                const difference =
                  Math.abs(
                    red -
                      backgroundR,
                  ) +
                  Math.abs(
                    green -
                      backgroundG,
                  ) +
                  Math.abs(
                    blue -
                      backgroundB,
                  )

                visible =
                  alpha >
                    24 &&
                  difference >
                    24
              }

              if (!visible) {
                continue
              }

              minX =
                Math.min(
                  minX,
                  x,
                )

              minY =
                Math.min(
                  minY,
                  y,
                )

              maxX =
                Math.max(
                  maxX,
                  x,
                )

              maxY =
                Math.max(
                  maxY,
                  y,
                )
            }
          }

          if (
            maxX < minX ||
            maxY < minY
          ) {

            minX = 0
            minY = 0

            maxX =
              sourceCanvas.width -
              1

            maxY =
              sourceCanvas.height -
              1
          }

          const cropWidth =
            maxX -
            minX +
            1

          const cropHeight =
            maxY -
            minY +
            1

          const padding =
            4

          const destinationWidth =
            canvas.clientWidth

          const destinationHeight =
            canvas.clientHeight

          const pixelRatio =
            Math.max(
              1,
              window
                .devicePixelRatio ||
                1,
            )

          canvas.width =
            Math.round(
              destinationWidth *
              pixelRatio,
            )

          canvas.height =
            Math.round(
              destinationHeight *
              pixelRatio,
            )

          context.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0,
          )

          context.clearRect(
            0,
            0,
            destinationWidth,
            destinationHeight,
          )

          const availableWidth =
            Math.max(
              1,
              destinationWidth -
                padding *
                  2,
            )

          const availableHeight =
            Math.max(
              1,
              destinationHeight -
                padding *
                  2,
            )

          const scale =
            Math.min(
              availableWidth /
                cropWidth,
              availableHeight /
                cropHeight,
            )

          const drawWidth =
            cropWidth *
            scale

          const drawHeight =
            cropHeight *
            scale

          const drawX =
            (
              destinationWidth -
              drawWidth
            ) /
            2

          const drawY =
            (
              destinationHeight -
              drawHeight
            ) /
            2

          context.imageSmoothingEnabled =
            true

          context.imageSmoothingQuality =
            'high'

          context.drawImage(
            sourceCanvas,
            minX,
            minY,
            cropWidth,
            cropHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight,
          )
        }

      image.onerror =
        () => {

          setFailed(
            true,
          )
        }

      image.src =
        source
    },
    [
      item,
      source,
    ],
  )

  if (
    !source ||
    failed
  ) {

    return (
      <div className="flex h-full w-full items-center justify-center">

        <Package
          size={26}
          strokeWidth={1}
          className="text-stone-700"
        />

      </div>
    )
  }

  return (
    <canvas
      ref={
        canvasRef
      }
      className="block h-full w-full"
    />
  )
}

export default PackedItemImage