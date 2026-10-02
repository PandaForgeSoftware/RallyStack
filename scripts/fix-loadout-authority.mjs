import {
  verifiedWeaponCompatibility,
  verifiedCompatibilityMeta,
} from '../src/data/wardogsVerifiedCompatibility.js'
import fs from 'node:fs/promises'

const FILE = 'src/pages/LoadoutsPage.jsx'
const BACKUP = 'src/pages/LoadoutsPage.before-authoritative-compatibility.jsx.bak'

let source = await fs.readFile(FILE, 'utf8')

await fs.copyFile(FILE, BACKUP)

console.log('')
console.log('===== RALLYSTACK LOADOUT AUTHORITY FIX =====')
console.log('')

/*
 * ------------------------------------------------------------
 * 1. Import the VERIFIED compatibility database
 * ------------------------------------------------------------
 */

if (
  !source.includes(
    "from '../data/wardogsVerifiedCompatibility'"
  )
) {
  const anchor =
    "import BackpackPackingView from '../features/loadouts/components/BackpackPackingView'"

  if (!source.includes(anchor)) {
    throw new Error(
      'Could not locate BackpackPackingView import anchor.'
    )
  }

  source = source.replace(
    anchor,
    `import {
  verifiedWeaponCompatibility,
  verifiedCompatibilityMeta,
} from '../data/wardogsVerifiedCompatibility'

${anchor}`
  )

  console.log('✓ Verified compatibility import added')
}
else {
  console.log('✓ Verified compatibility import already present')
}

/*
 * ------------------------------------------------------------
 * 2. Add exact RallyStack weapon-ID → verified weapon mapping
 * ------------------------------------------------------------
 */

const mappingBlock = `
const verifiedWeaponNameById = {
  a91: 'A-91',
  ak74: 'AK74',
  amp9: 'AMP-9',
  amr50: 'AMR 50',
  bmr308: 'BMR-308',
  bushmaster: 'Bushmaster M17S',
  compoundbow: 'Compound Bow',
  deagle: 'Deagle',
  fal: 'FAL',
  galil: 'Galil',
  ggx17: 'GGX 17',
  ggx18: 'GGX 18',
  judge: 'Judge',
  kh2002: 'KH-2002',
  m4: 'M4',
  m249: 'M249 SAW',
  m500: 'M500',
  m1911: 'M1911',
  maaws: 'MAAWS',
  mgl40: 'MGL-40',
  mk22: 'MK22',
  mosin: 'Mosin Nagant',
  mp5: 'MP5',
  mp43: 'MP43',
  pkm: 'PKM',
  pp19: 'PP-19 Vityaz',
  rpg7: 'RPG-7',
  scoutrifle: 'Scout Rifle TD',
  sks: 'SKS',
  super45: 'Super-45',
  sv98: 'SV98',
  svd: 'SVD',
  t21: 'T-21',
  verba: '9K333 Verba',
}

const getVerifiedWeaponName = (weapon) => {
  if (!weapon) {
    return null
  }

  const mapped =
    verifiedWeaponNameById[
      weapon.id
    ]

  if (mapped) {
    return mapped
  }

  const direct =
    Object.keys(
      verifiedWeaponCompatibility,
    ).find(
      (name) =>
        normaliseDataName(name) ===
        normaliseDataName(
          weapon.name,
        ),
    )

  return direct || null
}
`

if (
  !source.includes(
    'const verifiedWeaponNameById ='
  )
) {
  const anchor =
    'const magazineNameMatchers = {'

  if (!source.includes(anchor)) {
    throw new Error(
      'Could not locate magazineNameMatchers.'
    )
  }

  source = source.replace(
    anchor,
    `${mappingBlock}

${anchor}`
  )

  console.log('✓ Weapon ID mapping added')
}
else {
  console.log('✓ Weapon ID mapping already present')
}

/*
 * ------------------------------------------------------------
 * 3. Replace Specialist equipment handling
 *
 * Launchers remain in weapons[].
 * This gathers ALL additional Specialist-slot equipment from:
 * - Zone equipment
 * - LAB gear
 * - Packable items
 * - Medical items
 * ------------------------------------------------------------
 */

const specialistStart =
  source.indexOf(
    'const specialistEquipmentOptions ='
  )

const specialistEnd =
  source.indexOf(
    'const operatorGearOptions =',
    specialistStart
  )

if (
  specialistStart < 0 ||
  specialistEnd < 0
) {
  throw new Error(
    'Could not locate specialistEquipmentOptions block.'
  )
}

const specialistReplacement = `
const specialistEquipmentSources = [
  ...zoneEquipmentItems,
  ...gearItems,
  ...packableItems,
  ...medicalItems,
]

const specialistEquipmentOptions =
  Array.from(
    specialistEquipmentSources.reduce(
      (map, item) => {

        const slotValue =
          String(
            item.slot ??
            item.equipmentSlot ??
            item.loadoutSlot ??
            item.type ??
            '',
          )
            .trim()
            .toUpperCase()

        if (
          slotValue !==
          'SPECIALIST'
        ) {
          return map
        }

        const key =
          normaliseDataName(
            item.name,
          )

        const existing =
          map.get(key)

        map.set(
          key,
          existing
            ? {
                ...existing,
                ...item,

                price:
                  item.price ??
                  existing.price ??
                  null,

                weight:
                  item.weight ??
                  existing.weight ??
                  null,

                image:
                  item.image ||
                  existing.image ||
                  null,
              }
            : {
                ...item,
              },
        )

        return map
      },
      new Map(),
    ).values(),
  )
    .map(
      (item) => ({
        ...item,

        slot:
          'specialist',

        kind:
          'specialist_equipment',

        category:
          item.category ||
          item.type ||
          'SPECIALIST',

        calibre:
          item.calibre ||
          '',

        damage:
          item.damage ??
          null,

        rpm:
          item.rpm ??
          null,
      }),
    )

`

source =
  source.slice(
    0,
    specialistStart,
  ) +
  specialistReplacement +
  source.slice(
    specialistEnd,
  )

console.log(
  '✓ Specialist equipment now merges every synced Specialist source'
)

/*
 * ------------------------------------------------------------
 * 4. Replace attachment selection authority
 *
 * THIS IS THE IMPORTANT FIX.
 *
 * OLD:
 * zoneAttachmentItems.compatibleWeapons
 *
 * NEW:
 * wardogsVerifiedCompatibility only
 *
 * Zone/LAB data is now metadata ONLY:
 * price
 * weight
 * images
 * dimensions
 * modifiers
 *
 * It CANNOT grant compatibility anymore.
 * ------------------------------------------------------------
 */

const attachmentStart =
  source.indexOf(
    'const getAttachmentOptions ='
  )

const attachmentEnd =
  source.indexOf(
    '\nfunction WeaponWorkbench',
    attachmentStart
  )

if (
  attachmentStart < 0 ||
  attachmentEnd < 0
) {
  throw new Error(
    'Could not locate getAttachmentOptions function.'
  )
}

const attachmentReplacement = `
const getAttachmentOptions =
  (
    weapon,
    type,
  ) => {

    if (!weapon) {
      return []
    }

    const verifiedWeaponName =
      getVerifiedWeaponName(
        weapon,
      )

    if (
      !verifiedWeaponName
    ) {
      console.warn(
        '[LOADOUT] No verified compatibility mapping for weapon:',
        weapon.id,
        weapon.name,
      )

      return []
    }

    const verifiedWeapon =
      verifiedWeaponCompatibility[
        verifiedWeaponName
      ]

    if (!verifiedWeapon) {
      return []
    }

    const verifiedEntries =
      verifiedWeapon
        .attachments?.[
          type
        ] || []

    /*
     * An empty verified list means EMPTY.
     *
     * Do NOT fall back to Zone compatibility.
     * Do NOT use category matching.
     * Do NOT infer anything.
     */
    if (
      verifiedEntries.length ===
      0
    ) {
      return []
    }

    /*
     * The old feeds are useful for metadata,
     * but they are forbidden from deciding
     * which weapon accepts which attachment.
     */
    const metadataPool =
      type ===
      'MAGAZINE'
        ? [
            ...completeAttachmentItems,
            ...magazineCatalogue,
          ]
        : completeAttachmentItems

    const metadataByName =
      new Map()

    metadataPool.forEach(
      (item) => {

        const key =
          normaliseDataName(
            item.name,
          )

        const previous =
          metadataByName.get(
            key,
          )

        metadataByName.set(
          key,
          previous
            ? {
                ...previous,
                ...item,

                price:
                  item.price ??
                  previous.price ??
                  null,

                weight:
                  item.weight ??
                  previous.weight ??
                  null,

                inventoryWidth:
                  item.inventoryWidth ??
                  previous.inventoryWidth ??
                  null,

                inventoryHeight:
                  item.inventoryHeight ??
                  previous.inventoryHeight ??
                  null,

                image:
                  item.image ||
                  previous.image ||
                  null,
              }
            : item,
        )
      },
    )

    return verifiedEntries.map(
      (verified) => {

        const metadata =
          metadataByName.get(
            normaliseDataName(
              verified.name,
            ),
          ) || {}

        return {
          ...metadata,
          ...verified,

          id:
            metadata.id ||
            verified.slug ||
            normaliseDataName(
              verified.name,
            ),

          name:
            verified.name,

          type,

          price:
            metadata.price ??
            verified.price ??
            null,

          weight:
            metadata.weight ??
            verified.weight ??
            null,

          inventoryWidth:
            metadata.inventoryWidth ??
            verified.inventoryWidth ??
            null,

          inventoryHeight:
            metadata.inventoryHeight ??
            verified.inventoryHeight ??
            null,

          image:
            metadata.image ||
            verified.image ||
            null,

          modifiers:
            metadata.modifiers ||
            verified.modifiers ||
            null,

          effects:
            metadata.effects ||
            verified.effects ||
            [],

          sourceUrl:
            verified.href ||
            metadata.sourceUrl ||
            null,

          compatibilitySource:
            'VERIFIED_WARDOGS_FITS',

          compatibleWeapons: [
            weapon.id,
          ],
        }
      },
    )
  }

`

source =
  source.slice(
    0,
    attachmentStart,
  ) +
  attachmentReplacement +
  source.slice(
    attachmentEnd,
  )

console.log(
  '✓ Attachment picker now uses VERIFIED compatibility only'
)

/*
 * ------------------------------------------------------------
 * 5. Deduplicate Specialist picker
 * ------------------------------------------------------------
 */

const oldSpecialistReturn = `return [
          ...weaponOptions,
          ...specialistEquipmentOptions,
        ]`

const newSpecialistReturn = `return Array.from(
          new Map(
            [
              ...weaponOptions,
              ...specialistEquipmentOptions,
            ].map(
              (item) => [
                normaliseDataName(
                  item.name,
                ),
                item,
              ],
            ),
          ).values(),
        )`

if (
  source.includes(
    oldSpecialistReturn,
  )
) {
  source =
    source.replace(
      oldSpecialistReturn,
      newSpecialistReturn,
    )

  console.log(
    '✓ Specialist picker deduplicated'
  )
}

/*
 * ------------------------------------------------------------
 * 6. Write
 * ------------------------------------------------------------
 */

await fs.writeFile(
  FILE,
  source,
  'utf8'
)

/*
 * ------------------------------------------------------------
 * 7. Static checks
 * ------------------------------------------------------------
 */

const amp =
  verifiedWeaponCompatibility[
    'AMP-9'
  ]

if (!amp) {
  throw new Error(
    'AMP-9 missing from verified compatibility file.'
  )
}

const ampMuzzles =
  (
    amp.attachments?.MUZZLE ||
    []
  ).map(
    (item) =>
      item.name,
  )

const forbiddenAmpMuzzles = [
  '12 Gauge Suppressor',
  'AR Multi-Caliber Suppressor',
  'GOL Multi-Caliber Suppressor',
]

const badAmp =
  forbiddenAmpMuzzles.filter(
    (name) =>
      ampMuzzles.includes(
        name,
      ),
  )

if (badAmp.length) {
  throw new Error(
    'Verified AMP-9 data itself is still wrong: ' +
    badAmp.join(', ')
  )
}

if (
  ampMuzzles.length !==
  6
) {
  throw new Error(
    'AMP-9 should currently expose 6 verified muzzles, found ' +
    ampMuzzles.length
  )
}

const verifiedWeapons =
  Object.keys(
    verifiedWeaponCompatibility,
  )

console.log('')
console.log('===== VALIDATION =====')
console.log('')
console.log(
  'Verified weapons:',
  verifiedWeapons.length,
)

console.log(
  'Compatibility source:',
  verifiedCompatibilityMeta?.source ||
  'verified database',
)

console.log('')
console.log('AMP-9 verified muzzles:')

ampMuzzles.forEach(
  (name) =>
    console.log(
      '  ✓',
      name,
    )
)

console.log('')
console.log(
  'Forbidden AMP-9 muzzles:',
  badAmp.length,
)

console.log('')
console.log(
  'LoadoutsPage rewritten successfully.'
)

console.log('')
console.log(
  'Backup:',
  BACKUP,
)

console.log('')

