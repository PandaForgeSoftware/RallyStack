import fs from 'node:fs/promises'
import path from 'node:path'

import {
  weapons,
} from '../src/data/wardogsLoadoutData.js'

const root =
  process.cwd()

const outputFile =
  path.join(
    root,
    'src/data/wardogsZoneAttachments.js',
  )

const assetFolder =
  path.join(
    root,
    'public/wardogs/items',
  )

const LIST_URL =
  'https://wardogs.zone/database/attachments'

const USER_AGENT =
  'RallyStack-Community-Loadout-Builder/4.0'

const TYPES = [
  'Muzzle',
  'Sight',
  'Magazine',
  'Handguard',
  'Stock',
  'Underbarrel',
  'Barrel',
  'Grip',
  'Dust Cover',
  'Trigger',
  'Pistol Grip',
  'Canted Sight',
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

const hrefs =
  Array.from(
    new Set(
      Array.from(
        listing.matchAll(
          /href=["'](\/database\/(?!attachments(?:\?|["']))[^"'?#]+)["']/gi,
        ),
      ).map(
        (match) =>
          match[1],
      ),
    ),
  )

console.log(
  `Attachment links discovered: ${hrefs.length}`,
)

if (
  hrefs.length <
  150
) {

  throw new Error(
    'Wardogs Zone attachment discovery returned too few records. Existing generated data was not touched.',
  )
}

const rawItems =
  await mapLimit(
    hrefs,
    8,
    async (
      href,
      index,
    ) => {

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
          typeFromText(
            text,
          )

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

        if (
          (
            index +
            1
          ) %
            20 ===
          0
        ) {

          console.log(
            `Processed ${index + 1}/${hrefs.length}`,
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
          compatibleWeapons: [],
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
  items.length <
  150
) {

  throw new Error(
    `Only ${items.length} complete attachments parsed. Existing generated data was not touched.`,
  )
}

console.log('')
console.log(
  'Reading weapon compatibility and live handling stats...',
)

const zoneWeaponData = {}

for (
  const weapon of
  weapons
) {

  const candidates = [
    weapon.id,
    safeSlug(
      weapon.name,
    ),
    safeSlug(
      weapon.name,
    ).replaceAll(
      '-',
      '',
    ),
  ]

  let text =
    ''

  for (
    const slug of
    Array.from(
      new Set(
        candidates,
      ),
    )
  ) {

    try {

      text =
        plainText(
          await fetchText(
            `https://wardogs.zone/database/${slug}`,
          ),
        )

      if (
        text.includes(
          weapon.name,
        )
      ) {
        break
      }
    }
    catch {
      text =
        ''
    }
  }

  if (!text) {
    continue
  }

  const loadout =
    text.match(
      /Loadout\s+\d+\s+SLOTS[\s\S]*?(?=Skins & Cosmetics|Compatible Ammunition|Other [A-Za-z ]+\s+\d+|Reference)/i,
    )?.[0] ||
    text

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

  for (
    const item of
    items
  ) {

    if (
      text
        .toLowerCase()
        .includes(
          item.name
            .toLowerCase(),
        )
    ) {

      item.compatibleWeapons.push(
        weapon.id,
      )
    }
  }
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
      source:
        'Wardogs Zone',
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
