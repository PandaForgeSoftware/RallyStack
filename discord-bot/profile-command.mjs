import { getActiveGroupForUser } from './lfg-store.mjs'
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  Events,
} from 'discord.js'

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

const PROFILE_DELETE_AFTER_MS = 60_000

const STAFF_ROLES = [
  'Founder',
  'Administrator',
  'Moderator',
  'RallyStack Team',
]

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

function getGameRoles(
  member
) {
  return GAME_ROLES.filter(
    option =>
      memberHasRole(
        member,
        option.name
      )
  )
}

function getRegion(
  member
) {
  return (
    REGIONS.find(
      option =>
        memberHasRole(
          member,
          option.name
        )
    ) ?? null
  )
}

function getStaffRole(
  member
) {
  return (
    STAFF_ROLES.find(
      roleName =>
        memberHasRole(
          member,
          roleName
        )
    ) ?? null
  )
}

function formatRoles(
  roles
) {
  if (
    roles.length === 0
  ) {
    return 'Not selected'
  }

  return roles
    .map(
      role =>
        `${role.emoji} ${role.name}`
    )
    .join('\n')
}

function discordTimestamp(
  date
) {
  if (!date) {
    return 'Unknown'
  }

  const unix =
    Math.floor(
      date.getTime() / 1000
    )

  return `<t:${unix}:D>`
}

// ============================================================
// COMMAND REGISTRATION
// ============================================================

async function ensureProfileCommand(
  guild
) {
  const commands =
    await guild.commands.fetch()

  const existing =
    commands.find(
      command =>
        command.name === 'profile'
    )

  const data = {
    name: 'profile',

    description:
      'View a RallyStack player profile',

    options: [
      {
        name: 'user',

        description:
          'Player whose profile you want to view',

        type:
          ApplicationCommandOptionType.User,

        required: false,
      },
    ],
  }

  if (existing) {
    await existing.edit(
      data
    )

    console.log(
      '[PROFILE] /profile updated'
    )

    return
  }

  await guild.commands.create(
    data
  )

  console.log(
    '[PROFILE] /profile registered'
  )
}

// ============================================================
// PROFILE EMBED
// ============================================================

function buildProfileEmbed(
  member,
  brand
) {
  const gameRoles =
    getGameRoles(
      member
    )

  const region =
    getRegion(
      member
    )

  const staffRole =
    getStaffRole(
      member
    )

  const isMember =
    memberHasRole(
      member,
      'Member'
    )

  const lookingToPlay =
    memberHasRole(
      member,
      'Looking To Play'
    )

  const avatar =
    member.displayAvatarURL({
      size: 256,
    })

  const regionText =
    region
      ? `${region.emoji} ${region.name}`
      : 'Not selected'

  const accessText =
    staffRole
      ? `RallyStack Staff - ${staffRole}`
      : isMember
        ? 'RallyStack Member'
        : 'Onboarding'

  const lfgText =
    lookingToPlay
      ? '\u{1F7E2} Looking to play'
      : '\u26AB Not currently looking'

  return new EmbedBuilder()
    .setColor(
      brand
    )

    .setAuthor({
      name:
        'RALLYSTACK PLAYER PROFILE',
    })

    .setTitle(
      member.displayName
    )

    .setThumbnail(
      avatar
    )

    .addFields(
      {
        name:
          'WARDOGS Roles',

        value:
          formatRoles(
            gameRoles
          ),

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
          accessText,

        inline:
          true,
      },

      {
        name:
          'Looking For Group',

        value:
          lfgText,

        inline:
          true,
      },

      {
        name:
          'Discord',

        value:
          `<@${member.id}>`,

        inline:
          true,
      },

      {
        name:
          'Joined RallyStack',

        value:
          discordTimestamp(
            member.joinedAt
          ),

        inline:
          true,
      }
    )

    .setFooter({
      text:
        'RALLYSTACK | BUILD. SQUAD UP. DEPLOY.',
    })

    .setTimestamp()
}

// ============================================================
// MODULE
// ============================================================

export function registerProfileCommand(
  client,
  config,
  brand
) {
  // ----------------------------------------------------------
  // REGISTER COMMAND
  // ----------------------------------------------------------

  client.once(
    Events.ClientReady,

    async readyClient => {
      try {
        const guild =
          await readyClient.guilds.fetch(
            config.guildId
          )

        await ensureProfileCommand(
          guild
        )
      }
      catch (error) {
        console.error(
          '[PROFILE] Command registration failed',
          error?.rawError ?? error
        )
      }
    }
  )

  // ----------------------------------------------------------
  // HANDLE /PROFILE
  // ----------------------------------------------------------

  client.on(
    Events.InteractionCreate,

    async interaction => {
      if (
        !interaction.isChatInputCommand()
      ) {
        return
      }

      if (
        interaction.commandName !==
        'profile'
      ) {
        return
      }

      if (
        !interaction.guild
      ) {
        return
      }

      try {
        const targetUser =
          interaction.options.getUser(
            'user'
          ) ??
          interaction.user

        const member =
          await interaction.guild.members.fetch(
            targetUser.id
          )

        const embed =
          buildProfileEmbed(
            member,
            brand
          )

        const activeGroup =
          getActiveGroupForUser(
            member.id
          )

        if (activeGroup) {
          const groupStatus =
            activeGroup.memberIds.length >=
            activeGroup.maxPlayers
              ? '\u{1F534} Full'
              : activeGroup.status === 'running'
                ? '\u{1F7E0} Group Running'
                : '\u{1F7E2} Recruiting'

          embed.addFields({
            name:
              'Active Group',

            value:
              `${activeGroup.activityEmoji ?? ''} **${activeGroup.activityLabel ?? 'RallyStack Group'}**
${activeGroup.memberIds.length} / ${activeGroup.maxPlayers} players
${groupStatus}`,

            inline:
              false,
          })
        }

        await interaction.reply({
          embeds: [
            embed,
          ],
        })

        // Automatically remove public profile cards so
        // community channels do not fill up with old profiles.

        setTimeout(
          async () => {
            try {
              await interaction.deleteReply()

              console.log(
                `[PROFILE] Auto-deleted profile for ${member.user.username}`
              )
            }
            catch {
              // Message may already have been deleted.
            }
          },
          PROFILE_DELETE_AFTER_MS
        )
      }
      catch (error) {
        console.error(
          '[PROFILE] Command failed',
          error?.rawError ?? error
        )

        if (
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              'RallyStack could not load that player profile.',

            ephemeral:
              true,
          }).catch(
            () => {}
          )
        }
      }
    }
  )
}