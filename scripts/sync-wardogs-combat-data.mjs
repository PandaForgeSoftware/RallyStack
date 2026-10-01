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
    'src/data/wardogsCombatData.js',
  )

const auditFile =
  path.join(
    root,
    'src/data/wardogsCombatAudit.json',
  )

const assetFolder =
  path.join(
    root,
    'public/wardogs/items',
  )

const ATTACHMENTS_URL =
  'https://wardogslab.com/en/database/category/attachments'

const USER_AGENT =
  'RallyStack-Community-Loadout-Builder/3.0'

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
  match,
  index = 1,
) {

  if (
    !match?.[index]
  ) {
    return null
  }

  const value =
    Number(
      String(
        match[index],
      )
        .replaceAll(
          ',',
          '',
        ),
    )

  return Number.isFinite(
    value,
  )
    ? value
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

  return encoded
    ? decodeURIComponent(
        encoded[0],
      )
    : null
}

function attachmentType(
  text,
) {

  const checks = [
    [
      'MAGAZINE',
      /\bMagazines\b/i,
    ],
    [
      'OPTIC',
      /\bOptics\b/i,
    ],
    [
      'MUZZLE',
      /\bMuzzles\b/i,
    ],
    [
      'FOREGRIP',
      /\bForegrips\b/i,
    ],
    [
      'HANDGUARD',
      /\bHandguards\b/i,
    ],
    [
      'BARREL',
      /\bBarrels\b/i,
    ],
    [
      'OTHER',
      /\bOther\b/i,
    ],
  ]

  return (
    checks.find(
      ([, matcher]) =>
        matcher.test(
          text,
        ),
    )?.[0] ||
    'OTHER'
  )
}

function compatibilitySegment(
  text,
) {

  const start =
    text.search(
      /Compatibility|Compatible with|Compatible attachments/i,
    )

  if (
    start <
    0
  ) {
    return ''
  }

  const tail =
    text.slice(
      start,
    )

  const end =
    tail.search(
      /Builds with|Alternatives|Does something look wrong|CatalogueLast updated/i,
    )

  return end > 0
    ? tail.slice(
        0,
        end,
      )
    : tail
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
  'Reading WARDOGS LAB attachments catalogue...',
)

const catalogueHtml =
  await fetchText(
    ATTACHMENTS_URL,
  )

const candidateMap =
  new Map()

for (
  const match of
  catalogueHtml.matchAll(
    /<a\b[^>]*href=["'](?<href>(?:https:\/\/wardogslab\.com)?\/en\/database\/(?!category\/)[^"'?#]+)["'][^>]*>(?<body>[\s\S]*?)<\/a>/gi,
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

  candidateMap.set(
    href,
    {
      href,
      cardText:
        plainText(
          match.groups?.body,
        ),
    },
  )
}

const candidates =
  Array.from(
    candidateMap.values(),
  )

console.log(
  `Attachment links discovered: ${candidates.length}`,
)

if (
  candidates.length <
  90
) {

  throw new Error(
    'Attachment catalogue returned too few records. Existing generated data was not touched.',
  )
}

const attachmentResults =
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
            error:
              'No item name',
            url,
          }
        }

        const price =
          safeNumber(
            text.match(
              /Price per life\s*\$([\d,]+)/i,
            ),
          )

        const weight =
          safeNumber(
            text.match(
              /Weight\s*([\d.]+)\s*kg/i,
            ),
          )

        const inventory =
          text.match(
            /Inventory\s*(\d+)\s*(?:×|x)\s*(\d+)/i,
          )

        const unlock =
          text.match(
            /Unlock\s*(Career|Infantry|Medic|Recon|Support)?\s*(?:lvl\.?\s*)?(\d+)?\s*(?:·\s*\$([\d,]+)\s*to unlock)?/i,
          )

        const segment =
          compatibilitySegment(
            text,
          )

        const compatibleWeapons =
          weapons
            .filter(
              (weapon) =>
                segment
                  .toLowerCase()
                  .includes(
                    weapon.name
                      .toLowerCase(),
                  ),
            )
            .map(
              (weapon) =>
                weapon.id,
            )

        const slug =
          candidate.href
            .split(
              '/',
            )
            .filter(Boolean)
            .at(-1)

        const id =
          `attachment-${safeSlug(
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

            image =
              null
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
            `Processed attachments ${index + 1}/${candidates.length}`,
          )
        }

        return {
          id,
          name,
          type:
            attachmentType(
              `${candidate.cardText} ${text}`,
            ),
          price,
          weight,
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
          unlockCost:
            unlock?.[3]
              ? Number(
                  unlock[3]
                    .replaceAll(
                      ',',
                      '',
                    ),
                )
              : null,
          compatibleWeapons,
          sourceUrl:
            url,
          image,
        }
      }
      catch (
        error
      ) {

        return {
          error:
            error.message,
          url,
        }
      }
    },
  )

const attachmentItems =
  attachmentResults.filter(
    (item) =>
      item &&
      !item.error,
  )

if (
  attachmentItems.length <
  90
) {

  throw new Error(
    `Only ${attachmentItems.length} attachments parsed. Existing generated data was not touched.`,
  )
}

const attachmentNames =
  attachmentItems.map(
    (item) =>
      item.name,
  )

console.log('')
console.log(
  'Reading current weapon stats...',
)

const weaponResults =
  await mapLimit(
    weapons,
    6,
    async (
      weapon,
      index,
    ) => {

      const slug =
        safeSlug(
          weapon.name,
        )

      const url =
        `https://wardogslab.com/en/database/${slug}`

      try {

        const html =
          await fetchText(
            url,
          )

        const text =
          plainText(
            html,
          )

        const segment =
          compatibilitySegment(
            text,
          )

        const compatibleAttachments =
          attachmentNames.filter(
            (name) =>
              segment
                .toLowerCase()
                .includes(
                  name
                    .toLowerCase(),
                ),
          )

        if (
          (
            index +
            1
          ) %
            10 ===
          0
        ) {

          console.log(
            `Processed weapons ${index + 1}/${weapons.length}`,
          )
        }

        return {
          id:
            weapon.id,
          name:
            weapon.name,
          sourceUrl:
            url,
          price:
            safeNumber(
              text.match(
                /Price per life\s*\$([\d,]+)/i,
              ),
            ),
          weight:
            safeNumber(
              text.match(
                /Weight\s*([\d.]+)\s*kg/i,
              ),
            ),
          damage:
            safeNumber(
              text.match(
                /Damage per round\s*([\d.]+)/i,
              ),
            ),
          rpm:
            safeNumber(
              text.match(
                /Rate of fire\s*([\d.]+)\s*rpm/i,
              ),
            ),
          accuracy:
            safeNumber(
              text.match(
                /Accuracy\s*([\d.]+)\s*MOA/i,
              ),
            ),
          muzzleVelocity:
            safeNumber(
              text.match(
                /Muzzle velocity\s*([\d.]+)\s*m\/s/i,
              ),
            ),
          effectiveRange:
            safeNumber(
              text.match(
                /Effective range\s*([\d.]+)\s*m/i,
              ),
            ),
          adsTime:
            safeNumber(
              text.match(
                /ADS time\s*([\d.]+)s/i,
              ),
            ),
          adsZoom:
            safeNumber(
              text.match(
                /ADS zoom\s*([\d.]+)×/i,
              ),
            ),
          compatibleAttachments,
        }
      }
      catch (
        error
      ) {

        return {
          id:
            weapon.id,
          name:
            weapon.name,
          sourceUrl:
            url,
          error:
            error.message,
        }
      }
    },
  )

const successfulWeapons =
  weaponResults.filter(
    (item) =>
      !item.error,
  )

if (
  successfulWeapons.length <
  Math.max(
    20,
    Math.floor(
      weapons.length *
      0.7,
    ),
  )
) {

  throw new Error(
    `Only ${successfulWeapons.length}/${weapons.length} weapon pages parsed. Existing generated data was not touched.`,
  )
}

const weaponLiveData =
  Object.fromEntries(
    weaponResults.map(
      (item) => [
        item.id,
        item,
      ],
    ),
  )

const output =
  `/*
 * Auto-generated by:
 *   node scripts/sync-wardogs-combat-data.mjs
 *
 * Source: WARDOGS LAB.
 * Unknown values deliberately remain null.
 */

export const combatDataMeta = ${JSON.stringify(
    {
      syncedAt:
        new Date()
          .toISOString(),
      attachmentCount:
        attachmentItems.length,
      weaponCount:
        successfulWeapons.length,
      source:
        'WARDOGS LAB',
    },
    null,
    2,
  )}

export const attachmentItems = ${JSON.stringify(
    attachmentItems,
    null,
    2,
  )}

export const weaponLiveData = ${JSON.stringify(
    weaponLiveData,
    null,
    2,
  )}
`

const audit = {
  generatedAt:
    new Date()
      .toISOString(),
  attachmentCount:
    attachmentItems.length,
  weaponCount:
    successfulWeapons.length,
  attachmentUnknownPrice:
    attachmentItems
      .filter(
        (item) =>
          item.price ===
          null,
      )
      .map(
        (item) =>
          item.name,
      ),
  attachmentUnknownWeight:
    attachmentItems
      .filter(
        (item) =>
          item.weight ===
          null,
      )
      .map(
        (item) =>
          item.name,
      ),
  attachmentMissingImage:
    attachmentItems
      .filter(
        (item) =>
          !item.image,
      )
      .map(
        (item) =>
          item.name,
      ),
  failedWeaponPages:
    weaponResults.filter(
      (item) =>
        item.error,
    ),
}

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
  'WARDOGS COMBAT DATA SYNCED',
)
console.log(
  '========================================',
)
console.log(
  `ATTACHMENTS     ${attachmentItems.length}`,
)
console.log(
  `WEAPONS         ${successfulWeapons.length}/${weapons.length}`,
)
console.log(
  `UNKNOWN PRICE   ${audit.attachmentUnknownPrice.length}`,
)
console.log(
  `UNKNOWN WEIGHT  ${audit.attachmentUnknownWeight.length}`,
)
console.log(
  `MISSING IMAGE   ${audit.attachmentMissingImage.length}`,
)
