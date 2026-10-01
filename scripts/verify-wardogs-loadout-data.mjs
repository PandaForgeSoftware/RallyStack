import {
  attachmentItems as labAttachmentItems,
} from '../src/data/wardogsCombatData.js'

import {
  packableItems,
} from '../src/data/wardogsPackableData.js'

import {
  weapons,
} from '../src/data/wardogsLoadoutData.js'

import {
  zoneAttachmentItems,
  zoneAttachmentMeta,
  zoneWeaponData,
} from '../src/data/wardogsZoneAttachments.js'

const slotForType = {
  MAGAZINE:
    'MAGAZINE',
  OPTIC:
    'OPTIC',
  CANTED_SIGHT:
    'CANTED_SIGHT',
  MUZZLE:
    'MUZZLE',
  FOREGRIP:
    'UNDERBARREL',
  GRIP:
    'GRIP',
  PISTOL_GRIP:
    'PISTOL_GRIP',
  HANDGUARD:
    'HANDGUARD',
  BARREL:
    'BARREL',
  STOCK:
    'STOCK',
  DUST_COVER:
    'DUST_COVER',
  TRIGGER:
    'TRIGGER',
}

const labByName =
  new Map(
    labAttachmentItems.map(
      (item) => [
        item.name,
        item,
      ],
    ),
  )

const packableMagazines =
  new Map(
    packableItems
      .filter(
        (item) =>
          item.packCategory ===
          'MAGAZINES',
      )
      .map(
        (item) => [
          item.name,
          item,
        ],
      ),
  )

const failures = []
const warnings = []

function fail(
  message,
) {
  failures.push(
    message,
  )
}

function warn(
  message,
) {
  warnings.push(
    message,
  )
}

if (
  zoneAttachmentMeta
    .declaredCount &&
  zoneAttachmentItems
    .length !==
    zoneAttachmentMeta
      .declaredCount
) {

  fail(
    `Attachment total mismatch: generated ${zoneAttachmentItems.length}, source declared ${zoneAttachmentMeta.declaredCount}.`,
  )
}

const weaponDataCount =
  Object.keys(
    zoneWeaponData,
  ).length

if (
  weaponDataCount !==
  weapons.length
) {

  fail(
    `Weapon coverage incomplete: ${weaponDataCount}/${weapons.length}.`,
  )
}

for (
  const weapon of
  weapons
) {

  const data =
    zoneWeaponData[
      weapon.id
    ]

  if (!data) {

    fail(
      `Missing current weapon data: ${weapon.name}`,
    )

    continue
  }

  if (
    !data.sourceUrl
  ) {

    fail(
      `Missing source URL for weapon: ${weapon.name}`,
    )
  }

  const duplicateMagazines =
    (
      data.compatibleMagazines ||
      []
    ).filter(
      (
        name,
        index,
        values,
      ) =>
        values.indexOf(
          name,
        ) !==
        index,
    )

  if (
    duplicateMagazines.length >
      0
  ) {

    fail(
      `Duplicate magazine compatibility on ${weapon.name}: ${duplicateMagazines.join(', ')}`,
    )
  }

  for (
    const magazineName of
    data.compatibleMagazines ||
    []
  ) {

    if (
      !packableMagazines.has(
        magazineName,
      )
    ) {

      fail(
        `${weapon.name} references magazine not present in packable catalogue: ${magazineName}`,
      )
    }
  }
}

const seenIds =
  new Set()

for (
  const item of
  zoneAttachmentItems
) {

  if (
    seenIds.has(
      item.id,
    )
  ) {

    fail(
      `Duplicate attachment id: ${item.id}`,
    )
  }

  seenIds.add(
    item.id,
  )

  const fits =
    Array.from(
      new Set(
        item.compatibleWeapons ||
        [],
      ),
    )

  if (
    fits.length !==
    (
      item.compatibleWeapons ||
      []
    ).length
  ) {

    fail(
      `Duplicate compatibility entries: ${item.name}`,
    )
  }

  if (
    fits.length ===
    0
  ) {
    continue
  }

  const slot =
    slotForType[
      item.type
    ]

  if (!slot) {

    fail(
      `Selectable attachment has no supported slot mapping: ${item.name} [${item.type}]`,
    )

    continue
  }

  const lab =
    labByName.get(
      item.name,
    )

  const price =
    item.price ??
    lab?.price ??
    null

  const weight =
    item.weight ??
    lab?.weight ??
    null

  const image =
    item.image ||
    lab?.image ||
    null

  if (
    price ===
    null
  ) {

    fail(
      `Selectable attachment has no verified price: ${item.name}`,
    )
  }

  if (
    weight ===
    null
  ) {

    fail(
      `Selectable attachment has no verified weight: ${item.name}`,
    )
  }

  if (!image) {

    fail(
      `Selectable attachment has no artwork: ${item.name}`,
    )
  }

  for (
    const weaponId of
    fits
  ) {

    const weapon =
      weapons.find(
        (candidate) =>
          candidate.id ===
          weaponId,
      )

    const data =
      zoneWeaponData[
        weaponId
      ]

    if (
      !weapon ||
      !data
    ) {

      fail(
        `${item.name} references unknown weapon id: ${weaponId}`,
      )

      continue
    }

    if (
      item.type ===
      'MAGAZINE'
    ) {

      if (
        !(
          data
            .compatibleMagazines ||
          []
        ).includes(
          item.name,
        )
      ) {

        fail(
          `Magazine fit not confirmed by weapon page: ${item.name} -> ${weapon.name}`,
        )
      }
    }
    else if (
      !(
        data
          .attachmentSlots ||
        []
      ).includes(
        slot,
      )
    ) {

      fail(
        `Attachment fit violates weapon gunsmith slots: ${item.name} [${slot}] -> ${weapon.name}`,
      )
    }

    if (
      /\bBipod\b/i.test(
        item.name,
      ) &&
      weapon.category ===
        'SMG'
    ) {

      /*
       * Current game-data sanity guard.
       * If a future patch genuinely adds an SMG bipod,
       * this intentionally stops the automated update
       * so the change is reviewed rather than silently
       * appearing in RallyStack.
       */
      fail(
        `Unexpected bipod/SMG compatibility needs review: ${item.name} -> ${weapon.name}`,
      )
    }
  }
}

const selectable =
  zoneAttachmentItems.filter(
    (item) =>
      (
        item.compatibleWeapons ||
        []
      ).length >
      0,
  )

const withoutFits =
  zoneAttachmentItems.length -
  selectable.length

if (
  withoutFits >
  0
) {

  warn(
    `${withoutFits} catalogue attachment records are not selectable on any currently matched RallyStack weapon. They remain hidden from the builder.`,
  )
}

console.log('')
console.log(
  '========================================',
)
console.log(
  'RALLYSTACK LOADOUT DATA VERIFICATION',
)
console.log(
  '========================================',
)
console.log(
  `WEAPONS          ${weaponDataCount}/${weapons.length}`,
)
console.log(
  `ATTACHMENTS      ${zoneAttachmentItems.length}`,
)
console.log(
  `SELECTABLE       ${selectable.length}`,
)
console.log(
  `WARNINGS         ${warnings.length}`,
)
console.log(
  `FAILURES         ${failures.length}`,
)

warnings.forEach(
  (message) =>
    console.log(
      `WARN: ${message}`,
    ),
)

if (
  failures.length >
  0
) {

  failures.forEach(
    (message) =>
      console.error(
        `FAIL: ${message}`,
      ),
  )

  process.exitCode =
    1
}
else {

  console.log(
    'VERIFIED: current selectable loadout data passed.',
  )
}
