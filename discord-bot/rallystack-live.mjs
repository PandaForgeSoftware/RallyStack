const WARDOGS_APP_ID =
  '1867240'

function config() {
  const supabaseUrl =
    process.env.RALLYSTACK_SUPABASE_URL

  const secretKey =
    process.env.RALLYSTACK_SUPABASE_SECRET_KEY

  if (
    !supabaseUrl ||
    !secretKey
  ) {
    throw new Error(
      'RallyStack Supabase backend configuration is missing.'
    )
  }

  return {
    supabaseUrl,
    secretKey,
  }
}

function supabaseHeaders(
  secretKey
) {
  return {
    apikey:
      secretKey,

    Authorization:
      `Bearer ${secretKey}`,

    'Content-Type':
      'application/json',
  }
}

async function getLinkedAccount(
  filters
) {
  const {
    supabaseUrl,
    secretKey,
  } =
    config()

  const url =
    new URL(
      `${supabaseUrl}/rest/v1/linked_accounts`
    )

  for (
    const [
      key,
      value,
    ] of Object.entries(
      filters
    )
  ) {
    url.searchParams.set(
      key,
      `eq.${value}`
    )
  }

  url.searchParams.set(
    'select',
    [
      'id',
      'user_id',
      'provider',
      'provider_user_id',
      'provider_username',
      'metadata',
    ].join(',')
  )

  url.searchParams.set(
    'limit',
    '1'
  )

  const response =
    await fetch(
      url,
      {
        headers:
          supabaseHeaders(
            secretKey
          ),
      }
    )

  if (!response.ok) {
    throw new Error(
      `RallyStack account lookup failed (${response.status}).`
    )
  }

  const rows =
    await response.json()

  return rows?.[0] ?? null
}

async function getSteamApiKey() {
  const {
    supabaseUrl,
    secretKey,
  } =
    config()

  const response =
    await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_steam_web_api_key`,
      {
        method:
          'POST',

        headers:
          supabaseHeaders(
            secretKey
          ),

        body:
          '{}',
      }
    )

  if (!response.ok) {
    throw new Error(
      `Steam API key lookup failed (${response.status}).`
    )
  }

  const key =
    await response.json()

  if (
    typeof key !==
      'string' ||
    !key
  ) {
    throw new Error(
      'Steam API key was not returned by RallyStack.'
    )
  }

  return key
}

async function getSteamSummary(
  steamId
) {
  const apiKey =
    await getSteamApiKey()

  const url =
    new URL(
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/'
    )

  url.searchParams.set(
    'key',
    apiKey
  )

  url.searchParams.set(
    'steamids',
    steamId
  )

  const response =
    await fetch(
      url
    )

  if (!response.ok) {
    throw new Error(
      `Steam presence lookup failed (${response.status}).`
    )
  }

  const data =
    await response.json()

  return (
    data?.response?.players?.[0] ??
    null
  )
}

export async function getDiscordWardogsPresence(
  discordUserId
) {
  const discord =
    await getLinkedAccount({
      provider:
        'discord',

      provider_user_id:
        String(
          discordUserId
        ),
    })

  if (!discord) {
    return {
      discordLinked:
        false,

      steamLinked:
        false,

      playingWardogs:
        false,

      serverIp:
        null,
    }
  }

  const steam =
    await getLinkedAccount({
      user_id:
        discord.user_id,

      provider:
        'steam',
    })

  if (
    !steam?.provider_user_id
  ) {
    return {
      discordLinked:
        true,

      steamLinked:
        false,

      playingWardogs:
        false,

      serverIp:
        null,
    }
  }

  const player =
    await getSteamSummary(
      steam.provider_user_id
    )

  if (!player) {
    return {
      discordLinked:
        true,

      steamLinked:
        true,

      playingWardogs:
        false,

      serverIp:
        null,
    }
  }

  const gameId =
    player.gameid == null
      ? null
      : String(
          player.gameid
        )

  return {
    discordLinked:
      true,

    steamLinked:
      true,

    steamId:
      steam.provider_user_id,

    steamUsername:
      player.personaname ??
      steam.provider_username ??
      null,

    gameId,

    gameName:
      player.gameextrainfo ??
      null,

    playingWardogs:
      gameId ===
      WARDOGS_APP_ID,

    serverIp:
      player.gameserverip ??
      null,

    checkedAt:
      new Date().toISOString(),
  }
}