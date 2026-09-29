import { registerProfileCommand } from './profile-command.mjs'
import { registerOnboarding } from './onboarding.mjs'
import fs from 'node:fs'

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  PermissionFlagsBits,
} from 'discord.js'

// ============================================================
// CONFIG
// ============================================================

const CONFIG_URL =
  new URL('./config.json', import.meta.url)

const config = JSON.parse(
  fs.readFileSync(
    CONFIG_URL,
    'utf8'
  )
)

const token =
  process.env.DISCORD_BOT_TOKEN

if (!token) {
  throw new Error(
    'DISCORD_BOT_TOKEN is not set.'
  )
}

function saveConfig() {
  fs.writeFileSync(
    CONFIG_URL,
    JSON.stringify(
      config,
      null,
      2
    ),
    'utf8'
  )
}

// ============================================================
// BRAND
// ============================================================

const BRAND = 0xF59E0B

// ============================================================
// WARDOGS ROLE OPTIONS
// ============================================================

const ROLE_OPTIONS = [
  {
    key: 'assault',
    name: 'Assault',
    emoji: '\u2694\uFE0F',
  },
  {
    key: 'medic',
    name: 'Medic',
    emoji: '\u{1FA79}',
  },
  {
    key: 'recon',
    name: 'Recon',
    emoji: '\u{1F3AF}',
  },
  {
    key: 'support',
    name: 'Support',
    emoji: '\u{1F6E1}\uFE0F',
  },
  {
    key: 'driver',
    name: 'Driver',
    emoji: '\u{1F69A}',
  },
  {
    key: 'pilot',
    name: 'Pilot',
    emoji: '\u{1F681}',
  },
]

// ============================================================
// REGION OPTIONS
// ============================================================

// Discord standard emoji:
//
// UK      = :flag_gb:
// Europe  = :flag_eu:
// USA     = :flag_us:
// Australia = :flag_au:
//
// NA East and NA West use separate messages because Discord
// cannot have the same US reaction twice on one message.

const REGION_MAIN = new Map([
  [
    '\u{1F1EC}\u{1F1E7}',
    'UK',
  ],
  [
    '\u{1F1EA}\u{1F1FA}',
    'Europe',
  ],
  [
    '\u{1F1E6}\u{1F1FA}',
    'Oceania',
  ],
  [
    '\u{1F30F}',
    'Asia',
  ],
])

const US_FLAG =
  '\u{1F1FA}\u{1F1F8}'

const REGION_ROLE_NAMES = [
  'UK',
  'Europe',
  'NA East',
  'NA West',
  'Oceania',
  'Asia',
]

// ============================================================
// CLIENT
// ============================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],

  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
})

// ============================================================
// CHANNEL HELPERS
// ============================================================

function findTextChannel(
  guild,
  name
) {
  return guild.channels.cache.find(
    channel =>
      (
        channel.type ===
          ChannelType.GuildText ||
        channel.type ===
          ChannelType.GuildAnnouncement
      ) &&
      channel.name === name
  )
}

async function fetchRecentMessages(
  channel
) {
  try {
    return await channel.messages.fetch({
      limit: 100,
    })
  }
  catch {
    return null
  }
}

function messageHasFooter(
  message,
  footer
) {
  return message.embeds.some(
    embed =>
      embed.footer?.text === footer
  )
}

async function removeOldBotMessages(
  channel,
  keepFooters
) {
  if (!channel) {
    return
  }

  const messages =
    await fetchRecentMessages(
      channel
    )

  if (!messages) {
    return
  }

  for (
    const message of
    messages.values()
  ) {
    if (
      message.author.id !==
      client.user.id
    ) {
      continue
    }

    const keep =
      keepFooters.some(
        footer =>
          messageHasFooter(
            message,
            footer
          )
      )

    if (keep) {
      continue
    }

    try {
      await message.delete()
    }
    catch {
      // Ignore messages Discord refuses to remove.
    }
  }
}

async function upsertEmbed(
  channel,
  footer,
  embed
) {
  if (!channel) {
    return null
  }

  const messages =
    await fetchRecentMessages(
      channel
    )

  let existing = null

  if (messages) {
    existing =
      messages.find(
        message =>
          message.author.id ===
            client.user.id &&
          messageHasFooter(
            message,
            footer
          )
      )
  }

  if (existing) {
    await existing.edit({
      content: '',
      embeds: [
        embed,
      ],
      components: [],
      allowedMentions: {
        parse: [],
      },
    })

    return existing
  }

  return channel.send({
    embeds: [
      embed,
    ],
    components: [],
    allowedMentions: {
      parse: [],
    },
  })
}

async function ensureReaction(
  message,
  emoji
) {
  try {
    await message.react(
      emoji
    )
  }
  catch (error) {
    console.error(
      `[REACTION] Could not add ${emoji}`,
      error?.rawError ?? error
    )
  }
}

// ============================================================
// ROLE HELPERS
// ============================================================

function roleOptionByKey(
  key
) {
  return (
    ROLE_OPTIONS.find(
      option =>
        option.key === key
    ) ?? null
  )
}

function selectedWardogsRoles(
  member
) {
  return ROLE_OPTIONS.filter(
    option =>
      member.roles.cache.some(
        role =>
          role.name ===
          option.name
      )
  )
}

async function fetchInteractionMember(
  interaction
) {
  try {
    return await interaction.guild.members.fetch(
      interaction.user.id
    )
  }
  catch {
    return null
  }
}

async function assignableRole(
  guild,
  roleName
) {
  await guild.roles.fetch()

  const role =
    guild.roles.cache.find(
      item =>
        item.name === roleName
    )

  if (!role) {
    console.error(
      `[ROLE] Missing role: ${roleName}`
    )

    return null
  }

  const botMember =
    guild.members.me ??
    await guild.members.fetchMe()

  if (
    botMember.roles.highest
      .comparePositionTo(
        role
      ) <= 0
  ) {
    console.error(
      `[ROLE] RallyStack bot role must be ABOVE "${roleName}".`
    )

    return null
  }

  return role
}

// ============================================================
// ENSURE DISCORD ROLES EXIST
// ============================================================

async function ensureRoles(
  guild
) {
  await guild.roles.fetch()

  // ----------------------------------------------------------
  // MIGRATE ORIGINAL UK / EU ROLE
  // ----------------------------------------------------------

  const oldUkEu =
    guild.roles.cache.find(
      role =>
        role.name ===
        'UK / EU'
    )

  const existingUk =
    guild.roles.cache.find(
      role =>
        role.name ===
        'UK'
    )

  if (
    oldUkEu &&
    !existingUk
  ) {
    try {
      await oldUkEu.setName(
        'UK',
        'RallyStack region update'
      )

      console.log(
        '[REGION] UK / EU renamed to UK'
      )
    }
    catch (error) {
      console.error(
        '[REGION] Could not rename UK / EU',
        error?.rawError ?? error
      )
    }
  }

  // ----------------------------------------------------------
  // REQUIRED ROLES
  // ----------------------------------------------------------

  const requiredRoleNames = [
    ...ROLE_OPTIONS.map(
      option =>
        option.name
    ),

    ...REGION_ROLE_NAMES,
  ]

  for (
    const roleName of
    requiredRoleNames
  ) {
    const exists =
      guild.roles.cache.find(
        role =>
          role.name === roleName
      )

    if (exists) {
      continue
    }

    try {
      await guild.roles.create({
        name: roleName,

        reason:
          'RallyStack self-service role',
      })

      console.log(
        `[ROLE] Created: ${roleName}`
      )
    }
    catch (error) {
      console.error(
        `[ROLE] Could not create ${roleName}`,
        error?.rawError ?? error
      )
    }
  }

  await guild.roles.fetch()
}

// ============================================================
// PRIVATE WARDOGS ROLE PICKER
// ============================================================

function rolePickerEmbed(
  selected
) {
  const selectedNames =
    selected.length > 0
      ? selected
          .map(
            item =>
              `**${item.name}**`
          )
          .join(' + ')
      : 'None selected'

  let status

  if (
    selected.length >= 2
  ) {
    status =
      'You have selected the maximum of **2 roles**. Remove one to unlock the others.'
  }
  else {
    status =
      `You can select **${2 - selected.length}** more.`
  }

  return new EmbedBuilder()
    .setColor(BRAND)

    .setTitle(
      'CHOOSE YOUR WARDOGS ROLES'
    )

    .setDescription(
      [
        'Choose up to **2 roles** you normally play.',
        '',
        `Current selection: ${selectedNames}`,
        '',
        status,
        '',
        'Your selections are applied directly to your RallyStack Discord profile.',
      ].join('\n')
    )
}

function buildRolePickerRows(
  selected
) {
  const selectedKeys =
    new Set(
      selected.map(
        option =>
          option.key
      )
    )

  const atLimit =
    selectedKeys.size >= 2

  const buttons =
    ROLE_OPTIONS.map(
      option => {
        const selected =
          selectedKeys.has(
            option.key
          )

        return new ButtonBuilder()
          .setCustomId(
            `rally_role_toggle:${option.key}`
          )

          .setLabel(
            option.name
          )

          .setEmoji(
            option.emoji
          )

          .setStyle(
            selected
              ? ButtonStyle.Success
              : ButtonStyle.Secondary
          )

          .setDisabled(
            atLimit &&
            !selected
          )
      }
    )

  return [
    new ActionRowBuilder()
      .addComponents(
        buttons.slice(
          0,
          3
        )
      ),

    new ActionRowBuilder()
      .addComponents(
        buttons.slice(
          3,
          6
        )
      ),
  ]
}

// ============================================================
// LOCK START HERE
// ============================================================

async function lockStartHereCategory(guild) {
  await guild.channels.fetch()

  const category =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name
          .toUpperCase()
          .endsWith('START HERE')
    )

  if (!category) {
    console.error(
      '[LOCK] START HERE category not found'
    )

    return
  }

  try {
    // --------------------------------------------------------
    // MEMBERS CAN VIEW BUT CANNOT POST
    // --------------------------------------------------------

    await category.permissionOverwrites.edit(
      guild.roles.everyone,
      {
        ViewChannel: true,
        SendMessages: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
        SendMessagesInThreads: false,

        // Important:
        // Leave reactions enabled because region selection
        // still uses Discord reactions.
        AddReactions: true,

        ReadMessageHistory: true,
      },
      {
        reason:
          'RallyStack START HERE read-only category',
      }
    )

    console.log(
      '[LOCK] START HERE category set to read-only'
    )

    // --------------------------------------------------------
    // SYNC ALL CHILD CHANNELS TO CATEGORY PERMISSIONS
    // --------------------------------------------------------

    const children =
      guild.channels.cache.filter(
        channel =>
          channel.parentId === category.id
      )

    for (
      const channel of
      children.values()
    ) {
      try {
        await channel.lockPermissions()

        console.log(
          `[LOCK] Synced #${channel.name}`
        )
      }
      catch (error) {
        console.error(
          `[LOCK] Could not sync ${channel.name}`,
          error?.rawError ?? error
        )
      }
    }
  }
  catch (error) {
    console.error(
      '[LOCK] START HERE locking failed',
      error?.rawError ?? error
    )
  }
}

// ============================================================
// START HERE
// ============================================================

async function buildStartHere(
  guild
) {
  console.log('')
  console.log(
    '===== START HERE ====='
  )

  await guild.channels.fetch()

  const welcome =
    findTextChannel(
      guild,
      'welcome'
    )

  const rules =
    findTextChannel(
      guild,
      'rules'
    )

  const gettingStarted =
    findTextChannel(
      guild,
      'get-started'
    )

  const rolesChannel =
    findTextChannel(
      guild,
      'roles-and-regions'
    )

  // ----------------------------------------------------------
  // CHANNEL TOPICS
  // ----------------------------------------------------------

  if (welcome) {
    await welcome
      .setTopic(
        'Welcome to RallyStack. Build. Squad Up. Deploy.'
      )
      .catch(
        () => {}
      )
  }

  if (rules) {
    await rules
      .setTopic(
        'RallyStack community rules.'
      )
      .catch(
        () => {}
      )
  }

  if (gettingStarted) {
    await gettingStarted
      .setTopic(
        'Everything you need to start using RallyStack.'
      )
      .catch(
        () => {}
      )
  }

  if (rolesChannel) {
    await rolesChannel
      .setTopic(
        'Choose your WARDOGS roles and playing region.'
      )
      .catch(
        () => {}
      )
  }

  // ==========================================================
  // WELCOME
  // ==========================================================

  if (welcome) {
    await removeOldBotMessages(
      welcome,
      [
        'RALLYSTACK_WELCOME',
      ]
    )

    const embed =
      new EmbedBuilder()
        .setColor(BRAND)

        .setTitle(
          'WELCOME TO RALLYSTACK'
        )

        .setDescription(
          [
            '**BUILD. SQUAD UP. DEPLOY.**',
            '',
            'RallyStack is built for the WARDOGS community.',
            '',
            '**Find players** who fit your role and play style.',
            '**Build and share loadouts.**',
            '**Join and create squads.**',
            '**Create temporary squad voice rooms.**',
            '**Follow game and RallyStack updates.**',
            '',
            'Start in **#get-started**, then configure yourself in **#roles-and-regions**.',
          ].join('\n')
        )

        .setFooter({
          text:
            'RALLYSTACK_WELCOME',
        })

    await upsertEmbed(
      welcome,
      'RALLYSTACK_WELCOME',
      embed
    )

    console.log(
      '[START] Welcome ready'
    )
  }

  // ==========================================================
  // RULES
  // ==========================================================

  if (rules) {
    await removeOldBotMessages(
      rules,
      [
        'RALLYSTACK_RULES',
      ]
    )

    const embed =
      new EmbedBuilder()
        .setColor(BRAND)

        .setTitle(
          'RALLYSTACK COMMUNITY RULES'
        )

        .setDescription(
          [
            '**1. Respect other members**',
            'No harassment, hate speech or targeted abuse.',
            '',
            '**2. Keep arguments under control**',
            'Debate is fine. Turning every channel into trench warfare is not.',
            '',
            '**3. No spam, scams or malicious links**',
            '',
            '**4. Keep LFG genuine**',
            'Do not deliberately waste other players time.',
            '',
            '**5. Respect squads and communities**',
            'No deliberate disruption or harassment.',
            '',
            '**6. Use the correct channels where practical**',
            '',
            '**7. Staff decisions can be reviewed**',
            'Use the proper report route instead of starting a public pile-on.',
            '',
            '*RallyStack is an independent WARDOGS community project and is not affiliated with or endorsed by BULKHEAD or Team17.*',
          ].join('\n')
        )

        .setFooter({
          text:
            'RALLYSTACK_RULES',
        })

    await upsertEmbed(
      rules,
      'RALLYSTACK_RULES',
      embed
    )

    console.log(
      '[START] Rules ready'
    )
  }

  // ==========================================================
  // GET STARTED
  // ==========================================================

  if (gettingStarted) {
    await removeOldBotMessages(
      gettingStarted,
      [
        'RALLYSTACK_GET_STARTED',
      ]
    )

    const embed =
      new EmbedBuilder()
        .setColor(BRAND)

        .setTitle(
          'GET STARTED'
        )

        .setDescription(
          [
            '**01  Choose your roles**',
            'Pick the two WARDOGS roles you play most in **#roles-and-regions**.',
            '',
            '**02  Choose your region**',
            'Select the region you normally play in.',
            '',
            '**03  Find players**',
            'Use **#looking-for-group**.',
            '',
            '**04  Find a squad**',
            'Use **#squad-recruitment** or **#squad-showcase**.',
            '',
            '**05  Need voice?**',
            'Join **Join to Create Squad** and RallyStack automatically creates a temporary squad room.',
            '',
            '**06  Build your kit**',
            'Use **#loadouts** and **#loadout-talk**.',
          ].join('\n')
        )

        .setFooter({
          text:
            'RALLYSTACK_GET_STARTED',
        })

    await upsertEmbed(
      gettingStarted,
      'RALLYSTACK_GET_STARTED',
      embed
    )

    console.log(
      '[START] Get Started ready'
    )
  }

  // ==========================================================
  // ROLES AND REGIONS
  // ==========================================================

  if (!rolesChannel) {
    console.error(
      '[ROLE] #roles-and-regions is missing'
    )

    return
  }

  await removeOldBotMessages(
    rolesChannel,
    [
      'RALLYSTACK_GAME_ROLES',
      'RALLYSTACK_REGION_MAIN',
      'RALLYSTACK_REGION_NA_EAST',
      'RALLYSTACK_REGION_NA_WEST',
    ]
  )

  // ==========================================================
  // WARDOGS ROLE SELECTOR
  // ==========================================================

  const roleEmbed =
    new EmbedBuilder()
      .setColor(BRAND)

      .setTitle(
        'CHOOSE YOUR WARDOGS ROLES'
      )

      .setDescription(
        [
          'Choose the **2 roles** you play most.',
          '',
          '\u2694\uFE0F  **ASSAULT**',
          '\u{1FA79}  **MEDIC**',
          '\u{1F3AF}  **RECON**',
          '\u{1F6E1}\uFE0F  **SUPPORT**',
          '\u{1F69A}  **DRIVER**',
          '\u{1F681}  **PILOT**',
          '',
          'Press **Choose Roles** below.',
          '',
          'Your choices are applied to your Discord server profile.',
        ].join('\n')
      )

      .setFooter({
        text:
          'RALLYSTACK_GAME_ROLES',
      })

  const roleMessage =
    await upsertEmbed(
      rolesChannel,
      'RALLYSTACK_GAME_ROLES',
      roleEmbed
    )

  // Remove previous role reactions.

  try {
    if (
      roleMessage.reactions.cache.size >
      0
    ) {
      await roleMessage.reactions.removeAll()
    }
  }
  catch {
    // Not fatal.
  }

  await roleMessage.edit({
    embeds: [
      roleEmbed,
    ],

    components: [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              'rally_role_open'
            )

            .setLabel(
              'Choose Roles'
            )

            .setEmoji(
              '\u{1F3AE}'
            )

            .setStyle(
              ButtonStyle.Primary
            )
        ),
    ],

    allowedMentions: {
      parse: [],
    },
  })

  config.gameRoleMessageId =
    roleMessage.id

  // ==========================================================
  // MAIN REGION PANEL
  // ==========================================================

  const regionEmbed =
    new EmbedBuilder()
      .setColor(BRAND)

      .setTitle(
        'CHOOSE YOUR REGION'
      )

      .setDescription(
        [
          'React with the region you normally play in.',
          '',
          '\u{1F1EC}\u{1F1E7}  **UK**',
          '\u{1F1EA}\u{1F1FA}  **EUROPE**',
          '\u{1F1E6}\u{1F1FA}  **OCEANIA**',
          '\u{1F30F}  **ASIA**',
          '',
          'North America is directly below.',
          '',
          '*Only one region can be active at a time.*',
        ].join('\n')
      )

      .setFooter({
        text:
          'RALLYSTACK_REGION_MAIN',
      })

  const regionMainMessage =
    await upsertEmbed(
      rolesChannel,
      'RALLYSTACK_REGION_MAIN',
      regionEmbed
    )

  for (
    const emoji of
    REGION_MAIN.keys()
  ) {
    await ensureReaction(
      regionMainMessage,
      emoji
    )
  }

  // ==========================================================
  // NA EAST
  // ==========================================================

  const naEastEmbed =
    new EmbedBuilder()
      .setColor(BRAND)

      .setTitle(
        '\u{1F1FA}\u{1F1F8}  NORTH AMERICA EAST'
      )

      .setDescription(
        'React with the US flag below if you normally play on **NA East**.'
      )

      .setFooter({
        text:
          'RALLYSTACK_REGION_NA_EAST',
      })

  const naEastMessage =
    await upsertEmbed(
      rolesChannel,
      'RALLYSTACK_REGION_NA_EAST',
      naEastEmbed
    )

  await ensureReaction(
    naEastMessage,
    US_FLAG
  )

  // ==========================================================
  // NA WEST
  // ==========================================================

  const naWestEmbed =
    new EmbedBuilder()
      .setColor(BRAND)

      .setTitle(
        '\u{1F1FA}\u{1F1F8}  NORTH AMERICA WEST'
      )

      .setDescription(
        'React with the US flag below if you normally play on **NA West**.'
      )

      .setFooter({
        text:
          'RALLYSTACK_REGION_NA_WEST',
      })

  const naWestMessage =
    await upsertEmbed(
      rolesChannel,
      'RALLYSTACK_REGION_NA_WEST',
      naWestEmbed
    )

  await ensureReaction(
    naWestMessage,
    US_FLAG
  )

  // ==========================================================
  // SAVE MESSAGE IDS
  // ==========================================================

  config.rolesChannelId =
    rolesChannel.id

  config.regionMainMessageId =
    regionMainMessage.id

  config.regionNaEastMessageId =
    naEastMessage.id

  config.regionNaWestMessageId =
    naWestMessage.id

  saveConfig()

  console.log(
    '[ROLE] Role selector ready'
  )

  console.log(
    '[REGION] Region reactions ready'
  )
}

// ============================================================
// PRIVATE ROLE BUTTON INTERACTIONS
// ============================================================

client.on(
  Events.InteractionCreate,

  async interaction => {
    if (
      !interaction.isButton()
    ) {
      return
    }

    if (
      !interaction.guild
    ) {
      return
    }

    // ========================================================
    // OPEN PRIVATE ROLE PICKER
    // ========================================================

    if (
      interaction.customId ===
      'rally_role_open'
    ) {
      const member =
        await fetchInteractionMember(
          interaction
        )

      if (!member) {
        await interaction.reply({
          content:
            'RallyStack could not load your Discord profile.',

          flags:
            MessageFlags.Ephemeral,
        })

        return
      }

      const selected =
        selectedWardogsRoles(
          member
        )

      await interaction.reply({
        embeds: [
          rolePickerEmbed(
            selected
          ),
        ],

        components:
          buildRolePickerRows(
            selected
          ),

        flags:
          MessageFlags.Ephemeral,
      })

      return
    }

    // ========================================================
    // ROLE TOGGLE
    // ========================================================

    if (
      !interaction.customId.startsWith(
        'rally_role_toggle:'
      )
    ) {
      return
    }

    const key =
      interaction.customId
        .split(':')[1]

    const option =
      roleOptionByKey(
        key
      )

    if (!option) {
      return
    }

    const member =
      await fetchInteractionMember(
        interaction
      )

    if (!member) {
      await interaction.update({
        content:
          'RallyStack could not reload your Discord profile.',

        embeds: [],
        components: [],
      })

      return
    }

    const role =
      await assignableRole(
        interaction.guild,
        option.name
      )

    if (!role) {
      await interaction.update({
        content:
          `RallyStack cannot manage the **${option.name}** role. The RallyStack bot role must be above it in Server Settings > Roles.`,

        embeds: [],
        components: [],
      })

      return
    }

    const selectedBefore =
      selectedWardogsRoles(
        member
      )

    const alreadySelected =
      member.roles.cache.has(
        role.id
      )

    // ========================================================
    // REMOVE SELECTED ROLE
    // ========================================================

    if (alreadySelected) {
      try {
        await member.roles.remove(
          role,
          `RallyStack role removed: ${option.name}`
        )

        console.log(
          `[ROLE] - ${member.user.username}: ${option.name}`
        )
      }
      catch (error) {
        console.error(
          `[ROLE] Failed removing ${option.name}`,
          error?.rawError ?? error
        )
      }
    }

    // ========================================================
    // ADD ROLE
    // ========================================================

    else {
      if (
        selectedBefore.length >= 2
      ) {
        const refreshed =
          await interaction.guild.members.fetch(
            interaction.user.id
          )

        const selected =
          selectedWardogsRoles(
            refreshed
          )

        await interaction.update({
          embeds: [
            rolePickerEmbed(
              selected
            ),
          ],

          components:
            buildRolePickerRows(
              selected
            ),
        })

        return
      }

      try {
        await member.roles.add(
          role,
          `RallyStack role selected: ${option.name}`
        )

        console.log(
          `[ROLE] + ${member.user.username}: ${option.name}`
        )
      }
      catch (error) {
        console.error(
          `[ROLE] Failed adding ${option.name}`,
          error?.rawError ?? error
        )
      }
    }

    // --------------------------------------------------------
    // REFRESH MEMBER AND PANEL
    // --------------------------------------------------------

    const refreshedMember =
      await interaction.guild.members.fetch(
        interaction.user.id
      )

    const selectedAfter =
      selectedWardogsRoles(
        refreshedMember
      )

    await interaction.update({
      embeds: [
        rolePickerEmbed(
          selectedAfter
        ),
      ],

      components:
        buildRolePickerRows(
          selectedAfter
        ),
    })
  }
)

// ============================================================
// REACTION HELPERS
// ============================================================

async function getReactionContext(
  reaction,
  user
) {
  if (
    reaction.partial
  ) {
    try {
      await reaction.fetch()
    }
    catch {
      return null
    }
  }

  if (
    reaction.message.partial
  ) {
    try {
      await reaction.message.fetch()
    }
    catch {
      return null
    }
  }

  const guild =
    reaction.message.guild

  if (!guild) {
    return null
  }

  let member

  try {
    member =
      await guild.members.fetch(
        user.id
      )
  }
  catch {
    return null
  }

  await guild.roles.fetch()

  return {
    guild,
    member,
  }
}

function isRegionMessage(
  messageId
) {
  return [
    config.regionMainMessageId,
    config.regionNaEastMessageId,
    config.regionNaWestMessageId,
  ].includes(
    messageId
  )
}

function regionFromReaction(
  reaction
) {
  const messageId =
    reaction.message.id

  const emoji =
    reaction.emoji.name

  if (
    messageId ===
    config.regionMainMessageId
  ) {
    return (
      REGION_MAIN.get(
        emoji
      ) ?? null
    )
  }

  if (
    messageId ===
      config.regionNaEastMessageId &&
    emoji === US_FLAG
  ) {
    return 'NA East'
  }

  if (
    messageId ===
      config.regionNaWestMessageId &&
    emoji === US_FLAG
  ) {
    return 'NA West'
  }

  return null
}

// ============================================================
// REMOVE OTHER REGION ROLES
// ============================================================

async function removeOtherRegionRoles(
  guild,
  member,
  selectedRegion
) {
  await guild.roles.fetch()

  for (
    const roleName of
    REGION_ROLE_NAMES
  ) {
    if (
      roleName ===
      selectedRegion
    ) {
      continue
    }

    const role =
      guild.roles.cache.find(
        item =>
          item.name === roleName
      )

    if (
      role &&
      member.roles.cache.has(
        role.id
      )
    ) {
      try {
        await member.roles.remove(
          role,
          'RallyStack region changed'
        )
      }
      catch (error) {
        console.error(
          `[REGION] Could not remove ${roleName}`,
          error?.rawError ?? error
        )
      }
    }
  }
}

// ============================================================
// REMOVE USER'S OTHER REGION REACTIONS
// ============================================================

async function removeOtherRegionReactions(
  guild,
  user,
  currentMessageId,
  currentEmoji
) {
  const channel =
    guild.channels.cache.get(
      config.rolesChannelId
    )

  if (!channel) {
    return
  }

  const messageIds = [
    config.regionMainMessageId,
    config.regionNaEastMessageId,
    config.regionNaWestMessageId,
  ]

  for (
    const messageId of
    messageIds
  ) {
    if (!messageId) {
      continue
    }

    let message

    try {
      message =
        await channel.messages.fetch(
          messageId
        )
    }
    catch {
      continue
    }

    for (
      const reaction of
      message.reactions.cache.values()
    ) {
      const sameReaction =
        messageId ===
          currentMessageId &&
        reaction.emoji.name ===
          currentEmoji

      if (sameReaction) {
        continue
      }

      try {
        await reaction.users.remove(
          user.id
        )
      }
      catch {
        // Not fatal.
      }
    }
  }
}

// ============================================================
// REGION REACTION ADDED
// ============================================================

client.on(
  Events.MessageReactionAdd,

  async (
    reaction,
    user
  ) => {
    if (
      user.bot
    ) {
      return
    }

    if (
      !isRegionMessage(
        reaction.message.id
      )
    ) {
      return
    }

    const region =
      regionFromReaction(
        reaction
      )

    if (!region) {
      return
    }

    const context =
      await getReactionContext(
        reaction,
        user
      )

    if (!context) {
      return
    }

    const role =
      await assignableRole(
        context.guild,
        region
      )

    if (!role) {
      return
    }

    await removeOtherRegionRoles(
      context.guild,
      context.member,
      region
    )

    try {
      if (
        !context.member.roles.cache.has(
          role.id
        )
      ) {
        await context.member.roles.add(
          role,
          `RallyStack region: ${region}`
        )
      }

      console.log(
        `[REGION] ${context.member.user.username}: ${region}`
      )
    }
    catch (error) {
      console.error(
        `[REGION] Could not add ${region}`,
        error?.rawError ?? error
      )

      return
    }

    await removeOtherRegionReactions(
      context.guild,
      user,
      reaction.message.id,
      reaction.emoji.name
    )
  }
)

// ============================================================
// REGION REACTION REMOVED
// ============================================================

client.on(
  Events.MessageReactionRemove,

  async (
    reaction,
    user
  ) => {
    if (
      user.bot
    ) {
      return
    }

    if (
      !isRegionMessage(
        reaction.message.id
      )
    ) {
      return
    }

    const region =
      regionFromReaction(
        reaction
      )

    if (!region) {
      return
    }

    const context =
      await getReactionContext(
        reaction,
        user
      )

    if (!context) {
      return
    }

    const role =
      context.guild.roles.cache.find(
        item =>
          item.name === region
      )

    if (
      !role ||
      !context.member.roles.cache.has(
        role.id
      )
    ) {
      return
    }

    try {
      await context.member.roles.remove(
        role,
        `RallyStack region reaction removed: ${region}`
      )

      console.log(
        `[REGION] - ${context.member.user.username}: ${region}`
      )
    }
    catch (error) {
      console.error(
        `[REGION] Could not remove ${region}`,
        error?.rawError ?? error
      )
    }
  }
)

// ============================================================
// TEMP VOICE HELPERS
// ============================================================

function cleanRoomName(
  member
) {
  const source =
    member?.displayName ||
    member?.user?.username ||
    'Player'

  const cleaned =
    source
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
        50
      )

  return (
    cleaned ||
    'Player'
  )
}

function isTemporaryVoiceRoom(
  channel
) {
  return (
    channel &&
    channel.type ===
      ChannelType.GuildVoice &&
    channel.parentId ===
      config.tempCategoryId &&
    channel.id !==
      config.triggerChannelId
  )
}

async function deleteRoomIfEmpty(
  channelId,
  guild
) {
  if (!channelId) {
    return
  }

  try {
    const channel =
      await guild.channels.fetch(
        channelId
      )

    if (
      !isTemporaryVoiceRoom(
        channel
      )
    ) {
      return
    }

    if (
      channel.members.size === 0
    ) {
      console.log(
        `[VOICE] Deleting empty room: ${channel.name}`
      )

      await channel.delete(
        'RallyStack temporary squad empty'
      )
    }
  }
  catch (error) {
    if (
      error?.code !== 10003
    ) {
      console.error(
        '[VOICE] Cleanup failed',
        error?.rawError ?? error
      )
    }
  }
}

// ============================================================
// TEMP VOICE EVENTS
// ============================================================

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
      newState.member?.user?.bot
    ) {
      return
    }

    // ========================================================
    // JOIN TO CREATE
    // ========================================================

    if (
      newState.channelId ===
        config.triggerChannelId &&
      oldState.channelId !==
        config.triggerChannelId
    ) {
      const member =
        newState.member

      const playerName =
        cleanRoomName(
          member
        )

      let room = null

      try {
        console.log(
          `[VOICE] ${playerName} requested a temporary squad`
        )

        room =
          await newState.guild.channels.create({
            name:
              `Squad - ${playerName}`,

            type:
              ChannelType.GuildVoice,

            parent:
              config.tempCategoryId,

            userLimit:
              0,

            reason:
              `Temporary RallyStack squad for ${playerName}`,
          })

        await newState.setChannel(
          room,
          'RallyStack temporary squad created'
        )

        console.log(
          `[VOICE] Created: ${room.name}`
        )
      }
      catch (error) {
        console.error(
          '[VOICE] Creation failed',
          error?.rawError ?? error
        )

        if (room) {
          await room
            .delete(
              'Cleaning failed temporary room'
            )
            .catch(
              () => {}
            )
        }
      }
    }

    // ========================================================
    // CLEAN OLD ROOM
    // ========================================================

    if (
      oldState.channelId &&
      oldState.channelId !==
        config.triggerChannelId
    ) {
      const oldChannelId =
        oldState.channelId

      const guild =
        oldState.guild

      setTimeout(
        () =>
          deleteRoomIfEmpty(
            oldChannelId,
            guild
          ),
        1500
      )
    }
  }
)

// ============================================================
// READY
// ============================================================

client.once(
  Events.ClientReady,

  async readyClient => {
    console.log('')
    console.log(
      '========================================'
    )
    console.log(
      `RallyStack online as ${readyClient.user.tag}`
    )
    console.log(
      'Private max-2 roles: ACTIVE'
    )
    console.log(
      'Region reactions: ACTIVE'
    )
    console.log(
      'Temporary voice: ACTIVE'
    )
    console.log(
      '========================================'
    )
    console.log('')

    try {
      const guild =
        await readyClient.guilds.fetch(
          config.guildId
        )

      await guild.channels.fetch()
      await guild.roles.fetch()

      await ensureRoles(
        guild
      )

      await lockStartHereCategory(
        guild
      )

      // ------------------------------------------------------
      // CLEAN ABANDONED TEMP ROOMS
      // ------------------------------------------------------

      for (
        const channel of
        guild.channels.cache.values()
      ) {
        if (
          isTemporaryVoiceRoom(
            channel
          ) &&
          channel.members.size === 0
        ) {
          await deleteRoomIfEmpty(
            channel.id,
            guild
          )
        }
      }

      // ------------------------------------------------------
      // BUILD SERVER UI
      // ------------------------------------------------------

      await buildStartHere(
        guild
      )

      console.log('')
      console.log(
        'RallyStack Discord systems ready.'
      )
      console.log('')
    }
    catch (error) {
      console.error(
        '[READY] Startup failed',
        error?.rawError ?? error
      )
    }
  }
)

// ============================================================
// LOGIN
// ============================================================

registerOnboarding(client, config, BRAND)

registerProfileCommand(client, config, BRAND)

client.login(token)