import {
  ChannelType,
  Events,
  PermissionFlagsBits,
} from 'discord.js'

const SYNC_INTERVAL_MS =
  60_000

const STAFF_ROLES = [
  'Founder',
  'Administrator',
  'Moderator',
  'RallyStack Team',
]

const SQUAD_LEADER_ROLE =
  'Squad Leader'

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
      'RallyStack Supabase bot configuration is missing.'
    )
  }

  return {
    url,
    key,
  }
}

function headers(
  key,
  extra = {}
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
  options = {}
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
          headers(
            key,
            options.headers ??
              {}
          ),
      }
    )

  if (!response.ok) {
    const body =
      await response.text()

    throw new Error(
      `Supabase ${response.status}: ${body}`
    )
  }

  if (
    response.status === 204
  ) {
    return null
  }

  const text =
    await response.text()

  if (!text) {
    return null
  }

  return JSON.parse(
    text
  )
}

async function loadState() {
  const [
    squads,
    memberships,
    discordAccounts,
    resources,
  ] =
    await Promise.all([
      api(
        'squads?select=id,name,tag,created_by,discord_role_id,discord_category_id'
      ),

      api(
        'squad_members?select=id,squad_id,user_id,role'
      ),

      api(
        'linked_accounts?provider=eq.discord&select=user_id,provider_user_id,provider_username'
      ),

      api(
        'discord_squad_resources?select=*'
      ),
    ])

  return {
    squads:
      squads ?? [],

    memberships:
      memberships ?? [],

    discordAccounts:
      discordAccounts ?? [],

    resources:
      resources ?? [],
  }
}

async function saveResource(
  resource
) {
  const result =
    await api(
      'discord_squad_resources?on_conflict=squad_id',
      {
        method:
          'POST',

        headers: {
          Prefer:
            'resolution=merge-duplicates,return=representation',
        },

        body:
          JSON.stringify(
            resource
          ),
      }
    )

  return result?.[0] ??
    resource
}

async function deleteResourceRow(
  squadId
) {
  await api(
    `discord_squad_resources?squad_id=eq.${squadId}`,
    {
      method:
        'DELETE',

      headers: {
        Prefer:
          'return=minimal',
      },
    }
  )
}

async function updateSquadDiscordIds(
  squadId,
  roleId,
  categoryId
) {
  await api(
    `squads?id=eq.${squadId}`,
    {
      method:
        'PATCH',

      headers: {
        Prefer:
          'return=minimal',
      },

      body:
        JSON.stringify({
          discord_role_id:
            roleId,

          discord_category_id:
            categoryId,
        }),
    }
  )
}

function roleName(
  squad
) {
  return `${squad.name} [${squad.tag}]`
    .slice(
      0,
      100
    )
}

function categoryName(
  squad
) {
  return `🛡️ ${squad.name.toUpperCase()} [${squad.tag}]`
    .slice(
      0,
      100
    )
}

async function fetchChannel(
  guild,
  channelId
) {
  if (!channelId) {
    return null
  }

  try {
    return await guild.channels.fetch(
      channelId
    )
  }
  catch {
    return null
  }
}

async function fetchRole(
  guild,
  roleId
) {
  if (!roleId) {
    return null
  }

  try {
    return await guild.roles.fetch(
      roleId
    )
  }
  catch {
    return null
  }
}

async function ensureSquadRole(
  guild,
  squad,
  resource
) {
  let role =
    await fetchRole(
      guild,
      resource?.role_id
    )

  if (!role) {
    role =
      guild.roles.cache.find(
        item =>
          item.name ===
          roleName(
            squad
          )
      ) ?? null
  }

  if (!role) {
    role =
      await guild.roles.create({
        name:
          roleName(
            squad
          ),

        reason:
          `RallyStack squad ${squad.tag}`,
      })

    console.log(
      `[SQUAD] Created role ${role.name}`
    )
  }

  if (
    role.name !==
    roleName(
      squad
    )
  ) {
    await role.setName(
      roleName(
        squad
      ),

      'RallyStack squad renamed'
    )
  }

  return role
}

async function configureCategoryPermissions(
  guild,
  category,
  squadRole
) {
  await category
    .permissionOverwrites
    .edit(
      guild.roles.everyone.id,
      {
        ViewChannel:
          false,
      }
    )

  await category
    .permissionOverwrites
    .edit(
      squadRole.id,
      {
        ViewChannel:
          true,

        ReadMessageHistory:
          true,

        SendMessages:
          true,

        Connect:
          true,

        Speak:
          true,
      }
    )

  for (
    const staffName of
    STAFF_ROLES
  ) {
    const staffRole =
      guild.roles.cache.find(
        role =>
          role.name ===
          staffName
      )

    if (!staffRole) {
      continue
    }

    await category
      .permissionOverwrites
      .edit(
        staffRole.id,
        {
          ViewChannel:
            true,

          ReadMessageHistory:
            true,

          SendMessages:
            true,

          Connect:
            true,

          Speak:
            true,
        }
      )
  }

  if (
    guild.members.me
  ) {
    await category
      .permissionOverwrites
      .edit(
        guild.members.me.id,
        {
          ViewChannel:
            true,

          ReadMessageHistory:
            true,

          SendMessages:
            true,

          ManageChannels:
            true,

          Connect:
            true,

          Speak:
            true,

          MoveMembers:
            true,
        }
      )
  }
}

async function ensureSquadCategory(
  guild,
  squad,
  resource,
  squadRole
) {
  let category =
    await fetchChannel(
      guild,
      resource
        ?.category_id
    )

  if (
    category &&
    category.type !==
      ChannelType.GuildCategory
  ) {
    category =
      null
  }

  if (!category) {
    category =
      guild.channels.cache.find(
        channel =>
          channel.type ===
            ChannelType.GuildCategory &&
          channel.name ===
            categoryName(
              squad
            )
      ) ?? null
  }

  if (!category) {
    category =
      await guild.channels.create({
        name:
          categoryName(
            squad
          ),

        type:
          ChannelType.GuildCategory,

        reason:
          `RallyStack squad ${squad.tag}`,
      })

    console.log(
      `[SQUAD] Created category ${category.name}`
    )
  }

  if (
    category.name !==
    categoryName(
      squad
    )
  ) {
    await category.setName(
      categoryName(
        squad
      )
    )
  }

  await configureCategoryPermissions(
    guild,
    category,
    squadRole
  )

  return category
}

async function ensureTextChannel(
  guild,
  resource,
  category
) {
  let channel =
    await fetchChannel(
      guild,
      resource
        ?.text_channel_id
    )

  if (
    channel &&
    channel.type !==
      ChannelType.GuildText
  ) {
    channel =
      null
  }

  if (!channel) {
    channel =
      guild.channels.cache.find(
        item =>
          item.parentId ===
            category.id &&
          item.type ===
            ChannelType.GuildText &&
          item.name ===
            'squad-chat'
      ) ?? null
  }

  if (!channel) {
    channel =
      await guild.channels.create({
        name:
          'squad-chat',

        type:
          ChannelType.GuildText,

        parent:
          category.id,

        topic:
          'Private RallyStack squad channel.',

        reason:
          'RallyStack squad sync',
      })

    console.log(
      `[SQUAD] Created #${channel.name}`
    )
  }

  if (
    channel.parentId !==
    category.id
  ) {
    await channel.setParent(
      category.id,
      {
        lockPermissions:
          true,
      }
    )
  }

  try {
    await channel
      .lockPermissions()
  }
  catch {
    // Already synced.
  }

  return channel
}

async function ensureVoiceChannel(
  guild,
  resource,
  category
) {
  let channel =
    await fetchChannel(
      guild,
      resource
        ?.voice_channel_id
    )

  if (
    channel &&
    channel.type !==
      ChannelType.GuildVoice
  ) {
    channel =
      null
  }

  if (!channel) {
    channel =
      guild.channels.cache.find(
        item =>
          item.parentId ===
            category.id &&
          item.type ===
            ChannelType.GuildVoice &&
          item.name ===
            'Squad Voice'
      ) ?? null
  }

  if (!channel) {
    channel =
      await guild.channels.create({
        name:
          'Squad Voice',

        type:
          ChannelType.GuildVoice,

        parent:
          category.id,

        reason:
          'RallyStack squad sync',
      })

    console.log(
      `[SQUAD] Created voice ${channel.name}`
    )
  }

  if (
    channel.parentId !==
    category.id
  ) {
    await channel.setParent(
      category.id,
      {
        lockPermissions:
          true,
      }
    )
  }

  try {
    await channel
      .lockPermissions()
  }
  catch {
    // Already synced.
  }

  return channel
}

async function ensureSquadResources(
  guild,
  squad,
  existingResource
) {
  const role =
    await ensureSquadRole(
      guild,
      squad,
      existingResource
    )

  const category =
    await ensureSquadCategory(
      guild,
      squad,
      existingResource,
      role
    )

  const text =
    await ensureTextChannel(
      guild,
      existingResource,
      category
    )

  const voice =
    await ensureVoiceChannel(
      guild,
      existingResource,
      category
    )

  const resource =
    await saveResource({
      squad_id:
        squad.id,

      guild_id:
        guild.id,

      role_id:
        role.id,

      category_id:
        category.id,

      text_channel_id:
        text.id,

      voice_channel_id:
        voice.id,
    })

  await updateSquadDiscordIds(
    squad.id,
    role.id,
    category.id
  )

  return {
    resource,
    role,
    category,
    text,
    voice,
  }
}

async function safeDeleteChannel(
  guild,
  channelId
) {
  const channel =
    await fetchChannel(
      guild,
      channelId
    )

  if (!channel) {
    return
  }

  try {
    await channel.delete(
      'RallyStack squad removed'
    )
  }
  catch (error) {
    console.error(
      `[SQUAD] Could not delete channel ${channelId}`,
      error?.message ??
        error
    )
  }
}

async function safeDeleteRole(
  guild,
  roleId
) {
  const role =
    await fetchRole(
      guild,
      roleId
    )

  if (!role) {
    return
  }

  try {
    await role.delete(
      'RallyStack squad removed'
    )
  }
  catch (error) {
    console.error(
      `[SQUAD] Could not delete role ${roleId}`,
      error?.message ??
        error
    )
  }
}

async function cleanRemovedSquads(
  guild,
  squads,
  resources
) {
  const activeIds =
    new Set(
      squads.map(
        squad =>
          squad.id
      )
    )

  for (
    const resource of
    resources
  ) {
    if (
      activeIds.has(
        resource.squad_id
      )
    ) {
      continue
    }

    console.log(
      `[SQUAD] Cleaning deleted squad ${resource.squad_id}`
    )

    await safeDeleteChannel(
      guild,
      resource.text_channel_id
    )

    await safeDeleteChannel(
      guild,
      resource.voice_channel_id
    )

    await safeDeleteChannel(
      guild,
      resource.category_id
    )

    await safeDeleteRole(
      guild,
      resource.role_id
    )

    await deleteResourceRow(
      resource.squad_id
    )
  }
}

async function syncMemberRoles(
  guild,
  squads,
  memberships,
  discordAccounts,
  squadResources
) {
  const accountByUser =
    new Map(
      discordAccounts.map(
        account => [
          account.user_id,
          account,
        ]
      )
    )

  const membershipByUser =
    new Map(
      memberships.map(
        membership => [
          membership.user_id,
          membership,
        ]
      )
    )

  const resourceBySquad =
    new Map(
      squadResources.map(
        item => [
          item.squad_id,
          item,
        ]
      )
    )

  const squadRoleIds =
    new Set(
      squadResources
        .map(
          item =>
            item.role_id
        )
        .filter(
          Boolean
        )
    )

  const leaderRole =
    guild.roles.cache.find(
      role =>
        role.name ===
        SQUAD_LEADER_ROLE
    ) ?? null

  const ownerUserIds =
    new Set(
      memberships
        .filter(
          membership =>
            membership.role ===
            'owner'
        )
        .map(
          membership =>
            membership.user_id
        )
    )

  for (
    const account of
    discordAccounts
  ) {
    const discordId =
      account.provider_user_id

    let member

    try {
      member =
        await guild.members.fetch(
          discordId
        )
    }
    catch {
      continue
    }

    const membership =
      membershipByUser.get(
        account.user_id
      )

    const desiredRoleId =
      membership
        ? resourceBySquad.get(
            membership.squad_id
          )?.role_id
        : null

    for (
      const roleId of
      squadRoleIds
    ) {
      const hasRole =
        member.roles.cache.has(
          roleId
        )

      const shouldHave =
        roleId ===
        desiredRoleId

      if (
        shouldHave &&
        !hasRole
      ) {
        try {
          await member.roles.add(
            roleId,
            'RallyStack squad membership sync'
          )
        }
        catch (error) {
          console.error(
            `[SQUAD] Could not add squad role to ${member.user.username}`,
            error?.message ??
              error
          )
        }
      }

      if (
        !shouldHave &&
        hasRole
      ) {
        try {
          await member.roles.remove(
            roleId,
            'RallyStack squad membership sync'
          )
        }
        catch (error) {
          console.error(
            `[SQUAD] Could not remove squad role from ${member.user.username}`,
            error?.message ??
              error
          )
        }
      }
    }

    if (leaderRole) {
      const shouldLead =
        ownerUserIds.has(
          account.user_id
        )

      const hasLeader =
        member.roles.cache.has(
          leaderRole.id
        )

      if (
        shouldLead &&
        !hasLeader
      ) {
        try {
          await member.roles.add(
            leaderRole,
            'RallyStack squad owner'
          )
        }
        catch (error) {
          console.error(
            '[SQUAD] Could not add Squad Leader role',
            error?.message ??
              error
          )
        }
      }

      if (
        !shouldLead &&
        hasLeader
      ) {
        try {
          await member.roles.remove(
            leaderRole,
            'No longer a RallyStack squad owner'
          )
        }
        catch (error) {
          console.error(
            '[SQUAD] Could not remove Squad Leader role',
            error?.message ??
              error
          )
        }
      }
    }
  }
}

async function runSquadSync(
  guild
) {
  console.log(
    '[SQUAD] Sync starting...'
  )

  await guild.roles.fetch()
  await guild.channels.fetch()

  const state =
    await loadState()

  await cleanRemovedSquads(
    guild,
    state.squads,
    state.resources
  )

  const resourceMap =
    new Map(
      state.resources.map(
        resource => [
          resource.squad_id,
          resource,
        ]
      )
    )

  const freshResources = []

  for (
    const squad of
    state.squads
  ) {
    try {
      const ensured =
        await ensureSquadResources(
          guild,
          squad,
          resourceMap.get(
            squad.id
          )
        )

      freshResources.push(
        ensured.resource
      )
    }
    catch (error) {
      console.error(
        `[SQUAD] Resource sync failed for ${squad.name}`,
        error?.message ??
          error
      )
    }
  }

  await syncMemberRoles(
    guild,
    state.squads,
    state.memberships,
    state.discordAccounts,
    freshResources
  )

  console.log(
    `[SQUAD] Sync complete: ${state.squads.length} squads`
  )
}

export function registerSquadSync(
  client,
  config
) {
  client.once(
    Events.ClientReady,

    async readyClient => {
      try {
        const guild =
          await readyClient.guilds.fetch(
            config.guildId
          )

        await runSquadSync(
          guild
        )

        setInterval(
          () => {
            runSquadSync(
              guild
            ).catch(
              error =>
                console.error(
                  '[SQUAD] Scheduled sync failed',
                  error
                )
            )
          },

          SYNC_INTERVAL_MS
        ).unref()

        console.log(
          '[SQUAD] Discord squad sync ACTIVE'
        )
      }
      catch (error) {
        console.error(
          '[SQUAD] Startup failed',
          error
        )
      }
    }
  )
}