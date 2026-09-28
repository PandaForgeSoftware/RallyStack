import {
  useEffect,
  useState,
} from 'react'
import {
  ArrowUpRight,
  BadgePercent,
  Handshake,
  ShoppingBag,
  Tag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const WARDOGS_STEAM_URL =
  'https://store.steampowered.com/app/1867240/WARDOGS/'

function formatPrice(value, currency) {
  if (value === null || value === undefined) {
    return null
  }

  const symbol =
    currency === 'GBP'
      ? '£'
      : currency === 'EUR'
        ? '€'
        : currency === 'USD'
          ? '$'
          : ''

  return `${symbol}${Number(value).toFixed(2)}`
}

function DealsPage() {
  const [promotions, setPromotions] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [
        promotionsResult,
        partnersResult,
      ] = await Promise.all([
        supabase
          .from('promotions')
          .select('*')
          .order('priority', {
            ascending: true,
          }),

        supabase
          .from('site_partnerships')
          .select('*')
          .order('name'),
      ])

      setPromotions(
        promotionsResult.data || [],
      )

      setPartners(
        partnersResult.data || [],
      )

      setLoading(false)
    }

    load()
  }, [])

  return (
    <main>
      <section className="border-b border-white/8 bg-[#0e1011]">
        <div className="mx-auto max-w-[1500px] px-5 py-14 lg:px-8">

          <div className="mb-3 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-500" />

            <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
              WARDOGS OFFERS
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            DEALS
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
            WARDOGS offers, official storefront links and future
            PandaForge partner promotions in one place.
          </p>

        </div>
      </section>


      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">

        {loading ? (
          <div className="py-20 text-center text-xs font-black tracking-[0.2em] text-stone-600">
            CHECKING OFFERS...
          </div>
        ) : (
          <>
            {partners.length > 0 && (
              <section className="mb-10">
                <div className="mb-5 flex items-center gap-3">
                  <Handshake
                    size={18}
                    className="text-amber-500"
                  />

                  <h2 className="text-sm font-black tracking-[0.15em] text-white">
                    PARTNERS
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {partners.map((partner) => (
                    <article
                      key={partner.id}
                      className="border border-white/8 bg-[#111416] p-5"
                    >
                      <div className="text-[9px] font-black tracking-[0.2em] text-amber-500">
                        {partner.display_label ||
                          partner.relationship_type
                            .replace('_', ' ')
                            .toUpperCase()}
                      </div>

                      <div className="mt-3 text-lg font-black text-white">
                        {partner.name}
                      </div>

                      {partner.disclosure && (
                        <p className="mt-3 text-xs leading-5 text-stone-500">
                          {partner.disclosure}
                        </p>
                      )}

                      {partner.destination_url && (
                        <a
                          href={partner.destination_url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="mt-5 inline-flex items-center gap-2 text-[10px] font-black tracking-wider text-amber-500"
                        >
                          VISIT PARTNER
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}


            <section>
              <div className="mb-5 flex items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  <BadgePercent
                    size={18}
                    className="text-amber-500"
                  />

                  <h2 className="text-sm font-black tracking-[0.15em] text-white">
                    CURRENT OFFERS
                  </h2>
                </div>

                <div className="text-[9px] font-bold tracking-wider text-stone-600">
                  VERIFIED LINKS ONLY
                </div>
              </div>

              {promotions.length === 0 ? (
                <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

                  <div className="border border-white/8 bg-[#111416] p-7">
                    <Tag
                      size={24}
                      className="text-stone-600"
                    />

                    <h3 className="mt-5 text-xl font-black text-white">
                      No RallyStack deals currently listed
                    </h3>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
                      When WARDOGS goes on sale, or PandaForge has an
                      approved partner promotion, it will appear here and
                      automatically surface across RallyStack.
                    </p>
                  </div>


                  <div className="border border-white/8 bg-[#0e1011] p-6">
                    <ShoppingBag
                      size={23}
                      className="text-sky-400"
                    />

                    <div className="mt-5 text-[10px] font-black tracking-[0.2em] text-stone-500">
                      OFFICIAL STOREFRONT
                    </div>

                    <h3 className="mt-2 text-xl font-black text-white">
                      WARDOGS on Steam
                    </h3>

                    <p className="mt-3 text-xs leading-5 text-stone-500">
                      This is a normal Steam link and is not currently
                      an affiliate link.
                    </p>

                    <a
                      href={WARDOGS_STEAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex h-11 items-center justify-center gap-2 border border-white/10 text-[10px] font-black tracking-wider text-white transition hover:border-sky-500/40"
                    >
                      OPEN STEAM
                      <ArrowUpRight size={14} />
                    </a>
                  </div>

                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {promotions.map((promotion) => {
                    const originalPrice =
                      formatPrice(
                        promotion.original_price,
                        promotion.currency,
                      )

                    const salePrice =
                      formatPrice(
                        promotion.sale_price,
                        promotion.currency,
                      )

                    return (
                      <article
                        key={promotion.id}
                        className="overflow-hidden border border-white/8 bg-[#111416]"
                      >

                        {promotion.image_url && (
                          <div className="aspect-[16/8] overflow-hidden border-b border-white/8 bg-black/30">
                            <img
                              src={promotion.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="p-5">

                          <div className="flex flex-wrap items-center gap-2">

                            {promotion.is_affiliate && (
                              <span className="bg-amber-500 px-2 py-1 text-[9px] font-black tracking-wider text-black">
                                AD · AFFILIATE
                              </span>
                            )}

                            {promotion.badge && (
                              <span className="border border-white/10 px-2 py-1 text-[9px] font-black tracking-wider text-stone-400">
                                {promotion.badge}
                              </span>
                            )}

                            {promotion.store_name && (
                              <span className="text-[9px] font-black tracking-wider text-stone-600">
                                {promotion.store_name}
                              </span>
                            )}

                          </div>

                          <h3 className="mt-4 text-xl font-black text-white">
                            {promotion.title}
                          </h3>

                          {promotion.description && (
                            <p className="mt-3 text-xs leading-5 text-stone-500">
                              {promotion.description}
                            </p>
                          )}

                          {(originalPrice || salePrice) && (
                            <div className="mt-5 flex items-end gap-3">

                              {originalPrice && (
                                <div className="text-sm text-stone-600 line-through">
                                  {originalPrice}
                                </div>
                              )}

                              {salePrice && (
                                <div className="text-2xl font-black text-white">
                                  {salePrice}
                                </div>
                              )}

                              {promotion.discount_percent > 0 && (
                                <div className="bg-emerald-500 px-2 py-1 text-xs font-black text-black">
                                  -{promotion.discount_percent}%
                                </div>
                              )}

                            </div>
                          )}

                          {promotion.is_affiliate && (
                            <div className="mt-5 border-l-2 border-amber-500 bg-amber-500/[0.04] px-3 py-2 text-[10px] leading-5 text-stone-500">
                              {promotion.affiliate_disclosure ||
                                'Affiliate link. PandaForge Software receives commission from qualifying purchases made through this offer.'}
                            </div>
                          )}

                          <a
                            href={promotion.destination_url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="mt-5 flex h-11 items-center justify-center gap-2 bg-amber-500 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
                          >
                            VIEW OFFER
                            <ArrowUpRight size={14} />
                          </a>

                        </div>
                      </article>
                    )
                  })}

                </div>
              )}

            </section>


            <div className="mt-10 border border-white/8 bg-[#0e1011] p-5">
              <div className="text-[9px] font-black tracking-[0.2em] text-stone-600">
                COMMERCIAL TRANSPARENCY
              </div>

              <p className="mt-2 max-w-4xl text-xs leading-6 text-stone-500">
                RallyStack will clearly identify paid, sponsored or
                affiliate content. Normal store links are not described
                as partnerships unless PandaForge Software has an actual
                commercial relationship with the relevant company.
              </p>
            </div>

          </>
        )}

      </section>
    </main>
  )
}

export default DealsPage
