import fs from 'node:fs'

const DATA_URL =
  new URL('./lfg-data.json', import.meta.url)

function emptyState() {
  return {
    groups: {},
  }
}

function loadState() {
  try {
    if (
      !fs.existsSync(DATA_URL)
    ) {
      return emptyState()
    }

    const raw =
      fs.readFileSync(
        DATA_URL,
        'utf8'
      )

    if (!raw.trim()) {
      return emptyState()
    }

    const parsed =
      JSON.parse(raw)

    if (
      !parsed.groups ||
      typeof parsed.groups !== 'object'
    ) {
      parsed.groups = {}
    }

    return parsed
  }
  catch (error) {
    console.error(
      '[LFG STORE] Read failed',
      error
    )

    return emptyState()
  }
}

function saveState(
  state
) {
  fs.writeFileSync(
    DATA_URL,
    JSON.stringify(
      state,
      null,
      2
    ),
    'utf8'
  )
}

export function getAllGroups() {
  return Object.values(
    loadState().groups
  )
}

export function getGroup(
  groupId
) {
  const state =
    loadState()

  return (
    state.groups[groupId] ??
    null
  )
}

export function saveGroup(
  group
) {
  const state =
    loadState()

  state.groups[group.id] =
    group

  saveState(
    state
  )

  return group
}

export function deleteGroup(
  groupId
) {
  const state =
    loadState()

  delete state.groups[groupId]

  saveState(
    state
  )
}

export function getActiveGroupForUser(
  userId
) {
  return (
    getAllGroups().find(
      group =>
        group.status !== 'closed' &&
        group.memberIds?.includes(
          userId
        )
    ) ?? null
  )
}

export function getOwnedGroup(
  userId
) {
  return (
    getAllGroups().find(
      group =>
        group.status !== 'closed' &&
        group.ownerId === userId
    ) ?? null
  )
}

export function getGroupByVoiceChannel(
  channelId
) {
  return (
    getAllGroups().find(
      group =>
        group.voiceChannelId ===
        channelId
    ) ?? null
  )
}