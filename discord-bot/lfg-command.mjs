import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Events,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'

import {
  deleteGroup,
  getActiveGroupForUser,
  getAllGroups,
  getGroup,
  getGroupByVoiceChannel,
  getOwnedGroup,
  saveGroup,
} from './lfg-store.mjs'

import {
  randomUUID,
} from 'node:crypto'

// ============================================================
// SETTINGS
// ============================================================

const LFG_LIFETIME_MS =
  2 * 60 * 60 * 1000

const EMPTY_VOICE_DELETE_MS =
  10 * 60 * 1000

const CLOSED_MESSAGE_DELETE_MS =
  30 * 1000

const GAME_ROLES = [
  {
    name: 'Assault',
    emoji: '\u2694\uFE0F',
  },
  {
    name: 'Medic',
    emoji: '\u{1FA79}',
  },
  {
    name: 'Recon',
    emoji: '\u{1F3AF}',
  },
  {
    name: 'Support',
    emoji: '\u{1F6E1}\uFE0F',
  },
  {
    name: 'Driver',
    emoji: '\u{1F69A}',
  },
  {
    name: 'Pilot',
    emoji: '\u{1F681}',
  },
]

const REGIONS = [
  {
    name: 'UK',
    emoji: '\u{1F1EC}\u{1F1E7}',
  },
  {
    name: 'Europe',
    emoji: '\u{1F1EA}\u{1F1FA}',
  },
  {
    name: 'NA East',
    emoji: '\u{1F1FA}\u{1F1F8}',
  },
  {
    name: 'NA West',
    emoji: '\u{1F1FA}\u{1F1F8}',
  },
  {
    name: 'Oceania',
    emoji: '\u{1F1E6}\u{1F1FA}',
  },
  {
    name: 'Asia',
    emoji: '\u{1F30F}',
  },
]

const ACTIVITIES = {
  general: {
    label: 'General Gameplay',
    emoji: '\u{1FA96}',
  },

  builders: {
    label: 'Builders',
    emoji: '\u{1F528}',
  },

  supply: {
    label: 'Supply / Logistics',
    emoji: '\u{1F4E6}',
  },

  assault: {
    label: 'Assault Squad',
    emoji: '\u2694\uFE0F',
  },

  sniper: {
    label: 'Sniper / Recon Squad',
    emoji: '\u{1F3AF}',
  },

  vehicle: {
    label: 'Vehicle Crew',
    emoji: '\u{1F69A}',
  },

  air: {
    label: 'Air Crew',
    emoji: '\u{1F681}',
  },

  other: {
    label: 'Other / Custom',
    emoji: '\u{1F9ED}',
  },
}

const voiceDeleteTimers =
  new Map()

// ============================================================
// HELPERS
// ============================================================

function memberHasRole(
  member,
  roleName
) {
  return member.roles.cache.some(
    role =>
      role.name === roleName
  )
}

function getPlayerRoles(
  member
) {
  return GAME_ROLES.filter(
    role =>
      memberHasRole(
        member,
        role.name
      )
  )
}

function getPlayerRegion(
  member
) {
  return (
    REGIONS.find(
      region =>
        memberHasRole(
          member,
          region.name
        )
    ) ?? null
  )
}

function isMember(
  member
) {
  return memberHasRole(
    member,
    'Member'
  )
}

function getActivity(
  key
) {
  return (
    ACTIVITIES[key] ??
    ACTIVITIES.other
  )
}

function cleanVoiceName(
  value
) {
  return value
    .replace(
      /[^\p{L}\p{N} _-]/gu,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .slice(
      0,
      80
    )
}

function unix(
  dateValue
) {
  return Math.floor(
    new Date(
      dateValue
    ).getTime() / 1000
  )
}

async function ensureLookingRole(
  guild
) {
  await guild.roles.fetch()

  let role =
    guild.roles.cache.find(
      item =>
        item.name ===
        'Looking To Play'
    )

  if (role) {
    return role
  }

  role =
    await guild.roles.create({
      name:
        'Looking To Play',

      reason:
        'RallyStack LFG status',
    })

  return role
}

async function addLookingRole(
  member
) {
  try {
    const role =
      await ensureLookingRole(
        member.guild
      )

    if (
      !member.roles.cache.has(
        role.id
      )
    ) {
      await member.roles.add(
        role,
        'Active RallyStack LFG'
      )
    }
  }
  catch (error) {
    console.error(
      '[LFG] Looking To Play add failed',
      error?.rawError ?? error
    )
  }
}

async function removeLookingRole(
  member
) {
  try {
    const role =
      member.guild.roles.cache.find(
        item =>
          item.name ===
          'Looking To Play'
      )

    if (
      role &&
      member.roles.cache.has(
        role.id
      )
    ) {
      await member.roles.remove(
        role,
        'No active RallyStack LFG'
      )
    }
  }
  catch (error) {
    console.error(
      '[LFG] Looking To Play removal failed',
      error?.rawError ?? error
    )
  }
}

function findLfgChannel(
  guild
) {
  return (
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildText &&
        channel.name ===
          'looking-for-group'
    ) ?? null
  )
}

// ============================================================
// ACTIVE GROUPS VOICE CATEGORY
// ============================================================

async function ensureVoiceCategory(
  guild
) {
  await guild.channels.fetch()

  let category =
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildCategory &&
        channel.name.includes(
          'ACTIVE GROUPS'
        )
    )

  if (category) {
    return category
  }

  const botMember =
    guild.members.me ??
    await guild.members.fetchMe()

  category =
    await guild.channels.create({
      name:
        '\u{1F50A} ACTIVE GROUPS',

      type:
        ChannelType.GuildCategory,

      permissionOverwrites: [
        {
          id:
            guild.roles.everyone.id,

          deny: [
            PermissionFlagsBits.ViewChannel,
          ],
        },

        {
          id:
            botMember.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],

      reason:
        'RallyStack active LFG voice rooms',
    })

  console.log(
    '[LFG] Created ACTIVE GROUPS voice category'
  )

  return category
}

// ============================================================
// VOICE ROOM
// ============================================================

async function createGroupVoice(
  guild,
  group
) {
  if (
    group.voiceChannelId
  ) {
    try {
      const existing =
        await guild.channels.fetch(
          group.voiceChannelId
        )

      if (existing) {
        return existing
      }
    }
    catch {
      group.voiceChannelId =
        null
    }
  }

  const category =
    await ensureVoiceCategory(
      guild
    )

  const owner =
    await guild.members.fetch(
      group.ownerId
    )

  const activity =
    getActivity(
      group.activityKey
    )

  const roomName =
    cleanVoiceName(
      `${activity.label} - ${owner.displayName}`
    )

  const permissionOverwrites = [
    {
      id:
        guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
      ],
    },
  ]

  for (
    const memberId of
    group.memberIds
  ) {
    permissionOverwrites.push({
      id:
        memberId,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
      ],
    })
  }

  const channel =
    await guild.channels.create({
      name:
        roomName,

      type:
        ChannelType.GuildVoice,

      parent:
        category.id,

      userLimit:
        group.maxPlayers,

      permissionOverwrites,

      reason:
        `RallyStack LFG ${group.id}`,
    })

  group.voiceChannelId =
    channel.id

  group.status =
    'running'

  saveGroup(
    group
  )

  console.log(
    `[LFG] Voice created: ${channel.name}`
  )

  return channel
}

async function allowMemberInVoice(
  guild,
  group,
  memberId
) {
  if (
    !group.voiceChannelId
  ) {
    return
  }

  try {
    const channel =
      await guild.channels.fetch(
        group.voiceChannelId
      )

    if (!channel) {
      return
    }

    await channel.permissionOverwrites.edit(
      memberId,
      {
        ViewChannel: true,
        Connect: true,
        Speak: true,
      }
    )
  }
  catch (error) {
    console.error(
      '[LFG] Voice permission add failed',
      error?.rawError ?? error
    )
  }
}

async function removeMemberFromVoice(
  guild,
  group,
  memberId
) {
  if (
    !group.voiceChannelId
  ) {
    return
  }

  try {
    const channel =
      await guild.channels.fetch(
        group.voiceChannelId
      )

    if (!channel) {
      return
    }

    await channel.permissionOverwrites.delete(
      memberId
    )
  }
  catch {
    // Not fatal.
  }
}

// ============================================================
// GROUP DISPLAY
// ============================================================

function getDisplayStatus(
  group
) {
  if (
    group.status === 'closed'
  ) {
    return '\u26AB CLOSED'
  }

  if (
    group.memberIds.length >=
    group.maxPlayers
  ) {
    return '\u{1F534} FULL'
  }

  if (
    group.status === 'running'
  ) {
    return '\u{1F7E0} GROUP RUNNING'
  }

  return '\u{1F7E2} RECRUITING'
}

async function memberListText(
  guild,
  group
) {
  const lines = []

  for (
    const userId of
    group.memberIds
  ) {
    try {
      const member =
        await guild.members.fetch(
          userId
        )

      const crown =
        userId === group.ownerId
          ? '\u{1F451} '
          : ''

      lines.push(
        `${crown}<@${member.id}>`
      )
    }
    catch {
      lines.push(
        `<@${userId}>`
      )
    }
  }

  return (
    lines.join('\n') ||
    'No players'
  )
}

async function buildGroupEmbed(
  guild,
  group,
  brand
) {
  const owner =
    await guild.members.fetch(
      group.ownerId
    )

  const activity =
    getActivity(
      group.activityKey
    )

  const roles =
    getPlayerRoles(
      owner
    )

  const region =
    getPlayerRegion(
      owner
    )

  const roleText =
    roles.length > 0
      ? roles
          .map(
            role =>
              `${role.emoji} ${role.name}`
          )
          .join('\n')
      : 'Not selected'

  const regionText =
    region
      ? `${region.emoji} ${region.name}`
      : 'Not selected'

  const members =
    await memberListText(
      guild,
      group
    )

  let voiceText =
    'Created when the group starts'

  if (
    group.voiceChannelId
  ) {
    voiceText =
      `<#${group.voiceChannelId}>`
  }

  const embed =
    new EmbedBuilder()

      .setColor(
        brand
      )

      .setAuthor({
        name:
          'RALLYSTACK LOOKING FOR GROUP',
      })

      .setTitle(
        `${activity.emoji} ${activity.label}`
      )

      .setThumbnail(
        owner.displayAvatarURL({
          size: 256,
        })
      )

      .addFields(
        {
          name:
            'Group Leader',

          value:
            `<@${owner.id}>`,

          inline:
            true,
        },

        {
          name:
            'Region',

          value:
            regionText,

          inline:
            true,
        },

        {
          name:
            'Status',

          value:
            getDisplayStatus(
              group
            ),

          inline:
            true,
        },

        {
          name:
            'Leader Roles',

          value:
            roleText,

          inline:
            true,
        },

        {
          name:
            'Players',

          value:
            `**${group.memberIds.length} / ${group.maxPlayers}**`,

          inline:
            true,
        },

        {
          name:
            'Server',

          value:
            group.serverCode
              ? `\`${group.serverCode}\``
              : 'Not supplied',

          inline:
            true,
        },

        {
          name:
            'Group Members',

          value:
            members,

          inline:
            false,
        },

        {
          name:
            'Voice',

          value:
            voiceText,

          inline:
            true,
        },

        {
          name:
            'Expires',

          value:
            `<t:${unix(group.expiresAt)}:R>`,

          inline:
            true,
        }
      )

  if (
    group.note
  ) {
    embed.setDescription(
      group.note
    )
  }

  embed.setFooter({
    text:
      `RALLYSTACK | GROUP ${group.id}`,
  })

  return embed
}

function groupButtons(
  group
) {
  const full =
    group.memberIds.length >=
    group.maxPlayers

  const closed =
    group.status ===
    'closed'

  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()

          .setCustomId(
            `rally_lfg_join:${group.id}`
          )

          .setLabel(
            full
              ? 'Group Full'
              : 'Join Group'
          )

          .setEmoji(
            '\u2795'
          )

          .setStyle(
            ButtonStyle.Success
          )

          .setDisabled(
            full ||
            closed
          ),

        new ButtonBuilder()

          .setCustomId(
            `rally_lfg_leave:${group.id}`
          )

          .setLabel(
            'Leave Group'
          )

          .setEmoji(
            '\u{1F6AA}'
          )

          .setStyle(
            ButtonStyle.Secondary
          )

          .setDisabled(
            closed
          )
      ),
  ]
}

async function updateGroupMessage(
  guild,
  group,
  brand
) {
  if (
    !group.channelId ||
    !group.messageId
  ) {
    return
  }

  try {
    const channel =
      await guild.channels.fetch(
        group.channelId
      )

    const message =
      await channel.messages.fetch(
        group.messageId
      )

    const embed =
      await buildGroupEmbed(
        guild,
        group,
        brand
      )

    await message.edit({
      embeds: [
        embed,
      ],

      components:
        group.status === 'closed'
          ? []
          : groupButtons(
              group
            ),
    })
  }
  catch (error) {
    console.error(
      `[LFG] Could not update group ${group.id}`,
      error?.rawError ?? error
    )
  }
}

// ============================================================
// OWNER MANAGEMENT PANEL
// ============================================================

async function managementPayload(
  guild,
  group
) {
  const activity =
    getActivity(
      group.activityKey
    )

  const voiceText =
    group.voiceChannelId
      ? `<#${group.voiceChannelId}>`
      : 'Not created yet'

  const embed =
    new EmbedBuilder()

      .setTitle(
        'MANAGE YOUR RALLYSTACK GROUP'
      )

      .setDescription(
        [
          `${activity.emoji} **${activity.label}**`,
          '',
          `Players: **${group.memberIds.length} / ${group.maxPlayers}**`,
          `Status: **${getDisplayStatus(group)}**`,
          `Voice: ${voiceText}`,
          `Expires: <t:${unix(group.expiresAt)}:R>`,
        ].join('\n')
      )

  const row =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()

          .setCustomId(
            `rally_lfg_start:${group.id}`
          )

          .setLabel(
            group.voiceChannelId
              ? 'Group Started'
              : 'Start Group'
          )

          .setEmoji(
            '\u25B6\uFE0F'
          )

          .setStyle(
            ButtonStyle.Success
          )

          .setDisabled(
            Boolean(
              group.voiceChannelId
            )
          ),

        new ButtonBuilder()

          .setCustomId(
            `rally_lfg_edit:${group.id}`
          )

          .setLabel(
            'Edit Details'
          )

          .setEmoji(
            '\u270F\uFE0F'
          )

          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()

          .setCustomId(
            `rally_lfg_close:${group.id}`
          )

          .setLabel(
            'Close LFG'
          )

          .setEmoji(
            '\u2716\uFE0F'
          )

          .setStyle(
            ButtonStyle.Danger
          )
      )

  return {
    embeds: [
      embed,
    ],

    components: [
      row,
    ],
  }
}

// ============================================================
// CLOSE GROUP
// ============================================================

async function closeGroup(
  guild,
  group,
  brand,
  reason =
    'closed'
) {
  if (
    group.status === 'closed'
  ) {
    return
  }

  group.status =
    'closed'

  group.closedReason =
    reason

  group.closedAt =
    new Date().toISOString()

  saveGroup(
    group
  )

  for (
    const userId of
    group.memberIds
  ) {
    try {
      const member =
        await guild.members.fetch(
          userId
        )

      await removeLookingRole(
        member
      )
    }
    catch {
      // Member may have left server.
    }
  }

  await updateGroupMessage(
    guild,
    group,
    brand
  )

  // ----------------------------------------------------------
  // PUBLIC CARD CLEANUP
  // ----------------------------------------------------------

  if (
    group.channelId &&
    group.messageId
  ) {
    setTimeout(
      async () => {
        try {
          const channel =
            await guild.channels.fetch(
              group.channelId
            )

          const message =
            await channel.messages.fetch(
              group.messageId
            )

          await message.delete()
        }
        catch {
          // Already gone.
        }
      },

      CLOSED_MESSAGE_DELETE_MS
    )
  }

  // ----------------------------------------------------------
  // VOICE CLEANUP
  // ----------------------------------------------------------

  if (
    group.voiceChannelId
  ) {
    try {
      const voice =
        await guild.channels.fetch(
          group.voiceChannelId
        )

      if (
        !voice ||
        voice.members.size === 0
      ) {
        if (voice) {
          await voice.delete(
            'RallyStack LFG closed'
          )
        }

        deleteGroup(
          group.id
        )
      }
    }
    catch {
      deleteGroup(
        group.id
      )
    }
  }
  else {
    deleteGroup(
      group.id
    )
  }

  console.log(
    `[LFG] Closed ${group.id}: ${reason}`
  )
}

// ============================================================
// COMMAND REGISTRATION
// ============================================================

async function registerCommand(
  guild
) {
  const commands =
    await guild.commands.fetch()

  const existing =
    commands.find(
      command =>
        command.name === 'lfg'
    )

  const data = {
    name:
      'lfg',

    description:
      'Create or manage a RallyStack group',

    options: [
      {
        name:
          'create',

        description:
          'Create a new looking-for-group post',

        type:
          ApplicationCommandOptionType.Subcommand,

        options: [
          {
            name:
              'activity',

            description:
              'What is your group doing?',

            type:
              ApplicationCommandOptionType.String,

            required:
              true,

            choices: [
              {
                name:
                  'General Gameplay',

                value:
                  'general',
              },
              {
                name:
                  'Builders',

                value:
                  'builders',
              },
              {
                name:
                  'Supply / Logistics',

                value:
                  'supply',
              },
              {
                name:
                  'Assault Squad',

                value:
                  'assault',
              },
              {
                name:
                  'Sniper / Recon Squad',

                value:
                  'sniper',
              },
              {
                name:
                  'Vehicle Crew',

                value:
                  'vehicle',
              },
              {
                name:
                  'Air Crew',

                value:
                  'air',
              },
              {
                name:
                  'Other / Custom',

                value:
                  'other',
              },
            ],
          },

          {
            name:
              'players',

            description:
              'Total group size including yourself',

            type:
              ApplicationCommandOptionType.Integer,

            required:
              true,

            min_value:
              2,

            max_value:
              12,
          },

          {
            name:
              'server',

            description:
              'WARDOGS server code if known',

            type:
              ApplicationCommandOptionType.String,

            required:
              false,

            max_length:
              40,
          },

          {
            name:
              'note',

            description:
              'What are you looking for?',

            type:
              ApplicationCommandOptionType.String,

            required:
              false,

            max_length:
              500,
          },
        ],
      },

      {
        name:
          'manage',

        description:
          'Manage your active RallyStack group',

        type:
          ApplicationCommandOptionType.Subcommand,
      },
    ],
  }

  if (existing) {
    await existing.edit(
      data
    )

    console.log(
      '[LFG] /lfg updated'
    )
  }
  else {
    await guild.commands.create(
      data
    )

    console.log(
      '[LFG] /lfg registered'
    )
  }
}

// ============================================================
// CREATE
// ============================================================

async function createLfg(
  interaction,
  brand
) {
  const guild =
    interaction.guild

  const member =
    await guild.members.fetch(
      interaction.user.id
    )

  if (
    !isMember(
      member
    )
  ) {
    await interaction.reply({
      content:
        'Finish RallyStack onboarding before creating a group.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const existing =
    getActiveGroupForUser(
      member.id
    )

  if (existing) {
    await interaction.reply({
      content:
        'You are already in an active RallyStack group. Leave or close that group first.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const playerRoles =
    getPlayerRoles(
      member
    )

  const region =
    getPlayerRegion(
      member
    )

  if (
    playerRoles.length < 1 ||
    !region
  ) {
    await interaction.reply({
      content:
        'Your RallyStack profile needs at least one WARDOGS role and a region before creating an LFG.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const lfgChannel =
    findLfgChannel(
      guild
    )

  if (!lfgChannel) {
    await interaction.reply({
      content:
        'RallyStack cannot find #looking-for-group.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const activityKey =
    interaction.options.getString(
      'activity',
      true
    )

  const activity =
    getActivity(
      activityKey
    )

  const maxPlayers =
    interaction.options.getInteger(
      'players',
      true
    )

  const serverCode =
    interaction.options.getString(
      'server'
    )?.trim() ?? ''

  const note =
    interaction.options.getString(
      'note'
    )?.trim() ?? ''

  const group = {
    id:
      randomUUID()
        .replaceAll('-', '')
        .slice(0, 8)
        .toUpperCase(),

    ownerId:
      member.id,

    memberIds: [
      member.id,
    ],

    activityKey,

    activityLabel:
      activity.label,

    activityEmoji:
      activity.emoji,

    maxPlayers,

    serverCode,

    note,

    status:
      'recruiting',

    voiceChannelId:
      null,

    channelId:
      lfgChannel.id,

    messageId:
      null,

    createdAt:
      new Date().toISOString(),

    expiresAt:
      new Date(
        Date.now() +
        LFG_LIFETIME_MS
      ).toISOString(),
  }

  const embed =
    await buildGroupEmbed(
      guild,
      group,
      brand
    )

  const message =
    await lfgChannel.send({
      embeds: [
        embed,
      ],

      components:
        groupButtons(
          group
        ),
    })

  group.messageId =
    message.id

  saveGroup(
    group
  )

  await addLookingRole(
    member
  )

  const manage =
    await managementPayload(
      guild,
      group
    )

  await interaction.reply({
    content:
      `Your RallyStack group is live in <#${lfgChannel.id}>.`,

    ...manage,

    flags:
      MessageFlags.Ephemeral,
  })

  console.log(
    `[LFG] Created ${group.id} by ${member.user.username}`
  )
}

// ============================================================
// JOIN
// ============================================================

async function joinGroup(
  interaction,
  groupId,
  brand
) {
  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  })

  const group =
    getGroup(
      groupId
    )

  if (
    !group ||
    group.status === 'closed'
  ) {
    await interaction.editReply(
      'That RallyStack group is no longer active.'
    )

    return
  }

  const member =
    await interaction.guild.members.fetch(
      interaction.user.id
    )

  const otherGroup =
    getActiveGroupForUser(
      member.id
    )

  if (
    otherGroup &&
    otherGroup.id !==
      group.id
  ) {
    await interaction.editReply(
      'You are already in another active RallyStack group.'
    )

    return
  }

  if (
    group.memberIds.includes(
      member.id
    )
  ) {
    await interaction.editReply(
      'You are already in this group.'
    )

    return
  }

  if (
    group.memberIds.length >=
    group.maxPlayers
  ) {
    await interaction.editReply(
      'That group is already full.'
    )

    return
  }

  group.memberIds.push(
    member.id
  )

  saveGroup(
    group
  )

  await addLookingRole(
    member
  )

  let voice = null

  // Second member makes the group active automatically.

  if (
    group.memberIds.length >= 2
  ) {
    try {
      voice =
        await createGroupVoice(
          interaction.guild,
          group
        )

      await allowMemberInVoice(
        interaction.guild,
        group,
        member.id
      )
    }
    catch (error) {
      console.error(
        '[LFG] Voice creation failed',
        error?.rawError ?? error
      )
    }
  }

  saveGroup(
    group
  )

  await updateGroupMessage(
    interaction.guild,
    group,
    brand
  )

  if (voice) {
    await interaction.editReply(
      `You joined the group. Voice room: <#${voice.id}>`
    )
  }
  else {
    await interaction.editReply(
      'You joined the RallyStack group.'
    )
  }
}

// ============================================================
// LEAVE
// ============================================================

async function leaveGroup(
  interaction,
  groupId,
  brand
) {
  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  })

  const group =
    getGroup(
      groupId
    )

  if (!group) {
    await interaction.editReply(
      'That group no longer exists.'
    )

    return
  }

  if (
    interaction.user.id ===
    group.ownerId
  ) {
    await interaction.editReply(
      'The group leader cannot leave their own LFG. Use `/lfg manage` and close the group instead.'
    )

    return
  }

  if (
    !group.memberIds.includes(
      interaction.user.id
    )
  ) {
    await interaction.editReply(
      'You are not currently in this group.'
    )

    return
  }

  group.memberIds =
    group.memberIds.filter(
      userId =>
        userId !==
        interaction.user.id
    )

  saveGroup(
    group
  )

  const member =
    await interaction.guild.members.fetch(
      interaction.user.id
    )

  await removeLookingRole(
    member
  )

  await removeMemberFromVoice(
    interaction.guild,
    group,
    member.id
  )

  await updateGroupMessage(
    interaction.guild,
    group,
    brand
  )

  await interaction.editReply(
    'You left the RallyStack group.'
  )
}

// ============================================================
// START
// ============================================================

async function startGroup(
  interaction,
  groupId,
  brand
) {
  const group =
    getGroup(
      groupId
    )

  if (!group) {
    await interaction.reply({
      content:
        'That group no longer exists.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  if (
    group.ownerId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        'Only the group leader can start this group.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  await interaction.deferUpdate()

  try {
    await createGroupVoice(
      interaction.guild,
      group
    )
  }
  catch (error) {
    console.error(
      '[LFG] Manual start failed',
      error?.rawError ?? error
    )
  }

  saveGroup(
    group
  )

  await updateGroupMessage(
    interaction.guild,
    group,
    brand
  )

  const payload =
    await managementPayload(
      interaction.guild,
      group
    )

  await interaction.editReply(
    payload
  )
}

// ============================================================
// EDIT MODAL
// ============================================================

async function showEditModal(
  interaction,
  groupId
) {
  const group =
    getGroup(
      groupId
    )

  if (!group) {
    await interaction.reply({
      content:
        'That group no longer exists.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  if (
    group.ownerId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        'Only the group leader can edit this LFG.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const modal =
    new ModalBuilder()

      .setCustomId(
        `rally_lfg_edit_modal:${group.id}`
      )

      .setTitle(
        'Edit RallyStack LFG'
      )

  const players =
    new TextInputBuilder()

      .setCustomId(
        'players'
      )

      .setLabel(
        'Maximum players'
      )

      .setStyle(
        TextInputStyle.Short
      )

      .setRequired(
        true
      )

      .setValue(
        String(
          group.maxPlayers
        )
      )

      .setMaxLength(
        2
      )

  const server =
    new TextInputBuilder()

      .setCustomId(
        'server'
      )

      .setLabel(
        'Server code'
      )

      .setStyle(
        TextInputStyle.Short
      )

      .setRequired(
        false
      )

      .setMaxLength(
        40
      )

  if (
    group.serverCode
  ) {
    server.setValue(
      group.serverCode
    )
  }

  const note =
    new TextInputBuilder()

      .setCustomId(
        'note'
      )

      .setLabel(
        'Group note'
      )

      .setStyle(
        TextInputStyle.Paragraph
      )

      .setRequired(
        false
      )

      .setMaxLength(
        500
      )

  if (
    group.note
  ) {
    note.setValue(
      group.note
    )
  }

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(
        players
      ),

    new ActionRowBuilder()
      .addComponents(
        server
      ),

    new ActionRowBuilder()
      .addComponents(
        note
      )
  )

  await interaction.showModal(
    modal
  )
}

// ============================================================
// EDIT SUBMIT
// ============================================================

async function handleEditModal(
  interaction,
  groupId,
  brand
) {
  const group =
    getGroup(
      groupId
    )

  if (!group) {
    await interaction.reply({
      content:
        'That group no longer exists.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  if (
    group.ownerId !==
    interaction.user.id
  ) {
    return
  }

  const playerValue =
    Number(
      interaction.fields
        .getTextInputValue(
          'players'
        )
        .trim()
    )

  if (
    !Number.isInteger(
      playerValue
    ) ||
    playerValue < 2 ||
    playerValue > 12
  ) {
    await interaction.reply({
      content:
        'Maximum players must be a whole number between 2 and 12.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  if (
    playerValue <
    group.memberIds.length
  ) {
    await interaction.reply({
      content:
        `You already have ${group.memberIds.length} players, so the group size cannot be reduced below that.`,

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  group.maxPlayers =
    playerValue

  group.serverCode =
    interaction.fields
      .getTextInputValue(
        'server'
      )
      .trim()

  group.note =
    interaction.fields
      .getTextInputValue(
        'note'
      )
      .trim()

  saveGroup(
    group
  )

  if (
    group.voiceChannelId
  ) {
    try {
      const voice =
        await interaction.guild.channels.fetch(
          group.voiceChannelId
        )

      await voice.setUserLimit(
        group.maxPlayers
      )
    }
    catch {
      // Not fatal.
    }
  }

  await updateGroupMessage(
    interaction.guild,
    group,
    brand
  )

  await interaction.reply({
    content:
      'Your RallyStack LFG has been updated.',

    flags:
      MessageFlags.Ephemeral,
  })
}

// ============================================================
// CLOSE BUTTON
// ============================================================

async function closeFromButton(
  interaction,
  groupId,
  brand
) {
  const group =
    getGroup(
      groupId
    )

  if (!group) {
    await interaction.reply({
      content:
        'That group no longer exists.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  if (
    group.ownerId !==
    interaction.user.id
  ) {
    await interaction.reply({
      content:
        'Only the group leader can close this LFG.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  await interaction.deferUpdate()

  await closeGroup(
    interaction.guild,
    group,
    brand,
    'closed by leader'
  )

  await interaction.editReply({
    content:
      'Your RallyStack LFG has been closed.',

    embeds: [],

    components: [],
  })
}

// ============================================================
// MANAGE
// ============================================================

async function manageLfg(
  interaction
) {
  const group =
    getOwnedGroup(
      interaction.user.id
    )

  if (!group) {
    await interaction.reply({
      content:
        'You do not currently own an active RallyStack group.',

      flags:
        MessageFlags.Ephemeral,
    })

    return
  }

  const payload =
    await managementPayload(
      interaction.guild,
      group
    )

  await interaction.reply({
    ...payload,

    flags:
      MessageFlags.Ephemeral,
  })
}

// ============================================================
// EXPIRE OLD GROUPS
// ============================================================

async function expireGroups(
  guild,
  brand
) {
  const groups =
    getAllGroups()

  for (
    const group of
    groups
  ) {
    if (
      group.status === 'closed'
    ) {
      continue
    }

    if (
      Date.now() >=
      new Date(
        group.expiresAt
      ).getTime()
    ) {
      await closeGroup(
        guild,
        group,
        brand,
        'expired'
      )
    }
  }
}

// ============================================================
// EMPTY VOICE MANAGEMENT
// ============================================================

function cancelVoiceDelete(
  channelId
) {
  const timer =
    voiceDeleteTimers.get(
      channelId
    )

  if (timer) {
    clearTimeout(
      timer
    )

    voiceDeleteTimers.delete(
      channelId
    )
  }
}

function scheduleVoiceDelete(
  guild,
  group,
  brand
) {
  if (
    !group.voiceChannelId
  ) {
    return
  }

  cancelVoiceDelete(
    group.voiceChannelId
  )

  const delay =
    group.status === 'closed'
      ? 1000
      : EMPTY_VOICE_DELETE_MS

  const channelId =
    group.voiceChannelId

  const timer =
    setTimeout(
      async () => {
        voiceDeleteTimers.delete(
          channelId
        )

        const latest =
          getGroup(
            group.id
          )

        if (!latest) {
          return
        }

        try {
          const channel =
            await guild.channels.fetch(
              channelId
            )

          if (
            channel &&
            channel.members.size > 0
          ) {
            return
          }

          if (channel) {
            await channel.delete(
              'RallyStack group voice inactive'
            )
          }
        }
        catch {
          // Already gone.
        }

        latest.voiceChannelId =
          null

        if (
          latest.status === 'closed'
        ) {
          deleteGroup(
            latest.id
          )

          return
        }

        saveGroup(
          latest
        )

        await updateGroupMessage(
          guild,
          latest,
          brand
        )

        console.log(
          `[LFG] Removed inactive voice for ${latest.id}`
        )
      },

      delay
    )

  voiceDeleteTimers.set(
    channelId,
    timer
  )
}

// ============================================================
// REGISTER LFG
// ============================================================

export function registerLfg(
  client,
  config,
  brand
) {
  // ----------------------------------------------------------
  // READY
  // ----------------------------------------------------------

  client.once(
    Events.ClientReady,

    async readyClient => {
      try {
        const guild =
          await readyClient.guilds.fetch(
            config.guildId
          )

        await guild.channels.fetch()
        await guild.roles.fetch()

        await ensureVoiceCategory(
          guild
        )

        await registerCommand(
          guild
        )

        await expireGroups(
          guild,
          brand
        )

        setInterval(
          () =>
            expireGroups(
              guild,
              brand
            ).catch(
              error =>
                console.error(
                  '[LFG] Expiry check failed',
                  error
                )
            ),

          60 * 1000
        ).unref()

        console.log(
          '[LFG] System ACTIVE'
        )
      }
      catch (error) {
        console.error(
          '[LFG] Startup failed',
          error?.rawError ?? error
        )
      }
    }
  )

  // ----------------------------------------------------------
  // SLASH COMMANDS
  // ----------------------------------------------------------

  client.on(
    Events.InteractionCreate,

    async interaction => {
      if (
        !interaction.isChatInputCommand() ||
        interaction.commandName !==
          'lfg' ||
        !interaction.guild
      ) {
        return
      }

      try {
        const subcommand =
          interaction.options
            .getSubcommand()

        if (
          subcommand === 'create'
        ) {
          await createLfg(
            interaction,
            brand
          )

          return
        }

        if (
          subcommand === 'manage'
        ) {
          await manageLfg(
            interaction
          )
        }
      }
      catch (error) {
        console.error(
          '[LFG] Command failed',
          error?.rawError ?? error
        )

        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              'RallyStack could not complete that LFG action.',

            flags:
              MessageFlags.Ephemeral,
          }).catch(
            () => {}
          )
        }
      }
    }
  )

  // ----------------------------------------------------------
  // BUTTONS
  // ----------------------------------------------------------

  client.on(
    Events.InteractionCreate,

    async interaction => {
      if (
        !interaction.isButton() ||
        !interaction.guild
      ) {
        return
      }

      const [
        action,
        groupId,
      ] =
        interaction.customId.split(
          ':'
        )

      try {
        if (
          action ===
          'rally_lfg_join'
        ) {
          await joinGroup(
            interaction,
            groupId,
            brand
          )

          return
        }

        if (
          action ===
          'rally_lfg_leave'
        ) {
          await leaveGroup(
            interaction,
            groupId,
            brand
          )

          return
        }

        if (
          action ===
          'rally_lfg_start'
        ) {
          await startGroup(
            interaction,
            groupId,
            brand
          )

          return
        }

        if (
          action ===
          'rally_lfg_edit'
        ) {
          await showEditModal(
            interaction,
            groupId
          )

          return
        }

        if (
          action ===
          'rally_lfg_close'
        ) {
          await closeFromButton(
            interaction,
            groupId,
            brand
          )
        }
      }
      catch (error) {
        console.error(
          '[LFG] Button failed',
          error?.rawError ?? error
        )
      }
    }
  )

  // ----------------------------------------------------------
  // EDIT MODAL
  // ----------------------------------------------------------

  client.on(
    Events.InteractionCreate,

    async interaction => {
      if (
        !interaction.isModalSubmit() ||
        !interaction.customId.startsWith(
          'rally_lfg_edit_modal:'
        )
      ) {
        return
      }

      const groupId =
        interaction.customId
          .split(':')[1]

      try {
        await handleEditModal(
          interaction,
          groupId,
          brand
        )
      }
      catch (error) {
        console.error(
          '[LFG] Edit modal failed',
          error?.rawError ?? error
        )
      }
    }
  )

  // ----------------------------------------------------------
  // VOICE ACTIVITY
  // ----------------------------------------------------------

  client.on(
    Events.VoiceStateUpdate,

    async (
      oldState,
      newState
    ) => {
      if (
        newState.guild.id !==
        config.guildId
      ) {
        return
      }

      if (
        newState.channelId
      ) {
        const newGroup =
          getGroupByVoiceChannel(
            newState.channelId
          )

        if (newGroup) {
          cancelVoiceDelete(
            newState.channelId
          )
        }
      }

      if (
        oldState.channelId
      ) {
        const oldGroup =
          getGroupByVoiceChannel(
            oldState.channelId
          )

        if (!oldGroup) {
          return
        }

        try {
          const channel =
            await oldState.guild.channels.fetch(
              oldState.channelId
            )

          if (
            channel.members.size === 0
          ) {
            scheduleVoiceDelete(
              oldState.guild,
              oldGroup,
              brand
            )
          }
        }
        catch {
          // Already gone.
        }
      }
    }
  )

  // ----------------------------------------------------------
  // EXTERNAL CHANNEL DELETE
  // ----------------------------------------------------------

  client.on(
    Events.ChannelDelete,

    async channel => {
      const group =
        getGroupByVoiceChannel(
          channel.id
        )

      if (!group) {
        return
      }

      group.voiceChannelId =
        null

      saveGroup(
        group
      )

      try {
        await updateGroupMessage(
          channel.guild,
          group,
          brand
        )
      }
      catch {
        // Not fatal.
      }
    }
  )
}