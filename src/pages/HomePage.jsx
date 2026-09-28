import {
  ArrowRight,
  Backpack,
  Crosshair,
  Headphones,
  Radio,
  Shield,
  Swords,
  Users,
  UserSearch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PromotionStrip from '../components/commerce/PromotionStrip'

const groups = [
  {
    title: 'EU Tactical Squad',
    host: 'GhostActual',
    players: '3 / 5',
    region: 'EU',
    style: 'Tactical',
    needs: 'Medic • Logistics',
  },
  {
    title: 'New Players Welcome',
    host: 'RavenSix',
    players: '2 / 5',
    region: 'UK / EU',
    style: 'Casual',
    needs: 'Any role',
  },
  {
    title: 'Late Night Operations',
    host: '[LAST] Panda',
    players: '4 / 5',
    region: 'EU',
    style: 'Casual Tactical',
    needs: 'Support',
  },
]

const builds = [
  {
    name: 'Frontline Assault',
    weapon: 'M4A1',
    author: '[LAST] Scott',
    role: 'ASSAULT',
    cost: '$6,840',
  },
  {
    name: 'Field Medic',
    weapon: 'AK-74M',
    author: 'DocHoliday',
    role: 'MEDIC',
    cost: '$5,420',
  },
  {
    name: 'Recon Lightweight',
    weapon: 'SKS',
    author: 'GreyFox',
    role: 'RECON',
    cost: '$4,980',
  },
]

const squads = [
  {
    name: 'LAST ORDERS',
    tag: '[LAST]',
    region: 'UK / EU',
    members: '18 members',
    status: 'RECRUITING',
    motto: 'ONE MORE ROUND.',
  },
  {
    name: 'Vanguard',
    tag: '[VNGD]',
    region: 'EU',
    members: '31 members',
    status: 'RECRUITING',
    motto: 'Push together.',
  },
  {
    name: 'Night Watch',
    tag: '[NW]',
    region: 'UK',
    members: '12 members',
    status: 'OPEN',
    motto: 'Hold the line.',
  },
]

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5">
      <div>
        <div className="mb-2 text-[10px] font-bold tracking-[0.3em] text-amber-500">
          {eyebrow}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
          {title}
        </h2>
      </div>

      {action && (
        <button className="hidden items-center gap-2 text-xs font-bold tracking-wider text-stone-400 transition hover:text-white sm:flex">
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  )
}

function HomePage() {
  return (
    <main>
      <PromotionStrip />

      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(245,158,11,0.11),transparent_35%)]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:52px_52px]" />

        <div className="relative mx-auto grid min-h-[610px] max-w-[1500px] items-center gap-14 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8">

          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-[2px] w-8 bg-amber-500" />

              <span className="text-xs font-bold tracking-[0.32em] text-amber-500">
                WARDOGS COMMUNITY PLATFORM
              </span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl lg:text-[82px]">
              BUILD YOUR KIT.
              <br />
              FIND YOUR{' '}
              <span className="text-amber-500">
                SQUAD.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-stone-400 md:text-lg">
              Build and share WARDOGS loadouts, find players who match
              your style, join a squad and get into the fight without
              spending forty minutes screaming into Discord looking
              for a medic.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/loadouts"
                className="flex h-13 items-center gap-3 bg-amber-500 px-6 text-sm font-black tracking-wider text-black transition hover:bg-amber-400"
              >
                <Backpack size={18} />
                BUILD A LOADOUT
              </Link>

              <Link
                to="/find-players"
                className="flex h-13 items-center gap-3 border border-white/15 bg-white/[0.03] px-6 text-sm font-black tracking-wider text-white transition hover:border-white/30 hover:bg-white/[0.06]"
              >
                <UserSearch size={18} />
                FIND PLAYERS
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-9 gap-y-4 text-xs font-bold tracking-wider text-stone-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-500" />
                27 LOOKING TO PLAY
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-amber-500" />
                8 GROUPS FORMING
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-sky-500" />
                14 SQUADS RECRUITING
              </span>
            </div>
          </div>


          <div className="hidden lg:block">
            <div className="relative ml-auto max-w-[480px] border border-white/10 bg-[#111416]/90 p-2">

              <div className="border border-white/8 bg-[#0d1011] p-6">

                <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-5">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.25em] text-amber-500">
                      FEATURED SQUAD
                    </div>

                    <div className="mt-2 text-2xl font-black text-white">
                      LAST ORDERS{' '}
                      <span className="text-amber-500">
                        [LAST]
                      </span>
                    </div>
                  </div>

                  <Shield
                    size={34}
                    className="text-amber-500"
                  />
                </div>


                <div className="mb-6 py-8 text-center">

                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/[0.06]">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-black/40">
                      <span className="text-4xl font-black text-amber-500">
                        LAST
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 text-sm font-black tracking-[0.25em] text-stone-200">
                    ONE MORE ROUND.
                  </div>

                  <div className="mt-2 text-xs text-stone-500">
                    UK / EU • Casual Tactical • Recruiting
                  </div>
                </div>


                <div className="grid grid-cols-3 border-t border-white/8 pt-5 text-center">

                  <div>
                    <div className="text-lg font-black text-white">
                      18
                    </div>

                    <div className="text-[9px] font-bold tracking-wider text-stone-500">
                      MEMBERS
                    </div>
                  </div>

                  <div className="border-x border-white/8">
                    <div className="text-lg font-black text-emerald-400">
                      7
                    </div>

                    <div className="text-[9px] font-bold tracking-wider text-stone-500">
                      ONLINE
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-black text-white">
                      3
                    </div>

                    <div className="text-[9px] font-bold tracking-wider text-stone-500">
                      EVENTS
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>


      <section className="border-b border-white/8 bg-[#0e1011]">
        <div className="mx-auto grid max-w-[1500px] divide-y divide-white/8 px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8">

          {[
            {
              icon: Crosshair,
              title: 'BUILD LOADOUTS',
              text: 'Weapons, attachments, armour and equipment.',
            },
            {
              icon: Users,
              title: 'FIND PLAYERS',
              text: 'Find people by region, role and play style.',
            },
            {
              icon: Shield,
              title: 'JOIN SQUADS',
              text: 'Recruit, organise and build persistent squads.',
            },
            {
              icon: Radio,
              title: 'SQUAD UP',
              text: 'Create groups and fill the roles you actually need.',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="flex gap-4 px-5 py-7"
              >
                <Icon
                  size={22}
                  className="mt-1 shrink-0 text-amber-500"
                />

                <div>
                  <div className="text-xs font-black tracking-wider text-white">
                    {item.title}
                  </div>

                  <div className="mt-2 text-xs leading-5 text-stone-500">
                    {item.text}
                  </div>
                </div>
              </div>
            )
          })}

        </div>
      </section>


      <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-8">

        <SectionHeader
          eyebrow="LOOKING FOR GROUP"
          title="Groups forming now"
          action="VIEW ALL GROUPS"
        />

        <div className="grid gap-4 lg:grid-cols-3">

          {groups.map((group) => (
            <article
              key={group.title}
              className="group border border-white/8 bg-[#111416] p-5 transition hover:border-amber-500/35"
            >

              <div className="mb-5 flex items-start justify-between">

                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  PLAYING NOW
                </div>

                <div className="text-xs font-bold text-stone-500">
                  {group.players}
                </div>

              </div>

              <h3 className="text-xl font-black text-white">
                {group.title}
              </h3>

              <div className="mt-1 text-xs text-stone-500">
                Hosted by {group.host}
              </div>


              <div className="my-5 grid grid-cols-2 gap-3 border-y border-white/8 py-4">

                <div>
                  <div className="text-[9px] font-bold tracking-wider text-stone-600">
                    REGION
                  </div>

                  <div className="mt-1 text-xs font-bold text-stone-300">
                    {group.region}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-bold tracking-wider text-stone-600">
                    PLAY STYLE
                  </div>

                  <div className="mt-1 text-xs font-bold text-stone-300">
                    {group.style}
                  </div>
                </div>

              </div>


              <div className="flex items-center justify-between">

                <div>
                  <div className="text-[9px] font-bold tracking-wider text-stone-600">
                    NEEDS
                  </div>

                  <div className="mt-1 text-xs text-amber-500">
                    {group.needs}
                  </div>
                </div>

                <button className="border border-white/10 px-4 py-2 text-[10px] font-black tracking-wider text-white transition group-hover:border-amber-500/40">
                  JOIN GROUP
                </button>

              </div>

            </article>
          ))}

        </div>
      </section>


      <section className="border-y border-white/8 bg-[#0e1011]">

        <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-8">

          <SectionHeader
            eyebrow="COMMUNITY BUILDS"
            title="Popular loadouts"
            action="BROWSE LOADOUTS"
          />

          <div className="grid gap-4 lg:grid-cols-3">

            {builds.map((build) => (
              <article
                key={build.name}
                className="border border-white/8 bg-[#111416] transition hover:border-white/15"
              >

                <div className="flex min-h-44 items-center justify-center border-b border-white/8 bg-black/20">
                  <Crosshair
                    size={58}
                    strokeWidth={1}
                    className="text-stone-700"
                  />
                </div>

                <div className="p-5">

                  <div className="mb-3 flex items-center justify-between">
                    <span className="bg-amber-500/10 px-2 py-1 text-[9px] font-black tracking-wider text-amber-500">
                      {build.role}
                    </span>

                    <span className="text-sm font-black text-white">
                      {build.cost}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {build.name}
                  </h3>

                  <div className="mt-1 text-sm text-stone-500">
                    {build.weapon}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">

                    <span className="text-xs text-stone-500">
                      by{' '}
                      <span className="text-stone-300">
                        {build.author}
                      </span>
                    </span>

                    <ArrowRight
                      size={16}
                      className="text-stone-500"
                    />

                  </div>

                </div>

              </article>
            ))}

          </div>
        </div>
      </section>


      <section className="mx-auto max-w-[1500px] px-5 py-20 lg:px-8">

        <SectionHeader
          eyebrow="FIND YOUR PEOPLE"
          title="Squads recruiting"
          action="BROWSE SQUADS"
        />

        <div className="grid gap-4 lg:grid-cols-3">

          {squads.map((squad) => (
            <article
              key={squad.name}
              className="border border-white/8 bg-[#111416] p-5 transition hover:border-amber-500/25"
            >

              <div className="flex items-start gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-white/10 bg-black/30">
                  <Shield
                    size={28}
                    className="text-stone-600"
                  />
                </div>

                <div className="min-w-0">

                  <div className="text-xl font-black text-white">
                    {squad.name}{' '}
                    <span className="text-amber-500">
                      {squad.tag}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-stone-500">
                    {squad.region} • {squad.members}
                  </div>

                  <div className="mt-3 inline-flex bg-emerald-500/10 px-2 py-1 text-[9px] font-black tracking-wider text-emerald-400">
                    {squad.status}
                  </div>

                </div>

              </div>

              <div className="mt-6 border-t border-white/8 pt-5">

                <div className="text-xs font-bold tracking-[0.16em] text-stone-300">
                  {squad.motto}
                </div>

              </div>

            </article>
          ))}

        </div>
      </section>


      <section className="border-t border-white/8 bg-[#111416]">

        <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-14 md:flex-row md:items-center md:justify-between lg:px-8">

          <div>
            <div className="text-[10px] font-bold tracking-[0.3em] text-amber-500">
              READY TO DEPLOY?
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              Stop queuing alone.
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Create a profile, build your kit and find people worth playing with.
            </p>
          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              to="/find-players"
              className="flex items-center gap-2 bg-amber-500 px-5 py-3 text-xs font-black tracking-wider text-black"
            >
              <Headphones size={17} />
              FIND PLAYERS
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-2 border border-white/10 px-5 py-3 text-xs font-black tracking-wider text-white"
            >
              <Swords size={17} />
              CREATE PROFILE
            </Link>

          </div>

        </div>
      </section>

    </main>
  )
}

export default HomePage