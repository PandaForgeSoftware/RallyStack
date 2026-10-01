import fs from 'node:fs/promises'
import path from 'node:path'

const root =
  process.cwd()

const outputFile =
  path.join(
    root,
    'src/data/wardogsZoneEquipment.js',
  )

const auditFile =
  path.join(
    root,
    'src/data/wardogsZoneEquipmentAudit.json',
  )

const assetFolder =
  path.join(
    root,
    'public/wardogs/items',
  )

const LIST_URL =
  'https://wardogs.zone/database/equipment'

const SITEMAP_URL =
  'https://wardogs.zone/sitemap.xml'

const USER_AGENT =
  'RallyStack-Community-Loadout-Builder/5.0'

const CATEGORIES = [
  'Armor',
  'Storage',
  'Throwables',
  'Explosives',
  'Medical',
  'Utility',
  'Supplies',
  'Deployables',
  'Melee',
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

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ''
  ) {
    return null
  }

  const number =
    Number(
      String(
        value,
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

  return (
    html.match(
      /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
    )?.[1] ||
    null
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
      /<a\b[^>]*href=["'](?<href>\/database\/(?!compare(?:\?|\/)|equipment(?:\?|["'])|weapons(?:\?|["'])|attachments(?:\?|["'])|ammo(?:\?|["'])|vehicles(?:\?|["'])|skins(?:\?|["']))[^"'?#]+)["'][^>]*>(?<body>[\s\S]*?)<\/a>/gi,
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

function categoryFromText(
  text,
) {

  return (
    CATEGORIES.find(
      (category) =>
        new RegExp(
          `\\b${category}\\b`,
          'i',
        ).test(
          text,
        ),
    ) ||
    null
  )
}

function parseSlot(
  text,
) {

  const match =
    text.match(
      /\bSlot\s*(Primary|Secondary|Sidearm|Specialist|Helmet|Armor|Armour|Vest|Tac[- ]?Vest|Tactical\s*Vest|Backpack|Traversal)\b/i,
    )

  if (!match) {
    return null
  }

  const value =
    match[1]
      .toLowerCase()
      .replace(
        /[- ]/g,
        '',
      )

  const map = {
    primary:
      'PRIMARY',
    secondary:
      'SIDEARM',
    sidearm:
      'SIDEARM',
    specialist:
      'SPECIALIST',
    helmet:
      'HELMET',
    armor:
      'ARMOR',
    armour:
      'ARMOR',
    vest:
      'VEST',
    tacvest:
      'VEST',
    tacticalvest:
      'VEST',
    backpack:
      'BACKPACK',
    traversal:
      'TRAVERSAL',
  }

  return map[
    value
  ] ||
    null
}

function fallbackSlotFromName(
  name,
) {

  if (
    /\bHelmet\b/i.test(
      name,
    )
  ) {
    return 'HELMET'
  }

  if (
    /\bArmor\b|\bArmour\b/i.test(
      name,
    )
  ) {
    return 'ARMOR'
  }

  if (
    /Tac\s*Vest/i.test(
      name,
    )
  ) {
    return 'VEST'
  }

  if (
    /Backpack|^Pouch$/i.test(
      name,
    )
  ) {
    return 'BACKPACK'
  }

  if (
    /Parachute/i.test(
      name,
    )
  ) {
    return 'TRAVERSAL'
  }

  return null
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
  'Reading complete Wardogs Zone equipment catalogue...',
)

const listing =
  await fetchText(
    LIST_URL,
  )

const listingText =
  plainText(
    listing,
  )

const declaredCount =
  Number(
    listingText.match(
      /(?:Equipment\s+|All\s+)(\d+)\b/i,
    )?.[1] ||
    listingText.match(
      /(\d+)\s*\/\s*\1\s*RECORDS/i,
    )?.[1] ||
    0,
  )

const candidateMap =
  new Map()

function addCandidates(
  html,
  fallbackCategory = 'Other',
) {

  databaseLinks(
    html,
  ).forEach(
    (entry) => {

      candidateMap.set(
        entry.href,
        {
          ...entry,
          category:
            categoryFromText(
              entry.text,
            ) ||
            fallbackCategory,
        },
      )
    },
  )
}

addCandidates(
  listing,
)

console.log(
  'Reading equipment category pages...',
)

for (
  const category of
  CATEGORIES
) {

  const categoryHtml =
    await fetchText(
      `${LIST_URL}?c=${encodeURIComponent(
        category,
      )}`,
    )

  addCandidates(
    categoryHtml,
    category,
  )
}

console.log(
  'Reading Wardogs Zone sitemap for hidden equipment records...',
)

const sitemap =
  await fetchText(
    SITEMAP_URL,
  )

const sitemapRefs =
  Array.from(
    new Set(
      Array.from(
        sitemap.matchAll(
          /https:\/\/wardogs\.zone\/database\/[a-z0-9_-]+/gi,
        ),
      ).map(
        (match) =>
          match[0]
            .replace(
              'https://wardogs.zone',
              '',
            ),
      ),
    ),
  ).filter(
    (href) =>
      ![
        '/database/weapons',
        '/database/vehicles',
        '/database/attachments',
        '/database/ammo',
        '/database/equipment',
        '/database/compare',
        '/database/skins',
      ].includes(
        href,
      ),
  )

console.log(
  `English database detail refs in sitemap: ${sitemapRefs.length}`,
)

const known =
  new Set(
    candidateMap.keys(),
  )

const hiddenRefs =
  sitemapRefs.filter(
    (href) =>
      !known.has(
        href,
      ),
  )

console.log(
  `Unclassified detail refs to inspect: ${hiddenRefs.length}`,
)

const hiddenResults =
  await mapLimit(
    hiddenRefs,
    12,
    async (
      href,
    ) => {

      try {

        const html =
          await fetchText(
            `https://wardogs.zone${href}`,
          )

        const text =
          plainText(
            html,
          )

        const name =
          plainText(
            html.match(
              /<h1[^>]*>([\s\S]*?)<\/h1>/i,
            )?.[1] ||
            '',
          )

        if (!name) {
          return null
        }

        const parsedSlot =
          parseSlot(
            text,
          ) ||
          fallbackSlotFromName(
            name,
          )

        const pageCategory =
          categoryFromText(
            text,
          )

        const equipmentSignal =
          parsedSlot ||
          /(?:Equipment|Armor|Armour|Storage|Throwable|Explosive|Medical|Utility|Suppl(?:y|ies)|Deployable|Melee|Backpack|Vest|Helmet|Parachute|Repair Tool|Range Finder|Binoculars|Monocular|Hammer|Wrench|Drill)/i.test(
            `${pageCategory || ''} ${text}`,
          )

        if (
          !equipmentSignal
        ) {
          return null
        }

        return {
          href,
          text:
            name,
          category:
            pageCategory ||
            'Other',
          html,
        }
      }
      catch {
        return null
      }
    },
  )

hiddenResults
  .filter(Boolean)
  .forEach(
    (entry) => {

      candidateMap.set(
        entry.href,
        entry,
      )
    },
  )

const candidates =
  Array.from(
    candidateMap.values(),
  )

console.log(
  `Source declares ${declaredCount || 'unknown'} equipment records`,
)
console.log(
  `Equipment records discovered across all categories: ${candidates.length}`,
)

if (
  declaredCount &&
  candidates.length <
    declaredCount
) {

  throw new Error(
    `Equipment catalogue incomplete before parsing: source declares ${declaredCount}, discovered only ${candidates.length}. Existing generated data was not touched.`,
  )
}

if (
  !declaredCount &&
  candidates.length <
    90
) {

  throw new Error(
    'Equipment catalogue returned too few records. Existing generated data was not touched.',
  )
}

const results =
  await mapLimit(
    candidates,
    8,
    async (
      candidate,
      index,
    ) => {

      const sourceUrl =
        `https://wardogs.zone${candidate.href}`

      try {

        const html =
          candidate.html ||
          await fetchText(
            sourceUrl,
          )

        const text =
          plainText(
            html,
          )

        const name =
          plainText(
            html.match(
              /<h1[^>]*>([\s\S]*?)<\/h1>/i,
            )?.[1] ||
            '',
          )

        if (!name) {
          return null
        }

        const parsedSlot =
          parseSlot(
            text,
          ) ||
          fallbackSlotFromName(
            name,
          )

        const pageCategory =
          categoryFromText(
            text,
          ) ||
          candidate.category

        const equipmentSignal =
          parsedSlot ||
          /(?:Equipment|Armor|Armour|Storage|Throwable|Medical|Utility|Supply|Deployable|Melee|Backpack|Vest|Helmet|Parachute)/i.test(
            `${pageCategory} ${text}`,
          )

        if (
          !equipmentSignal
        ) {
          return null
        }

        const id =
          `zone-equipment-${safeSlug(
            name,
          )}`

        const economy =
          text.match(
            /Economy\s*\$([\d,]+)\s*Cost/i,
          ) ||
          text.match(
            /Cost\s*\$([\d,]+)/i,
          )

        const weight =
          safeNumber(
            text.match(
              /Weight\s*([\d.]+)\s*kg/i,
            )?.[1],
          )

        const protection =
          safeNumber(
            text.match(
              /Protection\s*([\d.]+)%/i,
            )?.[1],
          )

        const storage =
          text.match(
            /Storage\s*(\d+)\s*(?:×|x)\s*(\d+)/i,
          )

        const inventory =
          text.match(
            /Inventory\s*(\d+)\s*(?:×|x)\s*(\d+)/i,
          )

        const unlock =
          text.match(
            /Requirement\s*(Career|Wardog|Infantry|Medic|Recon|Support|Driver|Pilot)\s*(?:level|lvl\.?\s*)\s*(\d+)/i,
          )

        const unlockCost =
          safeNumber(
            text.match(
              /\$([\d,]+)\s*Unlock cost/i,
            )?.[1],
          )

        const imageUrl =
          extractImage(
            html,
          )

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

        if (
          (
            index +
            1
          ) %
            20 ===
          0
        ) {
          console.log(
            `Processed equipment ${index + 1}/${candidates.length}`,
          )
        }

        return {
          id,
          name,
          category:
            pageCategory.toUpperCase(),
          slot:
            parsedSlot,
          price:
            economy?.[1]
              ? safeNumber(
                  economy[1],
                )
              : null,
          weight,
          protection,
          storageColumns:
            storage
              ? Number(
                  storage[1],
                )
              : null,
          storageRows:
            storage
              ? Number(
                  storage[2],
                )
              : null,
          inventoryWidth:
            inventory
              ? Number(
                  inventory[1],
                )
              : null,
          inventoryHeight:
            inventory
              ? Number(
                  inventory[2],
                )
              : null,
          unlockTrack:
            unlock?.[1] ||
            null,
          unlockLevel:
            unlock?.[2]
              ? Number(
                  unlock[2],
                )
              : null,
          unlockCost,
          sourceUrl,
          image,
        }
      }
      catch (
        error
      ) {

        return {
          error:
            error.message,
          sourceUrl,
        }
      }
    },
  )

const itemMap =
  new Map()

results
  .filter(
    (item) =>
      item &&
      !item.error,
  )
  .forEach(
    (item) => {

      itemMap.set(
        item.sourceUrl,
        item,
      )
    },
  )

const items =
  Array.from(
    itemMap.values(),
  )

const failures =
  results.filter(
    (item) =>
      item?.error,
  )

if (
  declaredCount &&
  items.length !==
    declaredCount
) {

  throw new Error(
    `Only ${items.length}/${declaredCount} equipment records parsed. Existing generated data was not touched.`,
  )
}

const selectable =
  items.filter(
    (item) =>
      item.slot,
  )

const specialistItems =
  selectable.filter(
    (item) =>
      item.slot ===
      'SPECIALIST',
  )

if (
  specialistItems.length <
  8
) {

  throw new Error(
    `Only ${specialistItems.length} Specialist-slot equipment items were parsed. Existing generated data was not touched.`,
  )
}

const audit = {
  generatedAt:
    new Date()
      .toISOString(),
  declaredCount,
  count:
    items.length,
  selectableCount:
    selectable.length,
  categoryCounts:
    Object.fromEntries(
      CATEGORIES.map(
        (category) => [
          category.toUpperCase(),
          items.filter(
            (item) =>
              item.category ===
              category.toUpperCase(),
          ).length,
        ],
      ),
    ),
  slotCounts:
    Object.fromEntries(
      Array.from(
        new Set(
          selectable.map(
            (item) =>
              item.slot,
          ),
        ),
      )
        .sort()
        .map(
          (slot) => [
            slot,
            selectable.filter(
              (item) =>
                item.slot ===
                slot,
            ).length,
          ],
        ),
    ),
  missingPrice:
    items
      .filter(
        (item) =>
          item.price ===
          null,
      )
      .map(
        (item) =>
          item.name,
      ),
  missingWeight:
    items
      .filter(
        (item) =>
          item.weight ===
          null,
      )
      .map(
        (item) =>
          item.name,
      ),
  missingImage:
    items
      .filter(
        (item) =>
          !item.image,
      )
      .map(
        (item) =>
          item.name,
      ),
  failures,
}

const output =
  `/*
 * Auto-generated by:
 *   node scripts/sync-wardogs-zone-equipment.mjs
 *
 * Source: Wardogs Zone.
 * Unknown values remain null.
 */

export const zoneEquipmentMeta = ${JSON.stringify(
    {
      syncedAt:
        new Date()
          .toISOString(),
      count:
        items.length,
      declaredCount,
      selectableCount:
        selectable.length,
      specialistCount:
        specialistItems.length,
      source:
        'Wardogs Zone',
    },
    null,
    2,
  )}

export const zoneEquipmentItems = ${JSON.stringify(
    items,
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
    audit,
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
  'WARDOGS ZONE EQUIPMENT SYNCED',
)
console.log(
  '========================================',
)
console.log(
  `EQUIPMENT       ${items.length}`,
)
console.log(
  `SELECTABLE      ${selectable.length}`,
)
console.log(
  `SPECIALIST      ${specialistItems.length}`,
)
console.log(
  `MISSING PRICE   ${audit.missingPrice.length}`,
)
console.log(
  `MISSING WEIGHT  ${audit.missingWeight.length}`,
)
console.log(
  `MISSING IMAGE   ${audit.missingImage.length}`,
)
