import fs from 'node:fs/promises'
import path from 'node:path'

import {
  weapons,
} from '../src/data/wardogsLoadoutData.js'

import {
  packableItems,
} from '../src/data/wardogsPackableData.js'

const root =
  process.cwd()

const outputFile =
  path.join(
    root,
    'src/data/wardogsZoneAttachments.js',
  )

const auditFile =
  path.join(
    root,
    'src/data/wardogsZoneCompatibilityAudit.json',
  )

const assetFolder =
  path.join(
    root,
    'public/wardogs/items',
  )

const LIST_URL =
  'https://wardogs.zone/database/attachments'

const WEAPONS_URL =
  'https://wardogs.zone/database/weapons'

const USER_AGENT =
  'RallyStack-Community-Loadout-Builder/4.0'

const TYPES = [
  'Canted Sight',
  'Pistol Grip',
  'Dust Cover',
  'Underbarrel',
  'Handguard',
  'Magazine',
  'Muzzle',
  'Sight',
  'Stock',
  'Barrel',
  'Trigger',
  'Grip',
  'Other',
]

function plainText(
  html,
) {

  return String(
    html ||
    '',
  )
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ' ',
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ' ',
    )
    .replace(
      /<[^>]+>/g,
      ' ',
    )
    .replace(
      /&nbsp;/gi,
      ' ',
    )
    .replace(
      /&amp;/gi,
      '&',
    )
    .replace(
      /&#39;/gi,
      "'",
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
}

function safeSlug(
  value,
) {

  return String(
    value ||
    '',
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '',
    )
}

function safeNumber(
  value,
) {

  const number =
    Number(
      String(
        value ??
        '',
      )
        .replaceAll(
          ',',
          '',
        ),
    )

  return Number.isFinite(
    number,
  )
    ? number
    : null
}

async function fetchText(
  url,
) {

  const response =
    await fetch(
      url,
      {
        headers: {
          'user-agent':
            USER_AGENT,
        },
      },
    )

  if (
    !response.ok
  ) {

    throw new Error(
      `${response.status} ${url}`,
    )
  }

  return response.text()
}

async function downloadFile(
  url,
  output,
) {

  const response =
    await fetch(
      url,
      {
        headers: {
          'user-agent':
            USER_AGENT,
        },
      },
    )

  if (
    !response.ok
  ) {

    throw new Error(
      `${response.status} ${url}`,
    )
  }

  const bytes =
    Buffer.from(
      await response.arrayBuffer(),
    )

  if (
    bytes.length <
    500
  ) {

    throw new Error(
      'Image response too small.',
    )
  }

  await fs.writeFile(
    output,
    bytes,
  )
}

function extractImage(
  html,
) {

  const og =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    )

  if (
    og?.[1]
  ) {
    return og[1]
  }

  const img =
    html.match(
      /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
    )

  return img?.[1] ||
    null
}

function typeFromText(
  text,
) {

  return TYPES.find(
    (type) =>
      new RegExp(
        `\\b${type.replace(
          ' ',
          '\\s+',
        )}\\b`,
        'i',
      ).test(
        text,
      ),
  ) ||
    null
}

function normaliseType(
  type,
) {

  const map = {
    Muzzle:
      'MUZZLE',
    Sight:
      'OPTIC',
    Magazine:
      'MAGAZINE',
    Handguard:
      'HANDGUARD',
    Stock:
      'STOCK',
    Underbarrel:
      'FOREGRIP',
    Barrel:
      'BARREL',
    Grip:
      'GRIP',
    'Dust Cover':
      'DUST_COVER',
    Trigger:
      'TRIGGER',
    'Pistol Grip':
      'PISTOL_GRIP',
    'Canted Sight':
      'CANTED_SIGHT',
    Other:
      'OTHER',
  }

  return map[type] ||
    'OTHER'
}

function parseSignedPercent(
  text,
  label,
) {

  const match =
    text.match(
      new RegExp(
        `${label}\\s*([+-]?[\\d.]+)%`,
        'i',
      ),
    )

  return match?.[1]
    ? safeNumber(
        match[1],
      )
    : null
}

function parseSignedSeconds(
  text,
  label,
) {

  const match =
    text.match(
      new RegExp(
        `${label}\\s*([+-]?[\\d.]+)\\s*s`,
        'i',
      ),
    )

  return match?.[1]
    ? safeNumber(
        match[1],
      )
    : null
}

function normaliseName(
  value,
) {

  return String(
    value ||
    '',
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '',
    )
}

function databaseLinks(
  html,
) {

  return Array.from(
    String(
      html ||
      '',
    ).matchAll(
      /<a\b[^>]*href=["'](?<href>\/database\/(?!compare(?:\?|\/)|attachments(?:\?|["'])|weapons(?:\?|["'])|skins(?:\?|["']))[^"'?#]+)["'][^>]*>(?<body>[\s\S]*?)<\/a>/gi,
    ),
  ).map(
    (match) => ({
      href:
        match.groups?.href ||
        '',
      text:
        plainText(
          match.groups?.body ||
          '',
        ),
    }),
  )
}

async function mapLimit(
  values,
  limit,
  worker,
) {

  const results =
    new Array(
      values.length,
    )

  let cursor = 0

  async function run() {

    while (
      true
    ) {

      const index =
        cursor

      cursor += 1

      if (
        index >=
        values.length
      ) {
        return
      }

      results[index] =
        await worker(
          values[index],
          index,
        )
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            limit,
            values.length,
          ),
      },
      () =>
        run(),
    ),
  )

  return results
}

await fs.mkdir(
  assetFolder,
  {
    recursive:
      true,
  },
)

console.log(
  'Reading complete Wardogs Zone attachment catalogue...',
)

const listing =
  await fetchText(
    LIST_URL,
  )

const declaredAttachmentCount =
  Number(
    plainText(
      listing,
    ).match(
      /(\d+)\s+attachments\s+feed\s+the\s+gunsmith/i,
    )?.[1] ||
    0,
  )

console.log(
  `Source declares ${declaredAttachmentCount || 'unknown'} current attachments`,
)

const attachmentCandidateMap =
  new Map()

databaseLinks(
  listing,
).forEach(
  (candidate) => {

    const rawType =
      typeFromText(
        candidate.text,
      )

    if (
      !rawType
    ) {
      return
    }

    attachmentCandidateMap.set(
      candidate.href,
      {
        ...candidate,
        rawType,
      },
    )
  },
)

const attachmentCandidates =
  Array.from(
    attachmentCandidateMap.values(),
  )

console.log(
  `Attachment records discovered: ${attachmentCandidates.length}`,
)

if (
  declaredAttachmentCount &&
  attachmentCandidates.length !==
    declaredAttachmentCount
) {

  throw new Error(
    `Wardogs Zone declares ${declaredAttachmentCount} attachments but ${attachmentCandidates.length} classified records were discovered. Existing generated data was not touched.`,
  )
}

if (
  !declaredAttachmentCount &&
  attachmentCandidates.length <
    150
) {

  throw new Error(
    'Wardogs Zone returned too few classified attachments. Existing generated data was not touched.',
  )
}

console.log('')
console.log(
  'Reading authoritative weapon page references...',
)

const weaponListing =
  await fetchText(
    WEAPONS_URL,
  )

const declaredWeaponCount =
  Number(
    plainText(
      weaponListing,
    ).match(
      /(\d+)\s+weapons\s+across/i,
    )?.[1] ||
    0,
  )

if (
  declaredWeaponCount &&
  weapons.length !==
    declaredWeaponCount
) {

  throw new Error(
    `Current WARDOGS source declares ${declaredWeaponCount} weapons but RallyStack has ${weapons.length}. Update the weapon catalogue before writing compatibility data.`,
  )
}

const weaponListingLinks =
  databaseLinks(
    weaponListing,
  )

const weaponPageById =
  new Map()

const weaponIdByHref =
  new Map()

for (
  const weapon of
  weapons
) {

  const needle =
    normaliseName(
      weapon.name,
    )

  const match =
    weaponListingLinks.find(
      (entry) => {

        const haystack =
          normaliseName(
            entry.text,
          )

        return (
          haystack ===
            needle ||
          haystack.startsWith(
            needle,
          )
        )
      },
    )

  if (
    !match
  ) {
    continue
  }

  weaponPageById.set(
    weapon.id,
    match.href,
  )

  weaponIdByHref.set(
    match.href,
    weapon.id,
  )
}

console.log(
  `Local weapons matched to current Zone pages: ${weaponPageById.size}/${weapons.length}`,
)

if (
  weaponPageById.size !==
  weapons.length
) {

  const missing =
    weapons
      .filter(
        (weapon) =>
          !weaponPageById.has(
            weapon.id,
          ),
      )
      .map(
        (weapon) =>
          weapon.name,
      )

  throw new Error(
    `Current WARDOGS weapon-page match incomplete: ${weaponPageById.size}/${weapons.length}. Missing: ${missing.join(', ')}. Existing generated data was not touched.`,
  )
}

const rawItems =
  await mapLimit(
    attachmentCandidates,
    8,
    async (
      candidate,
      index,
    ) => {

      const href =
        candidate.href

      const url =
        `https://wardogs.zone${href}`

      try {

        const html =
          await fetchText(
            url,
          )

        const text =
          plainText(
            html,
          )

        const h1 =
          html.match(
            /<h1[^>]*>([\s\S]*?)<\/h1>/i,
          )

        const name =
          h1
            ? plainText(
                h1[1],
              )
            : null

        const rawType =
          candidate.rawType

        if (
          !name ||
          !rawType
        ) {
          return null
        }

        const priceMatch =
          text.match(
            /Economy\s*\$([\d,]+)\s*Cost/i,
          ) ||
          text.match(
            /Cost\s*\$([\d,]+)/i,
          )

        const imageUrl =
          extractImage(
            html,
          )

        const id =
          `zone-attachment-${safeSlug(
            name,
          )}`

        let image =
          null

        if (
          imageUrl
        ) {

          const resolved =
            imageUrl.startsWith(
              'http',
            )
              ? imageUrl
              : `https://wardogs.zone${imageUrl}`

          const fileName =
            `${id}.webp`

          try {

            await downloadFile(
              resolved,
              path.join(
                assetFolder,
                fileName,
              ),
            )

            image =
              `/wardogs/items/${fileName}`
          }
          catch {
            image =
              null
          }
        }

        const zoom =
          text.match(
            /ZOOM\s*([\d.]+)x/i,
          )

        const capacity =
          text.match(
            /Capacity\s*(\d+)\s*rounds/i,
          )

        const zeroing =
          text.match(
            /ZERO\s*(\d+)-(\d+)\s*m/i,
          )

        const compatibleWeapons =
          Array.from(
            new Set(
              databaseLinks(
                html,
              )
                .map(
                  (entry) =>
                    weaponIdByHref.get(
                      entry.href,
                    ),
                )
                .filter(Boolean),
            ),
          )

        if (
          (
            index +
            1
          ) %
            20 ===
          0
        ) {

          console.log(
            `Processed ${index + 1}/${attachmentCandidates.length}`,
          )
        }

        return {
          id,
          name,
          type:
            normaliseType(
              rawType,
            ),
          sourceType:
            rawType,
          price:
            priceMatch?.[1]
              ? safeNumber(
                  priceMatch[1],
                )
              : null,
          weight:
            safeNumber(
              text.match(
                /Weight\s*([\d.]+)\s*kg/i,
              )?.[1],
            ),
          modifiers: {
            verticalRecoilPct:
              parseSignedPercent(
                text,
                'V REC',
              ),
            horizontalRecoilPct:
              parseSignedPercent(
                text,
                'H REC',
              ),
            spreadPct:
              parseSignedPercent(
                text,
                'SPREAD',
              ),
            adsPct:
              parseSignedPercent(
                text,
                'ADS',
              ),
            adsSeconds:
              parseSignedSeconds(
                text,
                'ADS',
              ),
            zoom:
              zoom?.[1]
                ? safeNumber(
                    zoom[1],
                  )
                : null,
            capacity:
              capacity?.[1]
                ? Number(
                    capacity[1],
                  )
                : null,
            zeroMin:
              zeroing?.[1]
                ? Number(
                    zeroing[1],
                  )
                : null,
            zeroMax:
              zeroing?.[2]
                ? Number(
                    zeroing[2],
                  )
                : null,
          },
          compatibleWeapons,
          sourceUrl:
            url,
          image,
        }
      }
      catch {
        return null
      }
    },
  )

const items =
  rawItems.filter(Boolean)

if (
  declaredAttachmentCount &&
  items.length !==
    declaredAttachmentCount
) {

  throw new Error(
    `Only ${items.length}/${declaredAttachmentCount} current attachments parsed. Existing generated data was not touched.`,
  )
}

if (
  !declaredAttachmentCount &&
  items.length <
    150
) {

  throw new Error(
    `Only ${items.length} attachments parsed. Existing generated data was not touched.`,
  )
}

console.log('')
console.log(
  'Reading exact gunsmith slots, magazines and live weapon stats...',
)

const zoneWeaponData = {}

const packableMagazines =
  packableItems.filter(
    (item) =>
      item.packCategory ===
      'MAGAZINES',
  )

const loadoutSlotLabels = [
  [
    'CANTED_SIGHT',
    /Canted\s+Sight/i,
  ],
  [
    'PISTOL_GRIP',
    /Pistol\s+Grip/i,
  ],
  [
    'DUST_COVER',
    /Dust\s+Cover/i,
  ],
  [
    'UNDERBARREL',
    /Underbarrel/i,
  ],
  [
    'HANDGUARD',
    /Handguard/i,
  ],
  [
    'MAGAZINE',
    /Magazine/i,
  ],
  [
    'MUZZLE',
    /Muzzle|Suppressor/i,
  ],
  [
    'OPTIC',
    /Sight|Optic/i,
  ],
  [
    'STOCK',
    /Stock/i,
  ],
  [
    'BARREL',
    /Barrel/i,
  ],
  [
    'TRIGGER',
    /Trigger/i,
  ],
  [
    'GRIP',
    /(?:^|\s)Grip(?:\s|$)/i,
  ],
]

for (
  const weapon of
  weapons
) {

  const href =
    weaponPageById.get(
      weapon.id,
    )

  if (!href) {
    continue
  }

  let html =
    ''

  try {

    html =
      await fetchText(
        `https://wardogs.zone${href}`,
      )
  }
  catch {
    continue
  }

  const text =
    plainText(
      html,
    )

  const loadout =
    text.match(
      /Loadout\s+\d+\s+SLOTS[\s\S]*?(?=Skins & Cosmetics|Compatible Ammunition|Magazines\s+\d+|Other [A-Za-z ]+\s+\d+|Reference)/i,
    )?.[0] ||
    ''

  const pageLinks =
    databaseLinks(
      html,
    )

  const compatibleMagazines =
    Array.from(
      new Set(
        packableMagazines
          .filter(
            (magazine) => {

              const needle =
                normaliseName(
                  magazine.name,
                )

              return pageLinks.some(
                (entry) =>
                  normaliseName(
                    entry.text,
                  ).includes(
                    needle,
                  ),
              )
            },
          )
          .map(
            (magazine) =>
              magazine.name,
          ),
      ),
    )

  const attachmentSlots =
    loadoutSlotLabels
      .filter(
        ([, matcher]) =>
          matcher.test(
            loadout,
          ),
      )
      .map(
        ([slot]) =>
          slot,
      )

  if (
    compatibleMagazines.length >
      0 &&
    !attachmentSlots.includes(
      'MAGAZINE',
    )
  ) {

    attachmentSlots.push(
      'MAGAZINE',
    )
  }

  const baseDamage =
    safeNumber(
      text.match(
        /point blank\s*·\s*([\d.]+)\s*base damage/i,
      )?.[1],
    )

  zoneWeaponData[
    weapon.id
  ] = {
    id:
      weapon.id,
    name:
      weapon.name,
    sourceUrl:
      `https://wardogs.zone${href}`,
    attachmentSlots,
    compatibleMagazines,
    price:
      safeNumber(
        text.match(
          /Economy\s*\$([\d,]+)\s*Cost/i,
        )?.[1],
      ),
    weight:
      safeNumber(
        text.match(
          /Weight\s*([\d.]+)\s*kg/i,
        )?.[1],
      ),
    rpm:
      safeNumber(
        text.match(
          /Fire Rate\s*([\d.]+)\s*RPM/i,
        )?.[1],
      ),
    muzzleVelocity:
      safeNumber(
        text.match(
          /Muzzle Velocity\s*([\d.]+)\s*m\/s/i,
        )?.[1],
      ),
    effectiveRange:
      safeNumber(
        text.match(
          /Effective Range\s*([\d.]+)\s*m/i,
        )?.[1],
      ),
    baseSpread:
      safeNumber(
        text.match(
          /Base Spread\s*([\d.]+)°/i,
        )?.[1],
      ),
    damage:
      baseDamage,
    adsTime:
      safeNumber(
        loadout.match(
          /ADS\s*([\d.]+)s/i,
        )?.[1],
      ),
    adsZoom:
      safeNumber(
        loadout.match(
          /Zoom\s*([\d.]+)x/i,
        )?.[1],
      ),
    verticalRecoil:
      safeNumber(
        loadout.match(
          /V Recoil\s*([\d.]+)%/i,
        )?.[1],
      ),
    horizontalRecoil:
      safeNumber(
        loadout.match(
          /H Recoil\s*([\d.]+)%/i,
        )?.[1],
      ),
    spreadPct:
      safeNumber(
        loadout.match(
          /Spread\s*([\d.]+)%/i,
        )?.[1],
      ),
  }
}

const slotForAttachmentType = {
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

const rejectedFits = []

for (
  const item of
  items
) {

  const requiredSlot =
    slotForAttachmentType[
      item.type
    ]

  /*
   * "Other" is deliberately not treated as an
   * equippable slot. Wardogs Zone includes internal
   * component parts in its 206 attachment records,
   * but the game's actual loadout wells decide what
   * the player can select.
   */
  if (
    !requiredSlot
  ) {

    if (
      item.compatibleWeapons
        .length >
      0
    ) {

      item.compatibleWeapons.forEach(
        (weaponId) =>
          rejectedFits.push({
            item:
              item.name,
            type:
              item.type,
            weaponId,
            reason:
              'No selectable gunsmith slot for attachment type',
          }),
      )
    }

    item.compatibleWeapons =
      []

    continue
  }

  const verifiedFits = []

  item.compatibleWeapons.forEach(
    (weaponId) => {

      const weaponData =
        zoneWeaponData[
          weaponId
        ]

      if (!weaponData) {

        rejectedFits.push({
          item:
            item.name,
          type:
            item.type,
          weaponId,
          reason:
            'Weapon page was not parsed',
        })

        return
      }

      if (
        item.type ===
        'MAGAZINE'
      ) {

        const exactMagazineMatch =
          (
            weaponData
              .compatibleMagazines ||
            []
          ).includes(
            item.name,
          )

        if (
          !exactMagazineMatch
        ) {

          rejectedFits.push({
            item:
              item.name,
            type:
              item.type,
            weaponId,
            reason:
              'Magazine is not listed by the weapon page',
          })

          return
        }
      }
      else if (
        !(
          weaponData
            .attachmentSlots ||
          []
        ).includes(
          requiredSlot,
        )
      ) {

        rejectedFits.push({
          item:
            item.name,
          type:
            item.type,
          weaponId,
          reason:
            `Weapon does not expose ${requiredSlot} in its gunsmith`,
        })

        return
      }

      verifiedFits.push(
        weaponId,
      )
    },
  )

  item.compatibleWeapons =
    verifiedFits
}

const compatibilityCount =
  items.filter(
    (item) =>
      item.compatibleWeapons
        .length >
      0,
  ).length

const incompatibleBipodSmgPairs =
  items
    .filter(
      (item) =>
        /\bBipod\b/i.test(
          item.name,
        ),
    )
    .flatMap(
      (item) =>
        item.compatibleWeapons
          .map(
            (weaponId) => ({
              item:
                item.name,
              weapon:
                weapons.find(
                  (weapon) =>
                    weapon.id ===
                    weaponId,
                ),
            }),
          )
          .filter(
            (entry) =>
              entry.weapon
                ?.category ===
              'SMG',
          ),
    )

console.log(
  `Attachments with authoritative weapon fits: ${compatibilityCount}/${items.length}`,
)

if (
  incompatibleBipodSmgPairs.length >
  0
) {

  console.log(
    'NOTE: Current source explicitly links these bipod/SMG pairs:',
  )

  incompatibleBipodSmgPairs.forEach(
    (entry) =>
      console.log(
        `  ${entry.item} -> ${entry.weapon.name}`,
      ),
  )
}

const attachmentTypeCounts =
  Object.fromEntries(
    Array.from(
      new Set(
        items.map(
          (item) =>
            item.type,
        ),
      ),
    )
      .sort()
      .map(
        (type) => [
          type,
          items.filter(
            (item) =>
              item.type ===
              type,
          ).length,
        ],
      ),
  )

const bipodSmgPairs =
  items
    .filter(
      (item) =>
        /\bBipod\b/i.test(
          item.name,
        ),
    )
    .flatMap(
      (item) =>
        item.compatibleWeapons
          .map(
            (weaponId) => ({
              attachment:
                item.name,
              weaponId,
              weapon:
                weapons.find(
                  (weapon) =>
                    weapon.id ===
                    weaponId,
                )?.name ||
                weaponId,
            }),
          )
          .filter(
            (entry) =>
              weapons.find(
                (weapon) =>
                  weapon.id ===
                  entry.weaponId,
              )?.category ===
              'SMG',
          ),
    )

const compatibilityAudit = {
  generatedAt:
    new Date()
      .toISOString(),
  source:
    'Wardogs Zone gunsmith / item-page fit graph',
  attachmentCount:
    items.length,
  declaredAttachmentCount,
  attachmentTypeCounts,
  localWeapons:
    weapons.length,
  declaredWeaponCount,
  weaponPagesMatched:
    weaponPageById.size,
  weaponPagesParsed:
    Object.keys(
      zoneWeaponData,
    ).length,
  attachmentsWithVerifiedFits:
    compatibilityCount,
  attachmentsWithoutSelectableFits:
    items
      .filter(
        (item) =>
          item.compatibleWeapons
            .length ===
          0,
      )
      .map(
        (item) => ({
          name:
            item.name,
          type:
            item.type,
          sourceUrl:
            item.sourceUrl,
        }),
      ),
  rejectedFits,
  bipodSmgPairs,
  weapons:
    Object.fromEntries(
      weapons.map(
        (weapon) => {

          const data =
            zoneWeaponData[
              weapon.id
            ] ||
            null

          return [
            weapon.id,
            {
              name:
                weapon.name,
              sourceUrl:
                data?.sourceUrl ||
                null,
              attachmentSlots:
                data
                  ?.attachmentSlots ||
                [],
              magazines:
                data
                  ?.compatibleMagazines ||
                [],
              selectableAttachments:
                items
                  .filter(
                    (item) =>
                      item
                        .compatibleWeapons
                        .includes(
                          weapon.id,
                        ),
                  )
                  .map(
                    (item) => ({
                      name:
                        item.name,
                      type:
                        item.type,
                    }),
                  ),
            },
          ]
        },
      ),
    ),
}

if (
  bipodSmgPairs.length >
  0
) {

  console.log('')
  console.log(
    'WARNING: source-verified bipod/SMG fit(s) detected:',
  )

  bipodSmgPairs.forEach(
    (entry) =>
      console.log(
        `  ${entry.attachment} -> ${entry.weapon}`,
      ),
  )
}

const output =
  `/*
 * Auto-generated by:
 *   node scripts/sync-wardogs-zone-attachments.mjs
 *
 * Source: Wardogs Zone.
 */

export const zoneAttachmentMeta = ${JSON.stringify(
    {
      syncedAt:
        new Date()
          .toISOString(),
      count:
        items.length,
      declaredCount:
        declaredAttachmentCount,
      source:
        'Wardogs Zone',
      compatibilitySource:
        'Attachment item-page weapon links',
      localWeaponsMatched:
        weaponPageById.size,
      attachmentsWithFits:
        compatibilityCount,
    },
    null,
    2,
  )}

export const zoneAttachmentItems = ${JSON.stringify(
    items,
    null,
    2,
  )}

export const zoneWeaponData = ${JSON.stringify(
    zoneWeaponData,
    null,
    2,
  )}
`

await fs.writeFile(
  outputFile,
  output,
  'utf8',
)

await fs.writeFile(
  auditFile,
  JSON.stringify(
    compatibilityAudit,
    null,
    2,
  ),
  'utf8',
)

console.log('')
console.log(
  '========================================',
)
console.log(
  'WARDOGS ZONE ATTACHMENTS SYNCED',
)
console.log(
  '========================================',
)
console.log(
  `ATTACHMENTS     ${items.length}`,
)
console.log(
  `WITH IMAGES     ${items.filter((item) => item.image).length}`,
)
console.log(
  `WITH PRICE      ${items.filter((item) => item.price !== null).length}`,
)
console.log(
  `WITH MODIFIERS  ${items.filter((item) => Object.values(item.modifiers).some((value) => value !== null)).length}`,
)
console.log(
  `WEAPON STATS    ${Object.keys(zoneWeaponData).length}/${weapons.length}`,
)
console.log(
  `WITH FITS       ${compatibilityCount}/${items.length}`,
)
console.log(
  `WEAPON PAGES    ${weaponPageById.size}/${weapons.length}`,
)
console.log(
  `REJECTED FITS   ${rejectedFits.length}`,
)
console.log(
  `BIPOD -> SMG    ${bipodSmgPairs.length}`,
)
