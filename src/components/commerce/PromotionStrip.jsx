import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  BadgePercent,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

function PromotionStrip() {
  const [promotion, setPromotion] = useState(null)

  useEffect(() => {
    const loadPromotion = async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('priority', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle()

      if (!error) {
        setPromotion(data)
      }
    }

    loadPromotion()
  }, [])

  if (!promotion) {
    return null
  }

  const salePrice = formatPrice(
    promotion.sale_price,
    promotion.currency,
  )

  const originalPrice = formatPrice(
    promotion.original_price,
    promotion.currency,
  )

  return (
    <section className="border-b border-amber-500/20 bg-amber-500/[0.06]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">

        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/10">
            <BadgePercent
              size={19}
              className="text-amber-500"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {promotion.is_affiliate && (
                <span className="bg-amber-500 px-2 py-1 text-[9px] font-black tracking-wider text-black">
                  AD · AFFILIATE
                </span>
              )}

              {promotion.badge && (
                <span className="border border-amber-500/30 px-2 py-1 text-[9px] font-black tracking-wider text-amber-500">
                  {promotion.badge}
                </span>
              )}

              <span className="text-sm font-black text-white">
                {promotion.title}
              </span>
            </div>

            {promotion.subtitle && (
              <div className="mt-1 text-xs text-stone-500">
                {promotion.subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {salePrice && (
            <div className="text-right">
              {originalPrice && (
                <div className="text-[10px] text-stone-600 line-through">
                  {originalPrice}
                </div>
              )}

              <div className="text-lg font-black text-amber-500">
                {salePrice}
              </div>
            </div>
          )}

          {promotion.discount_percent > 0 && (
            <div className="bg-emerald-500 px-3 py-2 text-xs font-black text-black">
              -{promotion.discount_percent}%
            </div>
          )}

          <a
            href={promotion.destination_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex h-10 items-center gap-2 bg-amber-500 px-4 text-[10px] font-black tracking-wider text-black transition hover:bg-amber-400"
          >
            VIEW OFFER
            <ArrowUpRight size={14} />
          </a>
        </div>

      </div>
    </section>
  )
}

export default PromotionStrip
