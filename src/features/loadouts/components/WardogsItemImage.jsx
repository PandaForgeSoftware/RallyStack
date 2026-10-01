import {
  useMemo,
  useState,
} from 'react'

import {
  Package,
} from 'lucide-react'

import {
  itemImages,
} from '../../../data/wardogsItemImages'

function WardogsItemImage({
  item,
  className = '',
  imageClassName = '',
  imageStyle = null,
}) {

  const [
    failed,
    setFailed,
  ] =
    useState([])

  const candidates =
    useMemo(
      () => {

        if (!item?.id) {
          return []
        }

        const ids = [
          item.id,
        ]

        if (
          item.id.endsWith(
            '-t',
          )
        ) {

          ids.push(
            item.id.slice(
              0,
              -2,
            ),
          )
        }

        return [
          item.image,
          ...ids.map(
            (id) =>
              itemImages[id],
          ),
        ].filter(Boolean)
      },
      [item],
    )

  const source =
    candidates.find(
      (value) =>
        !failed.includes(
          value,
        ),
    )

  return (
    <div
      className={[
        'relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden',
        className,
      ].join(' ')}
    >

      {source ? (

        <img
          src={source}
          alt={
            item?.name ||
            'Item'
          }
          draggable="false"
          onError={() =>
            setFailed(
              (current) => [
                ...current,
                source,
              ],
            )
          }
          style={
            imageStyle ||
            undefined
          }
          className={[
            'block h-full w-full object-contain object-center',
            imageClassName,
          ].join(' ')}
        />

      ) : (

        <Package
          size={28}
          strokeWidth={1}
          className="text-stone-700"
        />

      )}

    </div>
  )
}

export default WardogsItemImage