import {
  readFile,
} from 'node:fs/promises'
import {
  fileURLToPath,
} from 'node:url'
import {
  Events,
} from 'discord.js'

const DATA_FILE =
  fileURLToPath(
    new URL(
      './lfg-data.json',
      import.meta.url,
    ),
  )

const SYNC_INTERVAL_MS =
  10_000

const ACTIVE_STATUSES =
  new Set([
    'recruiting',
    'running',
    'full',
  ])

function backendConfig() {
  const url =
    process.env
      .RALLYSTACK_SUPABASE_URL

  const key =
    process.env
      .RALLYSTACK_SUPABASE_SECRET_KEY

  if (
    !url ||
    !key
  ) {
    throw new Error(
      'RallyStack Supabase bot configuration is missing.',
    )
  }

  return {
    url,
    key,
  }
}

function apiHeaders(
  key,
  extra = {},
) {
  return {
    apikey:
      key,

    Authorization:
      `Bearer ${key}`,

    'Content-Type':
      'application/json',

    ...extra,
  }
}

async function api(
  path,
  options = {},
) {
  const {
    url,
    key,
  } =
    backendConfig()

  const response =
    await fetch(
      `${url}/rest/v1/${path}`,
      {
        ...options,

        headers:
          apiHeaders(
            key,
            options.headers ||
              {},
          ),
      },
    )

  if (!response.ok) {
    const body =
      await response.text()

    throw new Error(
      `Supabase ${response.status}: ${body}`,
    )
  }

  if (
    response.status ===
    204
  ) {
    return null
  }

  const text =
    await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(
    text,
  )
}

async function readLocalGroups() {
  try {
    const raw =
      await readFile(
        DATA_FILE,
        'utf8',
      )

    if (!raw.trim()) {
      return []
    }

    const parsed =
      JSON.parse(
        raw,
      )

    if (
      Array.isArray(
        parsed,
      )
    ) {
      return parsed
    }

    if (
      Array.isArray(
        parsed?.groups,
      )
    ) {
      return parsed.groups
    }

    if (
      parsed &&
      typeof parsed ===
        'object'
    ) {
      return Object.values(
        parsed,
      ).filter(
        item =>
          item &&
          typeof item ===
            'object' &&
          item.id,
      )
    }

    return []
  }
  catch (error) {
    if (
      error?.code ===
      'ENOENT'
    ) {
      return []
    }

    throw error
  }
}

function isLiveGroup(
  group,
) {
  const status =
    group.status ||
    'recruiting'

  if (
    !ACTIVE_STATUSES.has(
      status,
    )
  ) {
    return false
  }

  if (
    group.expiresAt
  ) {
    const expires =
      Date.parse(
        group.expiresAt,
      )

    if (
      Number.isFinite(
        expires,
      ) &&
      expires <=
        Date.now()
    ) {
      return false
    }
  }

  return true
}

async function loadDiscordLinks() {
  return (
    await api(
      'linked_accounts?provider=eq.discord&select=user_id,provider_user_id,provider_username',
    )
  ) || []
}

async function loadProfiles() {
  return (
    await api(
      'profiles?select=id,in_game_name,region,play_style',
    )
  ) || []
}

async function loadRemoteGroups() {
  return (
    await api(
      'lfg_groups?select=id,legacy_group_id,status,expires_at',
    )
  ) || []
}

async function closeRemoteGroup(
  group,
) {
  const expired =
    group.expires_at &&
    Date.parse(
      group.expires_at,
    ) <= Date.now()

  await api(
    `lfg_groups?id=eq.${group.id}`,
    {
      method:
        'PATCH',

      headers: {
        Prefer:
          'return=minimal',
      },

      body:
        JSON.stringify({
          status:
            expired
              ? 'expired'
              : 'closed',

          closed_at:
            new Date()
              .toISOString(),
        }),
    },
  )

  await api(
    `lfg_members?group_id=eq.${group.id}&active=eq.true`,
    {
      method:
        'PATCH',

      headers: {
        Prefer:
          'return=minimal',
      },

      body:
        JSON.stringify({
          active:
            false,

          left_at:
            new Date()
              .toISOString(),
        }),
    },
  )
}

async function upsertRemoteGroup(
  group,
  guildId,
  accountByDiscord,
  profileByUser,
) {
  const ownerAccount =
    accountByDiscord.get(
      group.ownerId,
    )

  const ownerProfile =
    ownerAccount
      ? profileByUser.get(
          ownerAccount.user_id,
        )
      : null

  const memberIds =
    Array.from(
      new Set([
        group.ownerId,
        ...(
          Array.isArray(
            group.memberIds,
          )
            ? group.memberIds
            : []
        ),
      ].filter(Boolean)),
    )

  let status =
    ACTIVE_STATUSES.has(
      group.status,
    )
      ? group.status
      : 'recruiting'

  if (
    memberIds.length >=
    Number(
      group.maxPlayers ||
      5,
    )
  ) {
    status =
      'full'
  }

  const serverSource =
    group.serverSource ===
      'steam'
      ? 'steam'
      : group.serverCode
        ? 'manual'
        : 'none'

  const payload = {
    legacy_group_id:
      group.id,

    discord_guild_id:
      guildId,

    creator_user_id:
      ownerAccount
        ?.user_id ||
      null,

    creator_discord_user_id:
      group.ownerId,

    creator_display_name:
      ownerProfile
        ?.in_game_name ||
      ownerAccount
        ?.provider_username ||
      group.ownerId,

    activity:
      group.activityKey ||
      'general',

    custom_activity:
      group.activityLabel ||
      null,

    region:
      ownerProfile
        ?.region ||
      null,

    play_style:
      ownerProfile
        ?.play_style ||
      null,

    max_players:
      Math.max(
        2,
        Math.min(
          12,
          Number(
            group.maxPlayers ||
            5,
          ),
        ),
      ),

    mic_required:
      Boolean(
        group.micRequired,
      ),

    note:
      group.note ||
      null,

    server_code:
      group.serverCode ||
      null,

    server_source:
      serverSource,

    steam_game_id:
      group.steamGameId ||
      null,

    status,

    public_channel_id:
      group.channelId ||
      null,

    public_message_id:
      group.messageId ||
      null,

    text_channel_id:
      group.textChannelId ||
      null,

    voice_channel_id:
      group.voiceChannelId ||
      null,

    created_at:
      group.createdAt ||
      new Date()
        .toISOString(),

    expires_at:
      group.expiresAt ||
      new Date(
        Date.now() +
          2 * 60 * 60 * 1000,
      ).toISOString(),

    closed_at:
      null,
  }

  const result =
    await api(
      'lfg_groups?on_conflict=legacy_group_id',
      {
        method:
          'POST',

        headers: {
          Prefer:
            'resolution=merge-duplicates,return=representation',
        },

        body:
          JSON.stringify(
            payload,
          ),
      },
    )

  const remoteGroup =
    result?.[0]

  if (
    !remoteGroup?.id
  ) {
    throw new Error(
      `Supabase did not return an ID for LFG ${group.id}`,
    )
  }

  await api(
    `lfg_members?group_id=eq.${remoteGroup.id}&active=eq.true`,
    {
      method:
        'PATCH',

      headers: {
        Prefer:
          'return=minimal',
      },

      body:
        JSON.stringify({
          active:
            false,

          left_at:
            new Date()
              .toISOString(),
        }),
    },
  )

  for (
    const discordUserId of
    memberIds
  ) {
    const account =
      accountByDiscord.get(
        discordUserId,
      )

    const profile =
      account
        ? profileByUser.get(
            account.user_id,
          )
        : null

    await api(
      'lfg_members?on_conflict=group_id,discord_user_id',
      {
        method:
          'POST',

        headers: {
          Prefer:
            'resolution=merge-duplicates,return=minimal',
        },

        body:
          JSON.stringify({
            group_id:
              remoteGroup.id,

            user_id:
              account
                ?.user_id ||
              null,

            discord_user_id:
              discordUserId,

            display_name:
              profile
                ?.in_game_name ||
              account
                ?.provider_username ||
              discordUserId,

            is_creator:
              discordUserId ===
              group.ownerId,

            active:
              true,

            left_at:
              null,
          }),
      },
    )
  }

  return {
    remoteGroup,
    memberCount:
      memberIds.length,
  }
}

async function syncLfgState(
  guildId,
) {
  const allLocalGroups =
    await readLocalGroups()

  const localGroups =
    allLocalGroups.filter(
      isLiveGroup,
    )

  const [
    accounts,
    profiles,
    remoteGroups,
  ] =
    await Promise.all([
      loadDiscordLinks(),
      loadProfiles(),
      loadRemoteGroups(),
    ])

  const accountByDiscord =
    new Map(
      accounts.map(
        account => [
          account.provider_user_id,
          account,
        ],
      ),
    )

  const profileByUser =
    new Map(
      profiles.map(
        profile => [
          profile.id,
          profile,
        ],
      ),
    )

  const localIds =
    new Set(
      localGroups.map(
        group =>
          group.id,
      ),
    )

  for (
    const remoteGroup of
    remoteGroups
  ) {
    if (
      !localIds.has(
        remoteGroup
          .legacy_group_id,
      ) &&
      ACTIVE_STATUSES.has(
        remoteGroup.status,
      )
    ) {
      await closeRemoteGroup(
        remoteGroup,
      )
    }
  }

  let memberTotal = 0

  for (
    const group of
    localGroups
  ) {
    try {
      const result =
        await upsertRemoteGroup(
          group,
          guildId,
          accountByDiscord,
          profileByUser,
        )

      memberTotal +=
        result.memberCount
    }
    catch (error) {
      console.error(
        `[LFG DB] Could not sync group ${group.id}`,
        error?.message ||
          error,
      )
    }
  }

  console.log(
    `[LFG DB] synced ${localGroups.length} group(s) / ${memberTotal} player(s)`,
  )
}

export function registerLfgSupabaseSync(
  client,
  config,
) {
  client.once(
    Events.ClientReady,
    async () => {
      try {
        await syncLfgState(
          config.guildId,
        )

        console.log(
          '[LFG DB] Discord LFG -> Supabase sync ACTIVE',
        )
      }
      catch (error) {
        console.error(
          '[LFG DB] Initial sync failed',
          error?.message ||
            error,
        )
      }

      setInterval(
        () => {
          syncLfgState(
            config.guildId,
          ).catch(
            error =>
              console.error(
                '[LFG DB] Scheduled sync failed',
                error?.message ||
                  error,
              ),
          )
        },
        SYNC_INTERVAL_MS,
      ).unref()
    },
  )
}