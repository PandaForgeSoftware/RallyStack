import fs from 'node:fs/promises'

import {
  packableItems,
} from '../src/data/wardogsPackableData.js'

const DATA_FILE =
  'src/data/wardogsPackableData.js'

const PACKING_FILE =
  'src/features/loadouts/components/BackpackPackingView.jsx'

const FIELD_MANUAL =
  'https://www.wardogs-companion.com/items/?group=gear&sort=category'

const LAB_ATTACHMENTS =
  'https://wardogslab.com/en/database/category/attachments'

const HEADERS = {
  'user-agent':
    'RallyStack-Community-Builder/3.0',
}

async function fetchText(
  url,
) {

  const response =
    await fetch(
      url,
      {
        headers:
          HEADERS,
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

function plain(
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

function normal(
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

function detectManualCategory(
  rowText,
) {

  /*
   * These names come directly from the
   * current WARDOGS Field Manual taxonomy.
   */

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

/* ============================================================
   CURRENT FIELD MANUAL EQUIPMENT CATEGORIES
   ============================================================ */

console.log('')
console.log(
  'Reading current WARDOGS Field Manual...',
)

const manualHtml =
  await fetchText(
    FIELD_MANUAL,
  )

const manualCategories =
  new Map()

for (
  const row of
  manualHtml.matchAll(
    /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi,
  )
) {

  const rowHtml =
    row[1]

  const rowText =
    plain(
      rowHtml,
    )

  const category =
    detectManualCategory(
      rowText,
    )

  if (!category) {
    continue
  }

  for (
    const anchor of
    rowHtml.matchAll(
      /<a\b[^>]*href=["'][^"']*\/items\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    )
  ) {

    const label =
      plain(
        anchor[1],
      )

    if (!label) {
      continue
    }

    manualCategories.set(
      normal(
        label,
      ),
      category,
    )
  }
}

console.log(
  `Field Manual classified names: ${manualCategories.size}`,
)

if (
  manualCategories.size <
  20
) {

  throw new Error(
    'Field Manual parser returned too few records. Nothing will be changed.',
  )
}

/* ============================================================
   CURRENT LAB ATTACHMENT MAGAZINES

   Crucial correction:
   magazines are an ATTACHMENT subtype in WARDOGS.
   ============================================================ */

console.log(
  'Reading current WARDOGS LAB attachment slots...',
)

const attachmentHtml =
  await fetchText(
    LAB_ATTACHMENTS,
  )

const magazinePaths =
  new Set()

for (
  const anchor of
  attachmentHtml.matchAll(
    /<a\b[^>]*href=["'](?<href>\/en\/database\/(?!category\/)[^"'?#]+)["'][^>]*>(?<body>[\s\S]*?)<\/a>/gi,
  )
) {

  const text =
    plain(
      anchor.groups?.body,
    )

  if (
    /\bMagazines\b/i.test(
      text,
    )
  ) {

    magazinePaths.add(
      anchor.groups.href,
    )
  }
}

console.log(
  `LAB magazine records: ${magazinePaths.size}`,
)

if (
  magazinePaths.size <
  5
) {

  throw new Error(
    'LAB magazine parser returned too few records. Nothing will be changed.',
  )
}

/* ============================================================
   ITEM PAGE CACHE
   ============================================================ */

const pageCache =
  new Map()

async function getItemPage(
  item,
) {

  if (
    !item.sourceUrl
  ) {

    return ''
  }

  if (
    pageCache.has(
      item.sourceUrl,
    )
  ) {

    return pageCache.get(
      item.sourceUrl,
    )
  }

  try {

    const html =
      await fetchText(
        item.sourceUrl,
      )

    const text =
      plain(
        html,
      )

    pageCache.set(
      item.sourceUrl,
      text,
    )

    return text
  }
  catch {

    pageCache.set(
      item.sourceUrl,
      '',
    )

    return ''
  }
}

/* ============================================================
   CLASSIFICATION
   ============================================================ */

async function classify(
  item,
) {

  const nameKey =
    normal(
      item.name,
    )

  const manual =
    manualCategories.get(
      nameKey,
    )

  if (
    manual
  ) {

    return {
      category:
        manual,

      evidence:
        'WARDOGS FIELD MANUAL',
    }
  }

  const source =
    String(
      item.sourceCategory ||
      '',
    ).toLowerCase()

  const page =
    await getItemPage(
      item,
    )

  /*
   * Magazines can originate from both
   * Ammunition and Attachments.
   */

  if (
    (
      source ===
        'attachments' ||
      source ===
        'ammunition'
    ) &&
    /(?:Attachments|Ammunition)\s*(?:·|Â·)\s*Magazines\b/i.test(
      page,
    )
  ) {

    return {
      category:
        'MAGAZINES',

      evidence:
        `WARDOGS LAB ${source.toUpperCase()} > MAGAZINES`,
    }
  }

  if (
    source ===
    'attachments'
  ) {

    let pathname = ''

    try {

      pathname =
        new URL(
          item.sourceUrl,
          'https://wardogslab.com',
        ).pathname
    }
    catch {
    }

    if (
      magazinePaths.has(
        pathname,
      )
    ) {

      return {
        category:
          'MAGAZINES',

        evidence:
          'WARDOGS LAB ATTACHMENTS > MAGAZINES',
      }
    }

    return {
      category:
        null,

      evidence:
        'NON-MAGAZINE WEAPON ATTACHMENT',
    }
  }

  if (
    source ===
    'medical'
  ) {

    return {
      category:
        'MEDICAL',

      evidence:
        'WARDOGS LAB MEDICAL',
    }
  }

  if (
    source ===
      'ammunition' &&
    /Ammunition\s*(?:·|Â·)\s*Vehicle\s*&\s*Heavy\b/i.test(
      page,
    )
  ) {

    return {
      category:
        'VEHICLE',

      evidence:
        'WARDOGS LAB VEHICLE & HEAVY',
    }
  }

  if (
    source ===
    'ammunition'
  ) {

    return {
      category:
        'UNRESOLVED',

      evidence:
        'AMMUNITION ITEM NOT FOUND IN AUTHORITATIVE CATEGORY SOURCES',
    }
  }

  if (
    source ===
    'throwables'
  ) {

    return {
      category:
        'TACTICAL',

      evidence:
        'WARDOGS LAB THROWABLE + FIELD MANUAL CHECK',
    }
  }

  if (
    source ===
    'equipment'
  ) {

    if (
      /Equipment\s*(?:·|Â·)\s*(?:Vehicle kit|Vehicle Kit|Repair Tool)/i.test(
        page,
      )
    ) {

      return {
        category:
          'VEHICLE',

        evidence:
          'WARDOGS LAB EQUIPMENT > VEHICLE KIT',
      }
    }

    if (
      /Equipment\s*(?:·|Â·)\s*Recon/i.test(
        page,
      )
    ) {

      return {
        category:
          'RECON',

        evidence:
          'WARDOGS LAB EQUIPMENT > RECON',
      }
    }

    if (
      /Equipment\s*(?:·|Â·)\s*(?:Parachute|Traversal)/i.test(
        page,
      )
    ) {

      return {
        category:
          'PARACHUTES',

        evidence:
          'WARDOGS LAB EQUIPMENT > PARACHUTE',
      }
    }

    if (
      /Equipment\s*(?:·|Â·)\s*(?:Miscellaneous|Misc)/i.test(
        page,
      )
    ) {

      return {
        category:
          'MISC',

        evidence:
          'WARDOGS LAB EQUIPMENT > MISC',
      }
    }

    return {
      category:
        'UNRESOLVED',

      evidence:
        'EQUIPMENT NOT FOUND IN AUTHORITATIVE CATEGORY SOURCES',
    }
  }

  return {
    category:
      'UNRESOLVED',

    evidence:
      `UNKNOWN SOURCE ${source}`,
  }
}
/* ============================================================
   APPLY ONLY WHEN EVERYTHING IS ACCOUNTED FOR
   ============================================================ */

const corrected = []
const ignored = []
const unresolved = []

for (
  const item of
  packableItems
) {

  const result =
    await classify(
      item,
    )

  if (
    result.category ===
    'UNRESOLVED'
  ) {

    unresolved.push({
      name:
        item.name,

      source:
        item.sourceCategory,

      reason:
        result.evidence,
    })

    continue
  }

  if (
    result.category ===
    null
  ) {

    ignored.push({
      name:
        item.name,

      reason:
        result.evidence,
    })

    continue
  }

  corrected.push({
    ...item,

    packCategory:
      result.category,

    categoryEvidence:
      result.evidence,
  })
}

/*
 * Hard stop BEFORE writing if anything
 * genuinely needs research.
 */

if (
  unresolved.length
) {

  console.log('')
  console.log(
    'UNRESOLVED ITEMS:',
  )

  for (
    const item of
    unresolved
  ) {

    console.log(
      `  ${item.name} [${item.source}] - ${item.reason}`,
    )
  }

  throw new Error(
    'Some items could not be authoritatively classified. No files were changed.',
  )
}

/*
 * Dedupe without changing prices, sizes,
 * artwork, weight or stack mechanics.
 */

const unique =
  Array.from(
    new Map(
      corrected.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    ).values(),
  )

const order = [
  'MEDICAL',
  'MAGAZINES',
  'TACTICAL',
  'BUILDING',
  'RECON',
  'VEHICLE',
  'PARACHUTES',
  'MISC',
]

unique.sort(
  (
    left,
    right,
  ) => {

    const leftIndex =
      order.indexOf(
        left.packCategory,
      )

    const rightIndex =
      order.indexOf(
        right.packCategory,
      )

    return (
      leftIndex -
        rightIndex ||
      left.name.localeCompare(
        right.name,
      )
    )
  },
)

/* ============================================================
   AUDIT BEFORE WRITE
   ============================================================ */

console.log('')
console.log(
  '========================================',
)

console.log(
  'RESEARCHED CATEGORY AUDIT',
)

console.log(
  '========================================',
)

for (
  const category of
  order
) {

  const items =
    unique.filter(
      (item) =>
        item.packCategory ===
        category,
    )

  console.log('')
  console.log(
    `${category} (${items.length})`,
  )

  for (
    const item of
    items
  ) {

    console.log(
      `  ${item.name}  <- ${item.categoryEvidence}`,
    )
  }
}

console.log('')
console.log(
  `Excluded weapon attachments / duplicate loose ammo: ${ignored.length}`,
)

/* ============================================================
   WRITE DATA
   ============================================================ */

const output =
`/*
 * RallyStack WARDOGS packable catalogue.
 *
 * Category sources:
 * - WARDOGS Field Manual equipment taxonomy
 * - WARDOGS LAB Attachments > Magazines
 * - WARDOGS LAB Ammunition > Vehicle & Heavy
 *
 * Non-magazine weapon attachments are intentionally excluded.
 * Normal loose ammo is handled by wardogsLoadoutData.js.
 */

export const packableItems = ${JSON.stringify(
  unique,
  null,
  2,
)}

export const medicalItems =
  packableItems
`

await fs.writeFile(
  DATA_FILE,
  output,
  'utf8',
)

/* ============================================================
   UI CATEGORY NAMES

   Remove invented GRENADES bucket.
   Add actual Parachutes / Misc categories where present.
   ============================================================ */

let packing =
  (
    await fs.readFile(
      PACKING_FILE,
      'utf8',
    )
  ).replace(
    /\r\n/g,
    '\n',
  )

if (
  !packing.includes(
    'function BackpackPackingView(',
  ) ||
  !packing.includes(
    'export default BackpackPackingView',
  )
) {

  throw new Error(
    'Backpack component is not healthy.',
  )
}

/*
 * Generic renderer must already filter
 * items by their packCategory.
 */

if (
  !/item\.packCategory\s*===\s*entry/.test(
    packing,
  )
) {

  throw new Error(
    'Backpack category renderer is not filtering by packCategory. Data was written but UI was not modified.',
  )
}

const lines =
  packing.split(
    '\n',
  )

const rebuilt = []

for (
  let index = 0;
  index <
  lines.length;
  index += 1
) {

  const line =
    lines[
      index
    ]

  /*
   * Grenades are Tactical/Building in the
   * real taxonomy, not their own category.
   */

  if (
    /^\s*'GRENADES',?\s*$/.test(
      line,
    )
  ) {

    continue
  }

  rebuilt.push(
    line,
  )

  if (
    /^\s*'VEHICLE',?\s*$/.test(
      line,
    )
  ) {

    const indent =
      line.match(
        /^\s*/,
      )[0]

    const nearby =
      lines
        .slice(
          index + 1,
          index + 5,
        )
        .join(
          '\n',
        )

    if (
      unique.some(
        (item) =>
          item.packCategory ===
          'PARACHUTES',
      ) &&
      !nearby.includes(
        "'PARACHUTES'",
      )
    ) {

      rebuilt.push(
        `${indent}'PARACHUTES',`,
      )
    }

    if (
      unique.some(
        (item) =>
          item.packCategory ===
          'MISC',
      ) &&
      !nearby.includes(
        "'MISC'",
      )
    ) {

      rebuilt.push(
        `${indent}'MISC',`,
      )
    }
  }
}

packing =
  rebuilt.join(
    '\n',
  )

await fs.writeFile(
  PACKING_FILE,
  packing,
  'utf8',
)

console.log('')
console.log(
  'CATEGORY RESEARCH COMPLETE',
)
console.log('')
