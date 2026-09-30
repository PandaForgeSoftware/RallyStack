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
}) {

  const [
    failedSources,
    setFailedSources,
  ] =
    useState([])

  const candidates =
    useMemo(
      () => {

        if (!item?.id) {
          return []
        }

        const values = [
          item.id,
        ]

        if (
          item.id.endsWith(
            '-t',
          )
        ) {

          values.push(
            item.id.slice(
              0,
              -2,
            ),
          )
        }

        return values
          .map(
            (id) =>
              itemImages[id],
          )
          .filter(Boolean)
      },
      [item],
    )

  const source =
    candidates.find(
      (candidate) =>
        !failedSources.includes(
          candidate,
        ),
    )

  return (
    <div
      className={[
        'relative flex items-center justify-center overflow-hidden',
        className,
      ].join(' ')}
    >

      {source ? (

        <img
          src={source}
          alt={
            item?.name ||
            'WARDOGS item'
          }
          draggable="false"
          onError={() =>
            setFailedSources(
              (current) => [
                ...current,
                source,
              ],
            )
          }
          className={[
            'block h-full w-full object-contain',
            imageClassName,
          ].join(' ')}
        />

      ) : (

        <Package
          size={30}
          strokeWidth={1}
          className="text-stone-700"
        />

      )}

    </div>
  )
}

export default WardogsItemImage