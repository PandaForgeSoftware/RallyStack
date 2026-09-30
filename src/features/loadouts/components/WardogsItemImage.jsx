import {
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
    failed,
    setFailed,
  ] =
    useState(false)

  const source =
    item
      ? itemImages[
          item.id
        ]
      : null

  return (
    <div
      className={[
        'relative flex items-center justify-center overflow-hidden bg-black/20',
        className,
      ].join(' ')}
    >

      {source &&
      !failed ? (

        <img
          src={source}
          alt={item.name}
          onError={() =>
            setFailed(true)
          }
          draggable="false"
          className={[
            'h-full w-full object-contain',
            imageClassName,
          ].join(' ')}
        />

      ) : (

        <Package
          size={34}
          strokeWidth={1}
          className="text-stone-700"
        />

      )}

    </div>
  )
}

export default WardogsItemImage