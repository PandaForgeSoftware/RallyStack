import { spawn } from 'node:child_process'

const scripts = [
  'scripts/sync-wardogs-packable-items.mjs',
  'scripts/sync-wardogs-combat-data.mjs',
  'scripts/sync-wardogs-zone-attachments.mjs',
]

function run(
  script,
) {

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      console.log('')
      console.log(
        `===== ${script} =====`,
      )

      const child =
        spawn(
          process.execPath,
          [
            script,
          ],
          {
            stdio:
              'inherit',
          },
        )

      child.on(
        'exit',
        (code) => {

          if (
            code ===
            0
          ) {
            resolve()
            return
          }

          reject(
            new Error(
              `${script} failed with exit code ${code}`,
            ),
          )
        },
      )
    },
  )
}

for (
  const script of
  scripts
) {

  await run(
    script,
  )
}

console.log('')
console.log(
  'ALL WARDOGS DATA SYNCS PASSED',
)
