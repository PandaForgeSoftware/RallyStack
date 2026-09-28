import { Link } from 'react-router-dom'
import { Boxes } from 'lucide-react'

function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/8 bg-[#080a0b]">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-8">

        <div className="grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/[0.06]">
              <Boxes
                size={20}
                className="text-amber-500"
              />
            </div>

            <div>
              <div className="text-sm font-black tracking-wide text-white">
                RALLY
                <span className="text-amber-500">
                  STACK
                </span>
              </div>

              <div className="mt-1 text-[10px] font-bold tracking-[0.22em] text-stone-600">
                A PANDAFORGE SOFTWARE PROJECT
              </div>

              <p className="mt-3 max-w-xl text-xs leading-5 text-stone-600">
                Community-built tools for loadouts, squads,
                finding players and getting into the fight.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-black tracking-wider text-stone-500">
            <Link
              to="/legal"
              className="transition hover:text-white"
            >
              LEGAL
            </Link>

            <span className="cursor-default text-stone-700">
              PRIVACY · COMING SOON
            </span>

            <span className="cursor-default text-stone-700">
              TERMS · COMING SOON
            </span>
          </div>
        </div>

        <div className="border-t border-white/8 py-6">
          <div className="flex flex-col gap-4 text-[10px] leading-5 text-stone-600 lg:flex-row lg:items-start lg:justify-between">

            <div>
              © {year} PandaForge Software.
              RallyStack website code, interface and original artwork.
              All rights reserved.
            </div>

            <div className="max-w-3xl lg:text-right">
              RallyStack is an independent community project and is not
              affiliated with, endorsed by or sponsored by BULKHEAD or Team17.
              WARDOGS and related game names, logos, artwork and trademarks
              remain the property of their respective owners.
            </div>

          </div>
        </div>

      </div>
    </footer>
  )
}

export default SiteFooter
