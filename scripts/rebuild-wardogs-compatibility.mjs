import fs from 'node:fs/promises'

const BASE = 'https://wardogs.zone'
const OUT = 'src/data/wardogsVerifiedCompatibility.js'
const BACKUP = 'src/data/wardogsVerifiedCompatibility.pre-full-live-rebuild.bak'

const weapons = {
  a91: 'A-91',
  ak74m: 'AK74',
  wepn_033: 'Bushmaster M17S',
  wepn_030: 'FAL',
  wepn_029: 'Galil',
  kh2002: 'KH-2002',
  m4: 'M4',
  tar21: 'T-21',
  combatbow: 'Compound Bow',
  launcher_04: '9K333 Verba',
  cgm4: 'MAAWS',
  mmgl: 'MGL-40',
  rpg7: 'RPG-7',
  m249: 'M249 SAW',
  lmg_02: 'PKM',
  rfb: 'BMR-308',
  sks: 'SKS',
  svdm: 'SVD',
  wepn_027: 'Deagle',
  glock17: 'GGX 17',
  wepn_032: 'GGX 18',
  judge: 'Judge',
  wepn_026: 'M1911',
  m500: 'M500',
  mp43: 'MP43',
  mp9: 'AMP-9',
  wepn_028: 'Super-45',
  smg_03: 'PP-19 Vityaz',
  vector: 'MP5',
  sr_04: 'AMR 50',
  mk22: 'MK22',
  mosin: 'Mosin Nagant',
  wepn_035: 'Scout Rifle TD',
  sv98: 'SV98',
}

const groups = {
  MUZZLE: `
muzl_050 muzl_049 mzl_06 muzl_013 muzl_027 muzl_051 muzl_052 muzl_048
mzl_07 muzl_020 muzl_039 muzl_055 muzl_056 muzl_022 pwscqb74muzzle
muzl_042 muzl_028 muzl_019 muzl_037 muzl_061 muzl_057 muzl_045
muzl_047 mzl_04 mzl_08 muzl_024 muzl_044 muzl_031 muzl_059
muzl_029 mzl_09 muzl_054 muzl_053 muzl_058 muzl_032 mzl_05
muzl_025 muzl_038 muzl_041 muzl_062 muzl_046 muzl_060 muzl_040
mzl_10 muzl_030 muzl_014 muzl_023
`,

  OPTIC: `
opt_08 sght_029 sght_011 sght_030 10xscopemoa sniperscope10x
sght_036 sght_031 basicreddot sght_028 sght_016 sght_032
eotechholosight sght_009 sght_025 sght_023 sght_034 4xelcanspectr
3xscope sght_026 sght_027 hybridscope4x sght_033 sght_037 6xscope
`,

  MAGAZINE: `
magz_066 magz_003 magz_006 magz_005 magz_002 magz_064 magz_004
magz_056 magz_046 magz_065 ak74mmagazineplum130rnd
arextendedmagazine545mm combatbowmagazine launcher_04magazine
stanagdrummagazine90rd m500magazine mp43magazine
mosinmagazineextended10rd mosinmagazineextended20rd
`,

  HANDGUARD: `
hndg_009 hndg_008 hndg_010 hndg_013 m4handguard hndg_014
mmglhandguard hndg_005 hndg_012 hndg_011 hndg_007 svdmhandguard
hndg_015 hndg_006 zenithandguard hndg_016 ar_02_hgd_04 hndg_003
`,

  STOCK: `
stok_012 ak74mstock stok_007 stok_009 stok_011 stok_010 m4stock
mmglstock stok_006 stok_008 sv98stock svdmstock zenitstock stok_005
stok_013 stok_003 smg_01_stk_05 stok_057
`,

  FOREGRIP: `
fgrp_016 fgp_03 fgrp_017 fgrp_014 fgp_04 fgrp_012 fgrp_018
fgrp_008 fgrp_013 rk6foregrip fgrp_015 fgrp_006 fgrp_007
fgrp_010 fgrp_009 fgrp_011 fgp_02
`,

  BARREL: `
a91barrel ak74mbarrel kh2002barrel m4barrel mmglbarrel
ar_02_brl_01 barl_011 svdmbarrel barl_004 barl_006
barl_003 barl_005 barl_045
`,

  GRIP: `
pgrp_009 pgrp_006 ak74mgrip ak74mimieggrip pgrp_007 pgrp_008
m4pistolgrip mmglpistolgrip pgrp_003 pgrp_010
`,

  DUST_COVER: `
dcvr_001 dcvr_002 dcvr_003
`,

  TRIGGER: `
trgr_003 trgr_001 trgr_002
`,

  PISTOL_GRIP: `
pgrp_005 pgrp_004
`,

  CANTED_SIGHT: `
cantedirons
`,
}

for (const key of Object.keys(groups)) {
  groups[key] = groups[key].trim().split(/\s+/)
}

const slugType = new Map()

for (const [type, slugs] of Object.entries(groups)) {
  for (const slug of slugs) {
    if (slugType.has(slug)) {
      throw new Error(`Duplicate attachment slug: ${slug}`)
    }

    slugType.set(slug, type)
  }
}

if (slugType.size !== 176) {
  throw new Error(
    `Attachment catalogue error: expected 176, got ${slugType.size}`
  )
}

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms))

async function fetchText(url, attempts = 4) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'RallyStack WARDOGS compatibility verifier',
        },
      })

      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText}`
        )
      }

      return await response.text()
    }
    catch (error) {
      lastError = error

      if (attempt < attempts) {
        await sleep(400 * attempt)
      }
    }
  }

  throw lastError
}

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#176;', '°')
}

function extractTitle(html) {
  return decodeHtml(
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/<[^>]+>/g, '')
      ?.trim() || ''
  )
}

function titleToName(title) {
  return title
    .replace(
      /:\s*WARDOGS\s+(Attachment|Ammo|Weapon)\s+Stats.*$/i,
      ''
    )
    .trim()
}

function databaseSlugs(html) {
  const result = new Set()

  for (
    const match of html.matchAll(
      /\/database\/([A-Za-z0-9_.-]+)/g
    )
  ) {
    result.add(match[1])
  }

  return [...result]
}

function explicitFits(html) {
  const sections =
    [...html.matchAll(
      /<section\b[^>]*>([\s\S]*?)<\/section>/gi
    )]

  for (const sectionMatch of sections) {
    const section =
      sectionMatch[1]

    if (
      !/<span\b[^>]*>\s*Fits\s*<\/span>/i.test(
        section
      )
    ) {
      continue
    }

    const linksContainer =
      section.match(
        /<div\b[^>]*class=["'][^"']*\bflex\b[^"']*\bflex-wrap\b[^"']*\bgap-2\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
      )

    if (!linksContainer) {
      return []
    }

    const fits = []

    for (
      const match of linksContainer[1].matchAll(
        /href=["'](?:https:\/\/wardogs\.zone)?\/database\/([A-Za-z0-9_.-]+)["']/gi
      )
    ) {
      const slug = match[1]
      const weapon = weapons[slug]

      if (
        weapon &&
        !fits.includes(weapon)
      ) {
        fits.push(weapon)
      }
    }

    return fits
  }

  return []
}
async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (true) {
      const index = cursor++

      if (index >= items.length) {
        return
      }

      output[index] =
        await mapper(items[index], index)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, items.length) },
      () => worker()
    )
  )

  return output
}

console.log('')
console.log('===== WARDOGS FULL COMPATIBILITY REBUILD =====')
console.log('')
console.log('Attachment catalogue: 176')
console.log('Weapons: 34')
console.log('')
console.log('Reading every attachment Fits list...')

const catalogue =
  [...slugType.entries()].map(
    ([slug, type]) => ({
      slug,
      type,
      url: `${BASE}/database/${slug}`,
    })
  )

const attachments =
  await mapLimit(
    catalogue,
    8,
    async item => {
      const html =
        await fetchText(item.url)

      const title =
        extractTitle(html)

      const name =
        titleToName(title)

      if (!name) {
        throw new Error(
          `No attachment name: ${item.url}`
        )
      }

      return {
        ...item,
        name,
        fits: explicitFits(html),
      }
    }
  )

console.log(
  `Attachment pages read: ${attachments.length}/176`
)

const weaponMap = {}

for (const weapon of Object.values(weapons)) {
  weaponMap[weapon] = {
    attachments: {},
  }
}

function add(
  weapon,
  type,
  name,
  href,
  source
) {
  if (!weaponMap[weapon]) {
    throw new Error(
      `Unknown weapon: ${weapon}`
    )
  }

  const bucket =
    weaponMap[weapon].attachments[type] ||= []

  if (
    !bucket.some(
      item =>
        item.name.toLowerCase() ===
        name.toLowerCase()
    )
  ) {
    bucket.push({
      name,
      href,
      source,
    })
  }
}

for (const attachment of attachments) {
  for (const weapon of attachment.fits) {
    add(
      weapon,
      attachment.type,
      attachment.name,
      attachment.url,
      'WARDOGS Zone explicit Fits list'
    )
  }
}

console.log('')
console.log('Reading weapon magazine lists...')

const weaponPages =
  await mapLimit(
    Object.entries(weapons),
    6,
    async ([slug, name]) => {
      const url =
        `${BASE}/database/${slug}`

      return {
        slug,
        name,
        url,
        html: await fetchText(url),
      }
    }
  )

const knownWeaponSlugs =
  new Set(Object.keys(weapons))

const genericSlugs =
  new Set([
    '',
    'weapons',
    'attachments',
    'ammo',
    'equipment',
    'vehicles',
    'skins',
    'compare',
  ])

const extraCandidateSlugs =
  new Set()

for (const page of weaponPages) {
  for (const slug of databaseSlugs(page.html)) {
    if (
      knownWeaponSlugs.has(slug) ||
      genericSlugs.has(slug) ||
      slugType.has(slug)
    ) {
      continue
    }

    extraCandidateSlugs.add(slug)
  }
}

const extraPages =
  await mapLimit(
    [...extraCandidateSlugs],
    8,
    async slug => {
      const url =
        `${BASE}/database/${slug}`

      const html =
        await fetchText(url)

      const title =
        extractTitle(html)

      return {
        slug,
        url,
        html,
        title,
        name: titleToName(title),
      }
    }
  )

const magazinePages =
  extraPages.filter(
    page =>
      /WARDOGS Ammo Stats/i.test(
        page.title
      ) &&
      /(magazine|drum|box)/i.test(
        `${page.name} ${page.slug}`
      )
  )

for (const page of magazinePages) {
  const fits =
    explicitFits(page.html)

  for (const weapon of fits) {
    add(
      weapon,
      'MAGAZINE',
      page.name,
      page.url,
      'WARDOGS Zone magazine Fits list'
    )
  }
}

for (
  const weapon of Object.values(weaponMap)
) {
  for (
    const list of Object.values(
      weapon.attachments
    )
  ) {
    list.sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    )
  }
}

function names(
  weapon,
  type
) {
  return (
    weaponMap[weapon]
      ?.attachments[type] || []
  ).map(item => item.name)
}

function assertHas(
  weapon,
  type,
  value
) {
  if (
    !names(weapon, type)
      .includes(value)
  ) {
    throw new Error(
      `${weapon} missing ${type}: ${value}`
    )
  }
}

function assertNotHas(
  weapon,
  type,
  pattern
) {
  const bad =
    names(weapon, type)
      .filter(
        name => pattern.test(name)
      )

  if (bad.length) {
    throw new Error(
      `${weapon} incorrectly has ${type}: ${bad.join(', ')}`
    )
  }
}

console.log('')
console.log('Running compatibility sanity checks...')

assertNotHas(
  'AMP-9',
  'FOREGRIP',
  /bipod/i
)

assertNotHas(
  'PP-19 Vityaz',
  'FOREGRIP',
  /bipod/i
)

assertHas(
  'M249 SAW',
  'FOREGRIP',
  'M249 Bipod'
)

assertHas(
  'PKM',
  'FOREGRIP',
  'PKM Bipod'
)

assertHas(
  'SKS',
  'FOREGRIP',
  'SKS Bipod'
)

assertHas(
  'SV98',
  'FOREGRIP',
  'SV98 Bipod'
)

assertHas(
  'SVD',
  'FOREGRIP',
  'SVD Bipod'
)

assertHas(
  'MK22',
  'FOREGRIP',
  'Pro Tilt Bipod'
)

assertHas(
  'GGX 18',
  'OPTIC',
  'Mini Reflex Sight'
)

if (
  names('GGX 17', 'MAGAZINE')
    .length < 3
) {
  throw new Error(
    'GGX 17 magazine list incomplete'
  )
}

if (
  names('GGX 18', 'MAGAZINE')
    .length < 3
) {
  throw new Error(
    'GGX 18 magazine list incomplete'
  )
}

if (
  names('MP5', 'OPTIC')
    .length === 0
) {
  throw new Error(
    'MP5 optic list missing'
  )
}

if (
  names('MP5', 'MUZZLE')
    .length === 0
) {
  throw new Error(
    'MP5 muzzle list missing'
  )
}

const attachmentCount =
  Object.values(weaponMap)
    .reduce(
      (weaponTotal, weapon) =>
        weaponTotal +
        Object.values(
          weapon.attachments
        ).reduce(
          (slotTotal, slot) =>
            slotTotal +
            slot.length,
          0
        ),
      0
    )

const file = `
// AUTO-GENERATED BY scripts/rebuild-wardogs-compatibility.mjs
// Source: current WARDOGS Zone attachment Fits lists
// plus current weapon magazine Fits lists.
// Do not manually broaden compatibility.

export const verifiedCompatibilityMeta = ${JSON.stringify({
  generatedAt:
    new Date().toISOString(),
  source:
    'WARDOGS Zone explicit attachment Fits + magazine Fits',
  weaponCount:
    Object.keys(weaponMap).length,
  catalogueAttachmentCount:
    attachments.length,
  compatibilityEntries:
    attachmentCount,
  unresolvedTypes: 0,
}, null, 2)}

export const verifiedWeaponCompatibility = ${JSON.stringify(
  weaponMap,
  null,
  2
)}
`.trimStart()

try {
  await fs.copyFile(
    OUT,
    BACKUP
  )
}
catch {
  // First clean build or no previous file.
}

await fs.writeFile(
  OUT,
  file,
  'utf8'
)

console.log('')
console.log('============================================')
console.log(' LIVE WARDOGS COMPATIBILITY REBUILD COMPLETE')
console.log('============================================')
console.log('')
console.log(`Weapons:              ${Object.keys(weaponMap).length}`)
console.log(`Attachment catalogue: ${attachments.length}`)
console.log(`Compatibility entries:${attachmentCount}`)
console.log(`Unresolved types:     0`)
console.log('')
console.log('GGX 17')
console.log('  Muzzles:   ', names('GGX 17', 'MUZZLE').length)
console.log('  Magazines: ', names('GGX 17', 'MAGAZINE').length)
console.log('')
console.log('GGX 18')
console.log('  Sights:    ', names('GGX 18', 'OPTIC').length)
console.log('  Muzzles:   ', names('GGX 18', 'MUZZLE').length)
console.log('  Magazines: ', names('GGX 18', 'MAGAZINE').length)
console.log('')
console.log('AMP-9')
console.log('  Sights:    ', names('AMP-9', 'OPTIC').length)
console.log('  Muzzles:   ', names('AMP-9', 'MUZZLE').length)
console.log('  Underbarrel:', names('AMP-9', 'FOREGRIP').length)
console.log('  Magazines: ', names('AMP-9', 'MAGAZINE').length)
console.log('')
console.log('PP-19 Vityaz')
console.log('  Sights:    ', names('PP-19 Vityaz', 'OPTIC').length)
console.log('  Muzzles:   ', names('PP-19 Vityaz', 'MUZZLE').length)
console.log('  Underbarrel:', names('PP-19 Vityaz', 'FOREGRIP').length)
console.log('  Magazines: ', names('PP-19 Vityaz', 'MAGAZINE').length)
console.log('')
console.log('Dataset written to:')
console.log(OUT)
console.log('')


