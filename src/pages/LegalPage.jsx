import {
  Copyright,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

function LegalPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-5 py-14 lg:px-8 lg:py-20">

      <div className="mb-10 border-b border-white/8 pb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-[2px] w-8 bg-amber-500" />

          <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
            PANDAFORGE SOFTWARE
          </span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Legal & ownership
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-500">
          RallyStack is an independently created community companion.
          This page explains what belongs to PandaForge Software and what does not.
        </p>
      </div>

      <div className="space-y-4">

        <section className="border border-white/8 bg-[#0e1011] p-6">
          <div className="flex gap-4">
            <Copyright
              size={22}
              className="mt-1 shrink-0 text-amber-500"
            />

            <div>
              <h2 className="text-lg font-black text-white">
                RallyStack ownership
              </h2>

              <p className="mt-3 text-sm leading-7 text-stone-500">
                Unless otherwise stated, the original RallyStack website code,
                interface design, original graphics and other original materials
                created specifically for RallyStack are © 2026 PandaForge Software.
                All rights reserved.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-white/8 bg-[#0e1011] p-6">
          <div className="flex gap-4">
            <ShieldCheck
              size={22}
              className="mt-1 shrink-0 text-amber-500"
            />

            <div>
              <h2 className="text-lg font-black text-white">
                WARDOGS disclaimer
              </h2>

              <p className="mt-3 text-sm leading-7 text-stone-500">
                RallyStack is an independent community project.
                It is not affiliated with, endorsed by, sponsored by or officially
                connected with BULKHEAD or Team17.
              </p>

              <p className="mt-3 text-sm leading-7 text-stone-500">
                WARDOGS and any related game names, logos, screenshots,
                artwork, characters, game data and trademarks belong to their
                respective owners. Their appearance on RallyStack does not imply
                ownership by PandaForge Software.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-white/8 bg-[#0e1011] p-6">
          <div className="flex gap-4">
            <ExternalLink
              size={22}
              className="mt-1 shrink-0 text-amber-500"
            />

            <div>
              <h2 className="text-lg font-black text-white">
                Third-party services
              </h2>

              <p className="mt-3 text-sm leading-7 text-stone-500">
                RallyStack may connect to third-party services including Discord,
                Steam and other game or community services. Those services remain
                subject to their own terms, privacy policies and availability.
              </p>
            </div>
          </div>
        </section>

        <section className="border border-amber-500/20 bg-amber-500/[0.04] p-6">
          <div className="text-[10px] font-black tracking-[0.24em] text-amber-500">
            BEFORE PUBLIC LAUNCH
          </div>

          <p className="mt-3 text-sm leading-7 text-stone-400">
            RallyStack will also need a proper Privacy Policy and Terms of Use
            before public registration is opened widely, especially because the
            service will hold account information and connect to third-party
            identities.
          </p>
        </section>

      </div>
    </main>
  )
}

export default LegalPage
