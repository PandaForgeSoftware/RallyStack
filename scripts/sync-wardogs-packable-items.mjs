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

function classifyItem({
  source,
  cardText,
  name,
}) {

  const text =
    `${cardText} ${name}`

  if (
    source ===
    'medical'
  ) {

    return 'MEDICAL'
  }

  if (
    source ===
    'throwables'
  ) {

    return 'GRENADES'
  }

  if (
    source ===
    'attachments'
  ) {

    if (
      /magazines/i.test(
        text,
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
      /magazines/i.test(
        text,
      ) ||
      /magazine|drum magazine|rnd box/i.test(
        name,
      )
    ) {

      return 'MAGAZINES'
    }

    if (
      /vehicle\s*&\s*heavy/i.test(
        text,
      )
    ) {

      return 'VEHICLE'
    }

    if (
      /build supplies/i.test(
        name,
      )
    ) {

      return 'BUILDING'
    }

    if (
      /fuel supplies|mechanical supplies|high capacity battery|^battery$/i.test(
        name,
      )
    ) {

      return 'VEHICLE'
    }

    if (
      /ammo supplies/i.test(
        name,
      )
    ) {

      return 'TACTICAL'
    }

    return null
  }

  if (
    source ===
    'equipment'
  ) {

    if (
      /recon/i.test(
        cardText,
      ) ||
      /range finder|monocular|spotted scope|ir goggles/i.test(
        name,
      )
    ) {

      return 'RECON'
    }

    if (
      /repair tool/i.test(
        cardText,
      ) ||
      /drill|hammer|wrench|repair station/i.test(
        name,
      )
    ) {

      return 'BUILDING'
    }

    return 'TACTICAL'
  }

  return null
}

function keepCard({
  source,
  cardText,
}) {

  if (
    source ===
      'medical' ||
    source ===
      'throwables' ||
    source ===
      'equipment'
  ) {

    return true
  }

  if (
    source ===
    'attachments'
  ) {

    return /magazines/i.test(
      cardText,
    )
  }

  if (
    source ===
    'ammunition'
  ) {

    return (
      /magazines/i.test(
        cardText,
      ) ||
      /vehicle\s*&\s*heavy/i.test(
        cardText,
      ) ||
      /Build Supplies|Fuel Supplies|Mechanical Supplies|Ammo Supplies|Battery/i.test(
        cardText,
      )
    )
  }

  return false
}

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
          })

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
            /Inventory\s*(\d+)\s*[×x]\s*(\d+)/i,
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
      'GRENADES',
      'TACTICAL',
      'BUILDING',
      'RECON',
      'VEHICLE',
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