import fs from 'node:fs/promises'
import path from 'node:path'

const root =
  process.cwd()

const dataFile =
  path.join(
    root,
    'src/data/wardogsPackableData.js',
  )

const auditFile =
  path.join(
    root,
    'src/data/wardogsPackableAudit.json',
  )

const imageMapFile =
  path.join(
    root,
    'src/data/wardogsItemImages.js',
  )

const assetFolder =
  path.join(
    root,
    'public/wardogs/items',
  )

const USER_AGENT =
  'RallyStack-Community-Loadout-Builder/2.0'

const WARDOGS_FIELD_MANUAL =
  'https://www.wardogs-companion.com/items/?group=gear&sort=category'

const sources = [
  {
    source:
      'medical',

    url:
      'https://wardogslab.com/en/database/category/medical',
  },

  {
    source:
      'throwables',

    url:
      'https://wardogslab.com/en/database/category/throwables',
  },

  {
    source:
      'equipment',

    url:
      'https://wardogslab.com/en/database/category/equipment',
  },

  {
    source:
      'ammunition',

    url:
      'https://wardogslab.com/en/database/category/ammunition',
  },

  {
    source:
      'attachments',

    url:
      'https://wardogslab.com/en/database/category/attachments',
  },
]

function decodeHtml(
  value,
) {

  return String(
    value ||
    '',
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
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#39;/gi,
      "'",
    )
    .replace(
      /&lt;/gi,
      '<',
    )
    .replace(
      /&gt;/gi,
      '>',
    )
}

function plainText(
  html,
) {

  return decodeHtml(
    String(
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
      ),
  )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
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

function slugFromHref(
  href,
) {

  return href
    .split(
      '/',
    )
    .filter(Boolean)
    .at(-1)
}

function safeId(
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

function extractImagePath(
  html,
) {

  const normal =
    String(
      html ||
      '',
    ).replaceAll(
      '\\/',
      '/',
    )

  const direct =
    normal.match(
      /\/catalog\/items\/[^"'<>?\s&]+\.webp/i,
    )

  if (
    direct
  ) {

    return direct[0]
  }

  const encoded =
    normal.match(
      /%2Fcatalog%2Fitems%2F[^&"'<>?\s]+\.webp/i,
    )

  if (
    encoded
  ) {

    return decodeURIComponent(
      encoded[0],
    )
  }

  return null
}

function detectManualCategory(
  rowText,
) {

  if (
    /\bVehicle kit\b/i.test(
      rowText,
    )
  ) {
    return 'VEHICLE'
  }

  if (
    /\bMiscellaneous\b/i.test(
      rowText,
    )
  ) {
    return 'MISC'
  }

  if (
    /\bParachute\b/i.test(
      rowText,
    )
  ) {
    return 'PARACHUTES'
  }

  if (
    /\bBuilding\b/i.test(
      rowText,
    )
  ) {
    return 'BUILDING'
  }

  if (
    /\bTactical\b/i.test(
      rowText,
    )
  ) {
    return 'TACTICAL'
  }

  if (
    /\bMedical\b/i.test(
      rowText,
    )
  ) {
    return 'MEDICAL'
  }

  if (
    /\bRecon\b/i.test(
      rowText,
    )
  ) {
    return 'RECON'
  }

  return null
}

async function loadFieldManualCategories() {

  console.log(
    'Reading WARDOGS Field Manual categories...',
  )

  const html =
    await fetchText(
      WARDOGS_FIELD_MANUAL,
    )

  const categories =
    new Map()

  for (
    const row of
    html.matchAll(
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi,
    )
  ) {

    const rowHtml =
      row[1]

    const rowText =
      plainText(
        rowHtml,
      )

    const category =
      detectManualCategory(
        rowText,
      )

    if (
      !category
    ) {
      continue
    }

    for (
      const anchor of
      rowHtml.matchAll(
        /<a\b[^>]*href=["'][^"']*\/items\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
      )
    ) {

      const name =
        plainText(
          anchor[1],
        )

      if (
        !name
      ) {
        continue
      }

      categories.set(
        normaliseName(
          name,
        ),
        category,
      )
    }
  }

  if (
    categories.size <
    20
  ) {

    throw new Error(
      'Field Manual parser returned too few records. Sync stopped.',
    )
  }

  console.log(
    `Field Manual classified names: ${categories.size}`,
  )

  return categories
}
function classifyItem({
  source,
  cardText,
  name,
  pageText,
}) {

  /*
   * Researched WARDOGS edge cases.
   * Categories only. No price/weight/size values invented.
   */
  const edgeKey =
    normaliseName(
      name,
    )

  if (
    edgeKey === 'drillrig' ||
    edgeKey === 'mortars' ||
    edgeKey === 'repairstation'
  ) {
    return null
  }

  if (
    edgeKey === 'smallhammer'
  ) {
    return 'BUILDING'
  }

  if (
    edgeKey === 'spottedscope'
  ) {
    return 'RECON'
  }


  /*
   * Primary authority:
   * current WARDOGS Field Manual.
   */

  const manual =
    manualCategories.get(
      normaliseName(
        name,
      ),
    )

  if (
    manual
  ) {
    return manual
  }

  const evidence =
    `${cardText || ''} ${pageText || ''}`

  if (
    source ===
    'medical'
  ) {
    return 'MEDICAL'
  }

  /*
   * Field Manual has already had first chance,
   * so Building signal grenades are handled above.
   */

  if (
    source ===
    'throwables'
  ) {
    return 'TACTICAL'
  }

  /*
   * Magazines exist under both WARDOGS LAB
   * Ammunition and Attachments.
   */

  if (
    source ===
    'attachments'
  ) {

    if (
      /\bMagazines\b/i.test(
        evidence,
      )
    ) {
      return 'MAGAZINES'
    }

    return null
  }

  if (
    source ===
    'ammunition'
  ) {

    if (
      /\bMagazines\b/i.test(
        evidence,
      )
    ) {
      return 'MAGAZINES'
    }

    if (
      /Vehicle\s*&\s*Heavy/i.test(
        evidence,
      )
    ) {
      return 'VEHICLE'
    }

    /*
     * A Supplies subtype should have matched the
     * Field Manual. If it did not, stop rather
     * than silently putting it somewhere invented.
     */

    if (
      /\bSupplies\b/i.test(
        evidence,
      )
    ) {
      return 'UNRESOLVED'
    }

    /*
     * Ordinary ammunition belongs in Loose Ammo,
     * not this packable gear catalogue.
     */

    return null
  }

  if (
    source ===
    'equipment'
  ) {

    if (
      /\bRecon\b/i.test(
        evidence,
      )
    ) {
      return 'RECON'
    }

    if (
      /\bVehicle kit\b|\bRepair Tool\b/i.test(
        evidence,
      )
    ) {
      return 'VEHICLE'
    }

    if (
      /\bParachute\b|\bTraversal\b/i.test(
        evidence,
      )
    ) {
      return 'PARACHUTES'
    }

    if (
      /\bMiscellaneous\b/i.test(
        evidence,
      )
    ) {
      return 'MISC'
    }

    return 'UNRESOLVED'
  }

  return 'UNRESOLVED'
}

function keepCard({
  source,
}) {

  return [
    'medical',
    'throwables',
    'equipment',
    'ammunition',
    'attachments',
  ].includes(
    source,
  )
}

const manualCategories =
  await loadFieldManualCategories()
const medicalIds = {
  'emergency-resuscitator':
    'medical-emergency-resuscitator',

  'bandage':
    'medical-bandage',

  'adrenaline-pen':
    'medical-adrenaline-pen',

  'enox':
    'medical-enox',

  'field-resuscitator':
    'medical-field-resuscitator',

  'individual-first-aid-kit':
    'medical-ifak',

  'defibrillator':
    'medical-defibrillator',

  'medical-bag':
    'medical-medical-bag',
}

/*
 * Special rules not represented purely by Stack.
 * These are deliberately small and explicit.
 */
const overrides = {
  'emergency-resuscitator': {
    price: 0,
    maxStack: 1,
    maxPerLoadout: 1,
    stackVerified: true,
  },

  'bandage': {
    maxStack: 5,
    stackVerified: true,
  },

  'adrenaline-pen': {
    maxStack: 3,
    weight: 0.06,
    stackVerified: true,
  },

  'individual-first-aid-kit': {
    maxStack: 2,
    stackVerified: true,
  },
}

await fs.mkdir(
  assetFolder,
  {
    recursive:
      true,
  },
)

/* ============================================================
   DISCOVER RELEVANT ITEM LINKS
   ============================================================ */

const candidates = []
const candidateKeys =
  new Set()

for (
  const source of
  sources
) {

  console.log(
    `Reading ${source.source} catalogue...`,
  )

  const html =
    await fetchText(
      source.url,
    )

  const anchorRegex =
    /<a\b[^>]*href=["'](?<href>(?:https:\/\/wardogslab\.com)?\/en\/database\/(?!category\/)[^"'?#]+)["'][^>]*>(?<body>[\s\S]*?)<\/a>/gi

  for (
    const match of
    html.matchAll(
      anchorRegex,
    )
  ) {

    let href =
      match.groups?.href

    if (
      !href
    ) {
      continue
    }

    href =
      href.replace(
        'https://wardogslab.com',
        '',
      )

    const cardText =
      plainText(
        match.groups?.body,
      )

    if (
      !keepCard({
        source:
          source.source,

        cardText,
      })
    ) {

      continue
    }

    const key =
      `${source.source}:${href}`

    if (
      candidateKeys.has(
        key,
      )
    ) {

      continue
    }

    candidateKeys.add(
      key,
    )

    candidates.push({
      source:
        source.source,

      href,

      cardText,
    })
  }
}

console.log(
  `Relevant catalogue records: ${candidates.length}`,
)

/* ============================================================
   FETCH DETAILS WITH CONTROLLED CONCURRENCY
   ============================================================ */

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

      results[
        index
      ] =
        await worker(
          values[
            index
          ],
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

const rawItems =
  await mapLimit(
    candidates,
    7,
    async (
      candidate,
      index,
    ) => {

      const url =
        `https://wardogslab.com${candidate.href}`

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

        if (
          !name
        ) {

          return {
            skipped:
              true,

            reason:
              'No item name',

            url,
          }
        }

        const category =
          classifyItem({
            source:
              candidate.source,

            cardText:
              candidate.cardText,

            name,

            pageText:
              text,
          })

        if (
          category ===
          'UNRESOLVED'
        ) {

          return {
            skipped:
              true,

            unresolved:
              true,

            reason:
              'Authoritative WARDOGS category unresolved',

            name,

            source:
              candidate.source,

            url,
          }
        }

        if (
          !category
        ) {

          return {
            skipped:
              true,

            reason:
              'Not a RallyStack backpack category',

            name,

            url,
          }
        }

        const priceMatch =
          text.match(
            /Price per life\s*\$([\d,]+)/i,
          )

        const weightMatch =
          text.match(
            /Weight\s*([\d.]+)\s*kg/i,
          )

        const inventoryMatch =
          text.match(
            /Inventory\s*(\d+)\s*(?:\u00d7|x)\s*(\d+)/i,
          )

        const stackMatch =
          text.match(
            /Stack\s*(\d+)/i,
          )

        if (
          !inventoryMatch
        ) {

          return {
            skipped:
              true,

            reason:
              'No verified inventory footprint',

            name,

            category,

            url,
          }
        }

        const slug =
          slugFromHref(
            candidate.href,
          )

        const itemOverride =
          overrides[
            slug
          ] || {}

        let price =
          priceMatch
            ? Number(
                priceMatch[
                  1
                ].replaceAll(
                  ',',
                  '',
                ),
              )
            : null

        let weight =
          weightMatch
            ? Number(
                weightMatch[
                  1
                ],
              )
            : null

        let maxStack =
          stackMatch
            ? Math.max(
                1,
                Number(
                  stackMatch[
                    1
                  ],
                ),
              )
            : 1

        let stackVerified =
          Boolean(
            stackMatch,
          )

        let maxPerLoadout =
          null

        if (
          Object.hasOwn(
            itemOverride,
            'price',
          )
        ) {

          price =
            itemOverride.price
        }

        if (
          Object.hasOwn(
            itemOverride,
            'weight',
          )
        ) {

          weight =
            itemOverride.weight
        }

        if (
          Object.hasOwn(
            itemOverride,
            'maxStack',
          )
        ) {

          maxStack =
            itemOverride.maxStack
        }

        if (
          Object.hasOwn(
            itemOverride,
            'stackVerified',
          )
        ) {

          stackVerified =
            itemOverride.stackVerified
        }

        if (
          Object.hasOwn(
            itemOverride,
            'maxPerLoadout',
          )
        ) {

          maxPerLoadout =
            itemOverride.maxPerLoadout
        }

        const id =
          medicalIds[
            slug
          ] ||
          `pack-${safeId(
            slug,
          )}`

        const imagePath =
          extractImagePath(
            html,
          )

        let image =
          null

        if (
          imagePath
        ) {

          const fileName =
            `${id}.webp`

          const output =
            path.join(
              assetFolder,
              fileName,
            )

          try {

            await downloadFile(
              `https://wardogslab.com${imagePath}`,
              output,
            )

            image =
              `/wardogs/items/${fileName}`
          }
          catch {

            try {

              const fallback =
                'https://wardogslab.com/_next/image?url=' +
                encodeURIComponent(
                  imagePath,
                ) +
                '&w=1024&q=90'

              await downloadFile(
                fallback,
                output,
              )

              image =
                `/wardogs/items/${fileName}`
            }
            catch {

              image =
                null
            }
          }
        }

        if (
          (
            index +
            1
          ) %
            10 ===
          0
        ) {

          console.log(
            `Processed ${index + 1}/${candidates.length}`,
          )
        }

        return {
          skipped:
            false,

          item: {
            id,

            name,

            kind:
              'gear',

            packCategory:
              category,

            inventoryWidth:
              Number(
                inventoryMatch[
                  1
                ],
              ),

            inventoryHeight:
              Number(
                inventoryMatch[
                  2
                ],
              ),

            price,

            weight,

            maxStack,

            maxPerLoadout,

            stackVerified,

            sourceCategory:
              candidate.source,

            sourceUrl:
              url,

            image,
          },
        }
      }
      catch (
        error
      ) {

        return {
          skipped:
            true,

          reason:
            error.message,

          url,
        }
      }
    },
  )

const unresolvedCategories =
  rawItems.filter(
    (result) =>
      result.unresolved,
  )

if (
  unresolvedCategories.length
) {

  console.log('')
  console.log(
    'UNRESOLVED WARDOGS CATEGORIES:',
  )

  for (
    const item of
    unresolvedCategories
  ) {

    console.log(
      `  ${item.name} [${item.source}]`,
    )
  }

  throw new Error(
    'WARDOGS category research incomplete. Generated data was not written.',
  )
}
/* ============================================================
   DEDUPE DUPLICATE / PLACEHOLDER RECORDS
   ============================================================ */

function completeness(
  item,
) {

  let score = 0

  if (
    item.price !==
    null
  ) {
    score += 2
  }

  if (
    item.weight !==
    null
  ) {
    score += 2
  }

  if (
    item.inventoryWidth &&
    item.inventoryHeight
  ) {
    score += 4
  }

  if (
    item.stackVerified
  ) {
    score += 2
  }

  if (
    item.image
  ) {
    score += 2
  }

  return score
}

const byName =
  new Map()

for (
  const result of
  rawItems
) {

  if (
    result.skipped
  ) {
    continue
  }

  const item =
    result.item

  const key =
    normaliseName(
      item.name,
    )

  const existing =
    byName.get(
      key,
    )

  if (
    !existing ||
    completeness(
      item,
    ) >
      completeness(
        existing,
      )
  ) {

    byName.set(
      key,
      item,
    )
  }
}

const items =
  Array.from(
    byName.values(),
  ).sort(
    (
      left,
      right,
    ) =>
      left.packCategory.localeCompare(
        right.packCategory,
      ) ||
      left.name.localeCompare(
        right.name,
      ),
  )

/* RALLYSTACK_SAFE_CATALOGUE_GATE */
const requiredMinimums = {
  MEDICAL: 8,
  MAGAZINES: 53,
  TACTICAL: 10,
  BUILDING: 6,
  RECON: 3,
  VEHICLE: 9,
  PARACHUTES: 2,
  MISC: 2,
}

if (
  items.length <
  93
) {
  throw new Error(
    `Refusing catalogue write: only ${items.length} items generated.`,
  )
}

for (
  const [category, minimum] of
  Object.entries(
    requiredMinimums,
  )
) {

  const actual =
    items.filter(
      (item) =>
        item.packCategory ===
        category,
    ).length

  if (
    actual <
    minimum
  ) {
    throw new Error(
      `Refusing catalogue write: ${category}=${actual}, minimum=${minimum}.`,
    )
  }
}

console.log(
  `Validated packable catalogue: ${items.length} items`,
)

/* ============================================================
   WRITE DATA
   Keep "medicalItems" alias temporarily so existing RallyStack
   summary / packing state does not need a risky full refactor.
   ============================================================ */

const dataCode =
`/*
 * Auto-generated from current WARDOGS LAB catalogue pages.
 *
 * Run:
 *   node scripts/sync-wardogs-packable-items.mjs
 *
 * Unknown values deliberately remain null / unverified.
 */

export const packableItems = ${JSON.stringify(
  items,
  null,
  2,
)}

export const medicalItems =
  packableItems
`

await fs.writeFile(
  dataFile,
  dataCode,
  'utf8',
)

/* ============================================================
   UPDATE EXISTING IMAGE MAP
   ============================================================ */

let imageMap =
  await fs.readFile(
    imageMapFile,
    'utf8',
  )

for (
  const item of
  items
) {

  if (
    !item.image
  ) {
    continue
  }

  const escapedId =
    item.id.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )

  const mappingRegex =
    new RegExp(
      `(['"]${escapedId}['"]\\s*:\\s*)['"][^'"]*['"]`,
    )

  if (
    mappingRegex.test(
      imageMap,
    )
  ) {

    imageMap =
      imageMap.replace(
        mappingRegex,
        `$1'${item.image}'`,
      )

    continue
  }

  const closing =
    imageMap.lastIndexOf(
      '}',
    )

  if (
    closing < 0
  ) {

    throw new Error(
      'wardogsItemImages.js has no closing object brace.',
    )
  }

  imageMap =
    imageMap.slice(
      0,
      closing,
    ) +
    `  '${item.id}': '${item.image}',\n` +
    imageMap.slice(
      closing,
    )
}

await fs.writeFile(
  imageMapFile,
  imageMap,
  'utf8',
)

/* ============================================================
   AUDIT REPORT
   ============================================================ */

const skipped =
  rawItems.filter(
    (result) =>
      result.skipped,
  )

const unknownPrice =
  items.filter(
    (item) =>
      item.price ===
      null,
  )

const unknownWeight =
  items.filter(
    (item) =>
      item.weight ===
      null,
  )

const unknownStack =
  items.filter(
    (item) =>
      !item.stackVerified,
  )

const missingImage =
  items.filter(
    (item) =>
      !item.image,
  )

const categoryCounts =
  Object.fromEntries(
    [
      'MEDICAL',
      'MAGAZINES',
      'TACTICAL',
      'BUILDING',
      'RECON',
      'VEHICLE',
      'PARACHUTES',
      'MISC',
    ].map(
      (category) => [
        category,

        items.filter(
          (item) =>
            item.packCategory ===
            category,
        ).length,
      ],
    ),
  )

const audit = {
  generatedAt:
    new Date().toISOString(),

  source:
    'WARDOGS LAB',

  sourceUrls:
    sources.map(
      (item) =>
        item.url,
    ),

  discoveredCandidates:
    candidates.length,

  packableItems:
    items.length,

  categoryCounts,

  unknownPrice:
    unknownPrice.map(
      (item) =>
        item.name,
    ),

  unknownWeight:
    unknownWeight.map(
      (item) =>
        item.name,
    ),

  unknownStack:
    unknownStack.map(
      (item) =>
        item.name,
    ),

  missingImage:
    missingImage.map(
      (item) =>
        item.name,
    ),

  skipped,
}

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
console.log('========================================')
console.log('WARDOGS PACKABLE DATA SYNCED')
console.log('========================================')
console.log('')

for (
  const [
    category,
    count,
  ] of
  Object.entries(
    categoryCounts,
  )
) {

  console.log(
    `${category.padEnd(12)} ${count}`,
  )
}

console.log('')
console.log(
  `TOTAL         ${items.length}`,
)

console.log(
  `UNKNOWN PRICE ${unknownPrice.length}`,
)

console.log(
  `UNKNOWN WEIGHT ${unknownWeight.length}`,
)

console.log(
  `UNKNOWN STACK ${unknownStack.length}`,
)

console.log(
  `MISSING IMAGE ${missingImage.length}`,
)

console.log('')
