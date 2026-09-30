import {
  backpacks,
  looseAmmo,
  weapons,
} from '../src/data/wardogsLoadoutData.js'

import {
  itemImages,
} from '../src/data/wardogsItemImages.js'

const collections = [
  {
    label: 'WEAPON',
    items: weapons,
  },
  {
    label: 'AMMO',
    items: looseAmmo,
  },
  {
    label: 'BACKPACK',
    items: backpacks,
  },
]

function getImageResolution(
  item,
) {

  if (
    itemImages[
      item.id
    ]
  ) {

    return {
      found: true,
      sourceId:
        item.id,
      fallback: false,
    }
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

    if (
      itemImages[
        baseId
      ]
    ) {

      return {
        found: true,
        sourceId:
          baseId,
        fallback: true,
      }
    }
  }

  return {
    found: false,
    sourceId: null,
    fallback: false,
  }
}

let total = 0
let direct = 0
let fallback = 0

const missing = []

console.log('')
console.log('========================================')
console.log('       RALLYSTACK IMAGE COVERAGE')
console.log('========================================')
console.log('')

for (
  const collection of
  collections
) {

  console.log(
    `--- ${collection.label} ---`,
  )

  for (
    const item of
    collection.items
  ) {

    total += 1

    const result =
      getImageResolution(
        item,
      )

    if (
      result.found &&
      !result.fallback
    ) {

      direct += 1

      console.log(
        `[OK]       ${item.id} | ${item.name}`,
      )

      continue
    }

    if (
      result.found &&
      result.fallback
    ) {

      fallback += 1

      console.log(
        `[FALLBACK] ${item.id} -> ${result.sourceId} | ${item.name}`,
      )

      continue
    }

    missing.push({
      type:
        collection.label,

      id:
        item.id,

      name:
        item.name,
    })

    console.log(
      `[MISSING]  ${item.id} | ${item.name}`,
    )
  }

  console.log('')
}

console.log('========================================')
console.log('SUMMARY')
console.log('========================================')
console.log(`Items checked : ${total}`)
console.log(`Direct images : ${direct}`)
console.log(`Fallback      : ${fallback}`)
console.log(`Missing       : ${missing.length}`)
console.log('')

if (
  missing.length >
  0
) {

  console.log(
    '===== MISSING IMAGE LIST =====',
  )

  for (
    const item of
    missing
  ) {

    console.log(
      `${item.type}\t${item.id}\t${item.name}`,
    )
  }
}
else {

  console.log(
    'All current loadout records have usable artwork.',
  )
}

console.log('')