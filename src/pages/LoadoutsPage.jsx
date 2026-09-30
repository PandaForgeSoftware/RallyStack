import {
  useMemo,
  useState,
} from 'react'

import {
  Backpack,
  ChevronLeft,
  Crosshair,
  Minus,
  Package,
  Plus,
  Search,
  Shield,
  ShoppingCart,
  X,
} from 'lucide-react'

import {
  backpacks,
  dataVersion,
  looseAmmo,
  weapons,
} from '../data/wardogsLoadoutData'
import BackpackPackingView from '../features/loadouts/components/BackpackPackingView'
import WardogsItemImage from '../features/loadouts/components/WardogsItemImage'

const money = (value) =>
  `$${Number(value || 0).toLocaleString()}`

const slots = [
  {
    id: 'primary',
    title: 'PRIMARY WEAPON',
    icon: Crosshair,
    description:
      'Rifles, SMGs, LMGs, shotguns and precision weapons',
  },
  {
    id: 'sidearm',
    title: 'SIDEARM',
    icon: Crosshair,
    description:
      'Pistols and sidearms',
  },
  {
    id: 'specialist',
    title: 'SPECIALIST',
    icon: Package,
    description:
      'Launchers and specialist weapons',
  },
  {
    id: 'helmet',
    title: 'HELMET',
    icon: Shield,
    description:
      'Head protection',
  },
  {
    id: 'armor',
    title: 'ARMOUR',
    icon: Shield,
    description:
      'Body armour',
  },
  {
    id: 'vest',
    title: 'TACTICAL VEST',
    icon: Shield,
    description:
      'Chest rigs and tactical vests',
  },
  {
    id: 'backpack',
    title: 'BACKPACK',
    icon: Backpack,
    description:
      'Storage packs and weapon slings',
  },
]

const weaponSlots =
  new Set([
    'primary',
    'sidearm',
    'specialist',
  ])

const backpackCategories = [
  'RECOMMENDED',
  'MEDICAL',
  'LOOSE AMMO',
  'MAGAZINES',
  'GRENADES',
  'TACTICAL',
  'BUILDING',
  'RECON',
  'VEHICLE',
]

function OperatorFigure({
  selectedSlot,
  selectSlot,
  equipped,
  backpack,
  openBackpack,
}) {

  const slotClass =
    (slot) =>
      [
        'absolute z-20 border px-3 py-2 text-left transition',
        selectedSlot === slot
          ? 'border-amber-500 bg-amber-500/[0.10]'
          : 'border-white/10 bg-[#0d1012]/95 hover:border-amber-500/40',
      ].join(' ')

  return (
    <div className="relative mx-auto h-[650px] w-full max-w-[500px] overflow-hidden">

      <div className="absolute inset-x-[14%] top-[4%] bottom-[2%] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_65%)]" />

      <div className="absolute left-1/2 top-10 h-[570px] w-[280px] -translate-x-1/2">

        <svg
          viewBox="0 0 300 620"
          className="h-full w-full"
        >

          <defs>

            <linearGradient
              id="body"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#24292b"
              />

              <stop
                offset="100%"
                stopColor="#101315"
              />
            </linearGradient>

            <linearGradient
              id="gear"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#282e30"
              />

              <stop
                offset="100%"
                stopColor="#15191b"
              />
            </linearGradient>

          </defs>

          <ellipse
            cx="150"
            cy="606"
            rx="100"
            ry="10"
            fill="rgba(0,0,0,.45)"
          />

          <path
            d="M111 70 Q150 35 189 70 L187 113 Q173 137 150 139 Q127 137 113 113 Z"
            fill="#15191b"
            stroke={
              selectedSlot === 'helmet'
                ? '#f59e0b'
                : '#343a3d'
            }
            strokeWidth="3"
          />

          <path
            d="M120 75 Q150 45 180 75 L178 88 L122 88 Z"
            fill="#24292b"
          />

          <path
            d="M132 136 L168 136 L178 163 L122 163 Z"
            fill="#15191b"
          />

          <path
            d="M87 165 Q150 135 213 165 L231 300 Q194 326 150 329 Q106 326 69 300 Z"
            fill="url(#body)"
            stroke={
              selectedSlot === 'armor'
                ? '#f59e0b'
                : '#303639'
            }
            strokeWidth="3"
          />

          <path
            d="M105 176 L195 176 L207 271 Q179 289 150 291 Q121 289 93 271 Z"
            fill="url(#gear)"
            stroke={
              selectedSlot === 'vest'
                ? '#f59e0b'
                : '#343a3d'
            }
            strokeWidth="3"
          />

          <path
            d="M112 192 L188 192"
            stroke="#41484b"
            strokeWidth="3"
          />

          <path
            d="M109 217 L191 217"
            stroke="#41484b"
            strokeWidth="3"
          />

          <rect
            x="112"
            y="233"
            width="34"
            height="31"
            rx="3"
            fill="#111416"
            stroke="#3a4144"
          />

          <rect
            x="154"
            y="233"
            width="34"
            height="31"
            rx="3"
            fill="#111416"
            stroke="#3a4144"
          />

          <path
            d="M81 173 Q52 188 43 236 L30 350 Q32 365 46 367 Q59 366 64 350 L85 245 L101 205 Z"
            fill="url(#body)"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M219 173 Q248 188 257 236 L270 350 Q268 365 254 367 Q241 366 236 350 L215 245 L199 205 Z"
            fill="url(#body)"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M91 296 L209 296 L218 359 L82 359 Z"
            fill="#171b1d"
            stroke="#303639"
            strokeWidth="3"
          />

          <rect
            x="197"
            y="308"
            width="30"
            height="52"
            rx="4"
            fill="#111416"
            stroke={
              selectedSlot === 'sidearm'
                ? '#f59e0b'
                : '#363d40'
            }
            strokeWidth="3"
          />

          <path
            d="M92 358 L144 358 L137 587 L82 587 L72 540 Z"
            fill="url(#body)"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M156 358 L208 358 L228 540 L218 587 L163 587 Z"
            fill="url(#body)"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M75 586 L140 586 L136 607 L61 607 Q60 595 75 586 Z"
            fill="#101315"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M160 586 L225 586 Q240 595 239 607 L164 607 Z"
            fill="#101315"
            stroke="#303639"
            strokeWidth="3"
          />

          <path
            d="M60 207 L225 320"
            stroke={
              selectedSlot === 'primary'
                ? '#f59e0b'
                : '#444b4e'
            }
            strokeWidth="11"
            strokeLinecap="round"
          />

          <path
            d="M51 198 L89 211"
            stroke="#1a1e20"
            strokeWidth="18"
            strokeLinecap="round"
          />

          <path
            d="M211 303 L254 334"
            stroke="#1a1e20"
            strokeWidth="13"
            strokeLinecap="round"
          />

          <path
            d="M194 155 Q223 164 229 201 L219 274"
            fill="none"
            stroke={
              selectedSlot === 'backpack'
                ? '#f59e0b'
                : '#343a3d'
            }
            strokeWidth="7"
          />

          <path
            d="M106 155 Q77 164 71 201 L81 274"
            fill="none"
            stroke={
              selectedSlot === 'backpack'
                ? '#f59e0b'
                : '#343a3d'
            }
            strokeWidth="7"
          />

          <path
            d="M215 118 L248 72 L259 79 L228 129"
            stroke={
              selectedSlot === 'specialist'
                ? '#f59e0b'
                : '#3e4548'
            }
            strokeWidth="12"
            strokeLinecap="round"
          />

        </svg>

      </div>

      <button
        type="button"
        onClick={() =>
          selectSlot('helmet')
        }
        className={`${slotClass('helmet')} left-1/2 top-0 w-40 -translate-x-1/2 text-center`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          HELMET
        </div>

        <div className="mt-1 text-[10px] font-black text-white">
          EMPTY
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot('primary')
        }
        className={`${slotClass('primary')} left-0 top-[170px] w-40`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          PRIMARY
        </div>

        <div className="mt-1 truncate text-[10px] font-black text-white">
          {equipped.primary?.name ||
            'EMPTY'}
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot(
            'specialist',
          )
        }
        className={`${slotClass('specialist')} right-0 top-[145px] w-40`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          SPECIALIST
        </div>

        <div className="mt-1 truncate text-[10px] font-black text-white">
          {equipped.specialist?.name ||
            'EMPTY'}
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot('armor')
        }
        className={`${slotClass('armor')} left-0 top-[320px] w-36`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          ARMOUR
        </div>

        <div className="mt-1 text-[10px] font-black text-white">
          EMPTY
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot('vest')
        }
        className={`${slotClass('vest')} right-0 top-[310px] w-40`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          TACTICAL VEST
        </div>

        <div className="mt-1 text-[10px] font-black text-white">
          EMPTY
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot('sidearm')
        }
        className={`${slotClass('sidearm')} right-0 top-[430px] w-40`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          SIDEARM
        </div>

        <div className="mt-1 truncate text-[10px] font-black text-white">
          {equipped.sidearm?.name ||
            'EMPTY'}
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          selectSlot('backpack')
        }
        className={`${slotClass('backpack')} left-0 top-[455px] w-40`}
      >
        <div className="text-[8px] font-black tracking-wider text-stone-600">
          BACKPACK
        </div>

        <div className="mt-1 truncate text-[10px] font-black text-white">
          {backpack.name}
        </div>
      </button>

      <button
        type="button"
        onClick={
          openBackpack
        }
        className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 border border-amber-500/40 bg-amber-500/[0.08] px-5 py-3 text-[9px] font-black tracking-[0.14em] text-amber-400 hover:bg-amber-500/[0.14]"
      >
        <Backpack size={15} />

        OPEN BACKPACK
      </button>

    </div>
  )
}

function LoadoutsPage() {

  const [
    activeTab,
    setActiveTab,
  ] =
    useState('builder')

  const [
    builderView,
    setBuilderView,
  ] =
    useState('operator')

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState('primary')

  const [
    weaponCategory,
    setWeaponCategory,
  ] =
    useState('ALL')

  const [
    backpackCategory,
    setBackpackCategory,
  ] =
    useState('RECOMMENDED')

  const [
    ammoCalibre,
    setAmmoCalibre,
  ] =
    useState('ALL')

  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    equipped,
    setEquipped,
  ] =
    useState({
      primary: null,
      sidearm: null,
      specialist: null,
    })

  const [
    selectedBackpackId,
    setSelectedBackpackId,
  ] =
    useState('assault')

  const [
    packedAmmo,
    setPackedAmmo,
  ] =
    useState({})

  const [
    selectedItem,
    setSelectedItem,
  ] =
    useState(null)

  const selectedBackpack =
    backpacks.find(
      (item) =>
        item.id ===
        selectedBackpackId,
    ) ||
    backpacks[0]

  const selectedSlotDefinition =
    slots.find(
      (item) =>
        item.id ===
        selectedSlot,
    )

  const equippedWeapons =
    useMemo(
      () =>
        Object.values(
          equipped,
        ).filter(Boolean),
      [equipped],
    )

  const equippedCalibres =
    useMemo(
      () =>
        new Set(
          equippedWeapons.map(
            (item) =>
              item.calibre,
          ),
        ),
      [equippedWeapons],
    )

  const slotWeapons =
    useMemo(
      () => {

        if (
          !weaponSlots.has(
            selectedSlot,
          )
        ) {
          return []
        }

        return weapons.filter(
          (item) =>
            item.slot ===
            selectedSlot,
        )
      },
      [selectedSlot],
    )

  const weaponCategories =
    useMemo(
      () => [
        'ALL',
        ...Array.from(
          new Set(
            slotWeapons.map(
              (item) =>
                item.category,
            ),
          ),
        ),
      ],
      [slotWeapons],
    )

  const visibleWeapons =
    useMemo(
      () => {

        const needle =
          query
            .trim()
            .toLowerCase()

        return slotWeapons.filter(
          (item) => {

            const categoryMatch =
              weaponCategory ===
                'ALL' ||
              item.category ===
                weaponCategory

            const searchMatch =
              !needle ||
              item.name
                .toLowerCase()
                .includes(needle) ||
              item.category
                .toLowerCase()
                .includes(needle) ||
              item.calibre
                .toLowerCase()
                .includes(needle)

            return (
              categoryMatch &&
              searchMatch
            )
          },
        )
      },
      [
        slotWeapons,
        weaponCategory,
        query,
      ],
    )

  const ammoCalibres =
    useMemo(
      () => [
        'ALL',
        ...Array.from(
          new Set(
            looseAmmo.map(
              (item) =>
                item.calibre,
            ),
          ),
        ),
      ],
      [],
    )

  const visibleAmmo =
    useMemo(
      () => {

        const needle =
          query
            .trim()
            .toLowerCase()

        return looseAmmo.filter(
          (item) => {

            const recommendedMode =
              backpackCategory ===
              'RECOMMENDED'

            const compatible =
              equippedCalibres.size ===
                0 ||
              equippedCalibres.has(
                item.calibre,
              )

            const calibreMatch =
              ammoCalibre ===
                'ALL' ||
              item.calibre ===
                ammoCalibre

            const searchMatch =
              !needle ||
              item.name
                .toLowerCase()
                .includes(needle) ||
              item.calibre
                .toLowerCase()
                .includes(needle)

            return (
              (
                !recommendedMode ||
                compatible
              ) &&
              calibreMatch &&
              searchMatch
            )
          },
        )
      },
      [
        query,
        backpackCategory,
        ammoCalibre,
        equippedCalibres,
      ],
    )

  const ammoRows =
    useMemo(
      () =>
        Object.entries(
          packedAmmo,
        )
          .map(
            ([
              id,
              stacks,
            ]) => {

              const ammo =
                looseAmmo.find(
                  (item) =>
                    item.id ===
                    id,
                )

              if (!ammo) {
                return null
              }

              return {
                ...ammo,
                stacks,
                rounds:
                  ammo.stack *
                  stacks,
              }
            },
          )
          .filter(Boolean),
      [packedAmmo],
    )

  const equipmentValue =
    useMemo(
      () =>
        equippedWeapons.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.price ||
                0,
            ),
          Number(
            selectedBackpack.price ||
              0,
          ),
        ),
      [
        equippedWeapons,
        selectedBackpack,
      ],
    )

  const contentsValue =
    useMemo(
      () =>
        ammoRows.reduce(
          (
            total,
            item,
          ) =>
            total +
            (
              Number(
                item.price ||
                  0,
              ) *
              item.stacks
            ),
          0,
        ),
      [ammoRows],
    )

  const totalValue =
    equipmentValue +
    contentsValue

  const knownWeight =
    useMemo(
      () =>
        equippedWeapons.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.weight ||
                0,
            ),
          Number(
            selectedBackpack.weight ||
              0,
          ),
        ),
      [
        equippedWeapons,
        selectedBackpack,
      ],
    )

  const totalRounds =
    ammoRows.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.rounds,
      0,
    )

  const totalPackedStacks =
    ammoRows.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.stacks,
      0,
    )

  const selectSlot =
    (slot) => {

      setSelectedSlot(
        slot,
      )

      setWeaponCategory(
        'ALL',
      )

      setQuery(
        '',
      )

      setSelectedItem(
        null,
      )

      setBuilderView(
        'operator',
      )
    }

  const equipWeapon =
    (item) => {

      setEquipped(
        (current) => ({
          ...current,
          [selectedSlot]:
            item,
        }),
      )

      setSelectedItem(
        item,
      )
    }

  const clearWeapon =
    (slot) => {

      setEquipped(
        (current) => ({
          ...current,
          [slot]:
            null,
        }),
      )
    }

  const equipBackpack =
    (item) => {

      setSelectedBackpackId(
        item.id,
      )

      setSelectedItem(
        item,
      )
    }

  const openBackpack =
    () => {

      setBuilderView(
        'backpack',
      )

      setBackpackCategory(
        'RECOMMENDED',
      )

      setAmmoCalibre(
        'ALL',
      )

      setQuery(
        '',
      )
    }

  const changeAmmoStacks =
    (
      id,
      difference,
    ) => {

      setPackedAmmo(
        (current) => {

          const next =
            Math.max(
              0,
              (
                current[id] ||
                0
              ) +
                difference,
            )

          const updated = {
            ...current,
          }

          if (
            next === 0
          ) {
            delete updated[id]
          }
          else {
            updated[id] =
              next
          }

          return updated
        },
      )
    }

  if (
    activeTab === 'builder' &&
    builderView === 'backpack'
  ) {
    return (
      <BackpackPackingView
        backpack={selectedBackpack}
        looseAmmo={looseAmmo}
        packedAmmo={packedAmmo}
        equippedCalibres={equippedCalibres}
        changeAmmoStacks={changeAmmoStacks}
        equipmentValue={equipmentValue}
        contentsValue={contentsValue}
        totalValue={totalValue}
        knownWeight={knownWeight}
        totalRounds={totalRounds}
        onBack={() =>
          setBuilderView(
            'operator',
          )
        }
      />
    )
  }
  const renderWeaponCatalogue =
    () => (
      <>

        <div className="mb-4 flex flex-wrap gap-2">

          {weaponCategories.map(
            (category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setWeaponCategory(
                    category,
                  )
                }
                className={[
                  'border px-3 py-2 text-[8px] font-black tracking-wider',
                  weaponCategory ===
                  category
                    ? 'border-amber-500/40 bg-amber-500/[0.07] text-amber-400'
                    : 'border-white/8 text-stone-600 hover:text-stone-300',
                ].join(' ')}
              >
                {category.toUpperCase()}
              </button>
            ),
          )}

        </div>

        <div className="grid gap-3 2xl:grid-cols-2">

          {visibleWeapons.map(
            (item) => (
              <article
                key={item.id}
                onClick={() =>
                  setSelectedItem(
                    item,
                  )
                }
                className="cursor-pointer border border-white/8 bg-[#111416] p-4 transition hover:border-amber-500/30"
              >

                <WardogsItemImage
                  item={item}
                  className="mb-4 h-28 w-full border border-white/6"
                  imageClassName="p-3"
                />

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <div className="text-sm font-black text-white">
                      {item.name}
                    </div>

                    <div className="mt-1 text-[9px] font-bold tracking-wider text-amber-500">
                      {item.category.toUpperCase()}
                    </div>
                  </div>

                  <div className="text-right text-sm font-black text-white">
                    {money(
                      item.price,
                    )}
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 border-y border-white/8 py-3 text-center">

                  <div>
                    <div className="text-[8px] text-stone-600">
                      DMG
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.damage ??
                        '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-stone-600">
                      RPM
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.rpm ??
                        '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-stone-600">
                      KG
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.weight}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-stone-600">
                      LEVEL
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.unlockLevel ??
                        '—'}
                    </div>
                  </div>

                </div>

                <div className="mt-3 flex items-center justify-between">

                  <div className="text-[10px] font-black text-stone-400">
                    {item.calibre}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {

                      event.stopPropagation()

                      equipWeapon(
                        item,
                      )
                    }}
                    className="bg-amber-500 px-4 py-2 text-[9px] font-black tracking-wider text-black"
                  >
                    EQUIP
                  </button>

                </div>

              </article>
            ),
          )}

        </div>

      </>
    )

  const renderBackpackCatalogue =
    () => (
      <div className="grid gap-3 2xl:grid-cols-2">

        {backpacks.map(
          (item) => (
            <article
              key={item.id}
              onClick={() =>
                setSelectedItem(
                  item,
                )
              }
              className={[
                'cursor-pointer border bg-[#111416] p-4',
                selectedBackpackId ===
                item.id
                  ? 'border-amber-500/45'
                  : 'border-white/8',
              ].join(' ')}
            >

              <WardogsItemImage
                  item={item}
                  className="mb-4 h-28 w-full border border-white/6"
                  imageClassName="p-3"
                />

              <div className="flex items-start justify-between gap-4">

                <div>
                  <div className="text-sm font-black text-white">
                    {item.name}
                  </div>

                  <div className="mt-1 text-[9px] text-stone-600">
                    {item.capacity} CELLS
                    {' / '}
                    {item.weight} KG
                  </div>
                </div>

                <div className="text-sm font-black text-amber-500">
                  {money(
                    item.price,
                  )}
                </div>

              </div>

              <div className="mt-4 grid grid-cols-3 border-y border-white/8 py-3 text-center">

                <div>
                  <div className="text-[8px] text-stone-600">
                    CAPACITY
                  </div>

                  <div className="mt-1 text-xs font-black text-white">
                    {item.capacity}
                  </div>
                </div>

                <div>
                  <div className="text-[8px] text-stone-600">
                    SLINGS
                  </div>

                  <div className="mt-1 text-xs font-black text-white">
                    {item.slings}
                  </div>
                </div>

                <div>
                  <div className="text-[8px] text-stone-600">
                    LEVEL
                  </div>

                  <div className="mt-1 text-xs font-black text-white">
                    {item.unlockLevel ??
                      '—'}
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={(event) => {

                  event.stopPropagation()

                  equipBackpack(
                    item,
                  )
                }}
                className="mt-3 w-full bg-amber-500 px-4 py-2 text-[9px] font-black tracking-wider text-black"
              >
                EQUIP BACKPACK
              </button>

            </article>
          ),
        )}

      </div>
    )

  const renderEmptyGear =
    () => (
      <div className="flex min-h-[440px] items-center justify-center text-center">

        <div className="max-w-md">

          <Package
            size={45}
            strokeWidth={1}
            className="mx-auto text-stone-700"
          />

          <div className="mt-5 text-lg font-black text-white">
            {selectedSlotDefinition?.title}
          </div>

          <p className="mt-2 text-xs leading-5 text-stone-600">
            This equipment position is already wired into the operator.
            Verified item data and imagery will be connected to it next.
          </p>

        </div>

      </div>
    )

  const renderOperatorCatalogue =
    () => {

      if (
        weaponSlots.has(
          selectedSlot,
        )
      ) {
        return renderWeaponCatalogue()
      }

      if (
        selectedSlot ===
        'backpack'
      ) {
        return renderBackpackCatalogue()
      }

      return renderEmptyGear()
    }

  const renderAmmoCards =
    () => (
      <div className="grid gap-3 xl:grid-cols-2">

        {visibleAmmo.map(
          (item) => {

            const stacks =
              packedAmmo[
                item.id
              ] ||
              0

            return (
              <article
                key={item.id}
                onClick={() =>
                  setSelectedItem(
                    item,
                  )
                }
                className="border border-white/8 bg-[#111416] p-4"
              >

                <div className="mb-4 flex h-24 items-center justify-center border border-white/6 bg-black/20">

                  <Package
                    size={36}
                    strokeWidth={1}
                    className="text-stone-700"
                  />

                </div>

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <div className="text-xs font-black text-white">
                      {item.name}
                    </div>

                    <div className="mt-1 text-[9px] text-stone-600">
                      {item.calibre}
                      {' / '}
                      STACK {item.stack}
                    </div>
                  </div>

                  <div className="text-sm font-black text-amber-500">
                    {money(
                      item.price,
                    )}
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-3 border-y border-white/8 py-3 text-center">

                  <div>
                    <div className="text-[8px] text-stone-600">
                      DAMAGE
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.damage}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-stone-600">
                      PEN
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.penetration}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-stone-600">
                      SPEED
                    </div>

                    <div className="mt-1 text-xs font-black text-white">
                      {item.speed}
                    </div>
                  </div>

                </div>

                <div className="mt-3 flex items-center justify-between">

                  <div className="text-[9px] text-stone-600">
                    {stacks > 0
                      ? `${stacks} STACK${stacks > 1 ? 'S' : ''} PACKED`
                      : 'NOT PACKED'}
                  </div>

                  <div className="flex gap-1">

                    <button
                      type="button"
                      disabled={
                        stacks ===
                        0
                      }
                      onClick={(event) => {

                        event.stopPropagation()

                        changeAmmoStacks(
                          item.id,
                          -1,
                        )
                      }}
                      className="flex h-8 w-8 items-center justify-center border border-white/10 text-stone-500 disabled:opacity-25"
                    >
                      <Minus size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {

                        event.stopPropagation()

                        changeAmmoStacks(
                          item.id,
                          1,
                        )
                      }}
                      className="flex h-8 items-center gap-2 bg-amber-500 px-3 text-[8px] font-black text-black"
                    >
                      <Plus size={13} />

                      ADD
                    </button>

                  </div>

                </div>

              </article>
            )
          },
        )}

      </div>
    )

  const renderBackpackCategory =
    () => {

      if (
        backpackCategory ===
          'RECOMMENDED' ||
        backpackCategory ===
          'LOOSE AMMO'
      ) {

        return (
          <>

            <div className="mb-4 flex flex-wrap gap-2">

              {ammoCalibres.map(
                (calibre) => (
                  <button
                    key={calibre}
                    type="button"
                    onClick={() =>
                      setAmmoCalibre(
                        calibre,
                      )
                    }
                    className={[
                      'border px-3 py-2 text-[8px] font-black tracking-wider',
                      ammoCalibre ===
                      calibre
                        ? 'border-amber-500/40 bg-amber-500/[0.07] text-amber-400'
                        : 'border-white/8 text-stone-600',
                    ].join(' ')}
                  >
                    {calibre}
                  </button>
                ),
              )}

            </div>

            {renderAmmoCards()}

          </>
        )
      }

      return (
        <div className="flex min-h-[470px] items-center justify-center text-center">

          <div className="max-w-md">

            <Package
              size={46}
              strokeWidth={1}
              className="mx-auto text-stone-700"
            />

            <div className="mt-5 text-lg font-black text-white">
              {backpackCategory}
            </div>

            <p className="mt-2 text-xs leading-5 text-stone-600">
              The category is ready in the packing interface.
              Verified WARDOGS items and correct imagery will populate
              this section rather than using invented records.
            </p>

          </div>

        </div>
      )
    }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#090b0c]">

      <section className="border-b border-white/8 bg-[#0e1011]">

        <div className="mx-auto max-w-[1700px] px-5 py-7 lg:px-8">

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-3">

                <span className="h-[2px] w-8 bg-amber-500" />

                <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
                  RALLYSTACK LOADOUT SYSTEM
                </span>

              </div>

              <h1 className="text-4xl font-black tracking-tight text-white">
                {builderView ===
                'backpack'
                  ? 'PACK YOUR LOADOUT.'
                  : 'BUILD YOUR OPERATOR.'}
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-stone-500">
                {builderView ===
                'backpack'
                  ? 'Choose what you carry, browse categories and track exactly what the complete loadout costs.'
                  : 'Select an operator position and RallyStack shows only equipment that belongs in that slot.'}
              </p>

            </div>

            <div className="text-right text-[9px] font-bold tracking-wider text-stone-600">

              {dataVersion.label}

              <div className="mt-1">
                {dataVersion.date}
              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="border-b border-white/8 bg-[#0b0d0e]">

        <div className="mx-auto flex max-w-[1700px] gap-8 px-5 lg:px-8">

          {[
            [
              'builder',
              'BUILDER',
            ],
            [
              'mine',
              'MY LOADOUTS',
            ],
            [
              'community',
              'COMMUNITY',
            ],
          ].map(
            ([
              id,
              label,
            ]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    id,
                  )
                }
                className={[
                  'relative h-16 text-xs font-black tracking-wider',
                  activeTab ===
                  id
                    ? 'text-white'
                    : 'text-stone-600',
                ].join(' ')}
              >
                {label}

                {activeTab ===
                  id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
                )}
              </button>
            ),
          )}

        </div>

      </section>

      {activeTab !==
      'builder' ? (

        <section className="mx-auto max-w-[1700px] px-5 py-24 text-center lg:px-8">

          <Package
            size={48}
            strokeWidth={1}
            className="mx-auto text-stone-700"
          />

          <div className="mt-5 text-2xl font-black text-white">
            {activeTab ===
            'mine'
              ? 'MY LOADOUTS'
              : 'COMMUNITY LOADOUTS'}
          </div>

        </section>

      ) : (
        <>

          <section className="mx-auto grid max-w-[1700px] gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5 lg:px-8">

            <div className="border border-white/8 bg-[#111416] p-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                EQUIPMENT VALUE
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {money(
                  equipmentValue,
                )}
              </div>

            </div>

            <div className="border border-white/8 bg-[#111416] p-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                PACK CONTENTS
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {money(
                  contentsValue,
                )}
              </div>

            </div>

            <div className="border border-amber-500/20 bg-amber-500/[0.04] p-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-amber-600">
                TOTAL LOADOUT
              </div>

              <div className="mt-2 text-xl font-black text-amber-400">
                {money(
                  totalValue,
                )}
              </div>

            </div>

            <div className="border border-white/8 bg-[#111416] p-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                KNOWN WEIGHT
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {knownWeight.toFixed(
                  2,
                )}{' '}
                KG
              </div>

            </div>

            <div className="border border-white/8 bg-[#111416] p-4">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                LOOSE AMMO
              </div>

              <div className="mt-2 text-xl font-black text-emerald-400">
                {totalRounds}
              </div>

            </div>

          </section>

          {builderView ===
          'operator' ? (

            <section className="mx-auto grid max-w-[1700px] gap-5 px-5 pb-12 xl:grid-cols-[290px_520px_minmax(0,1fr)] lg:px-8">

              <aside className="border border-white/8 bg-[#0e1011]">

                <div className="border-b border-white/8 px-5 py-4">

                  <div className="text-xs font-black tracking-[0.17em] text-white">
                    EQUIPPED
                  </div>

                </div>

                <div className="space-y-2 p-3">

                  {slots.map(
                    (slot) => {

                      const Icon =
                        slot.icon

                      const weapon =
                        equipped[
                          slot.id
                        ]

                      const bag =
                        slot.id ===
                          'backpack'
                          ? selectedBackpack
                          : null

                      const value =
                        bag?.name ||
                        weapon?.name ||
                        'EMPTY'

                      return (
                        <div
                          key={slot.id}
                          className={[
                            'border transition',
                            selectedSlot ===
                            slot.id
                              ? 'border-amber-500/50 bg-amber-500/[0.05]'
                              : 'border-white/8 bg-[#111416]',
                          ].join(' ')}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              selectSlot(
                                slot.id,
                              )
                            }
                            className="flex w-full items-center gap-3 p-3 text-left"
                          >

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/8 text-amber-500">

                              <Icon size={17} />

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="text-[8px] font-black tracking-wider text-stone-600">
                                {slot.title}
                              </div>

                              <div className="mt-1 truncate text-[10px] font-black text-white">
                                {value}
                              </div>

                            </div>

                          </button>

                          {slot.id ===
                            'backpack' && (

                            <button
                              type="button"
                              onClick={
                                openBackpack
                              }
                              className="w-full border-t border-white/8 py-2 text-[8px] font-black tracking-[0.14em] text-amber-500"
                            >
                              OPEN BACKPACK
                            </button>

                          )}

                          {weapon && (

                            <button
                              type="button"
                              onClick={() =>
                                clearWeapon(
                                  slot.id,
                                )
                              }
                              className="w-full border-t border-white/8 py-2 text-[8px] font-black tracking-wider text-red-400"
                            >
                              REMOVE
                            </button>

                          )}

                        </div>
                      )
                    },
                  )}

                </div>

              </aside>

              <section className="border border-white/8 bg-[#0d1011]">

                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

                  <div>

                    <div className="text-xs font-black tracking-[0.18em] text-white">
                      OPERATOR
                    </div>

                    <div className="mt-1 text-[9px] text-stone-600">
                      CLICK A GEAR POSITION
                    </div>

                  </div>

                  <div className="border border-amber-500/20 px-3 py-2 text-[8px] font-black tracking-wider text-amber-500">
                    {selectedSlotDefinition?.title}
                  </div>

                </div>

                <OperatorFigure
                  selectedSlot={
                    selectedSlot
                  }
                  selectSlot={
                    selectSlot
                  }
                  equipped={
                    equipped
                  }
                  backpack={
                    selectedBackpack
                  }
                  openBackpack={
                    openBackpack
                  }
                />

              </section>

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="border-b border-white/8 p-4">

                  <div className="text-[9px] font-black tracking-[0.2em] text-amber-500">
                    EQUIPMENT
                  </div>

                  <div className="mt-1 text-lg font-black text-white">
                    {selectedSlotDefinition?.title}
                  </div>

                  <div className="mt-1 text-[10px] text-stone-600">
                    {selectedSlotDefinition?.description}
                  </div>

                  <div className="mt-4 flex h-11 items-center gap-3 border border-white/8 bg-black/20 px-3">

                    <Search
                      size={15}
                      className="text-stone-600"
                    />

                    <input
                      value={query}
                      onChange={(event) =>
                        setQuery(
                          event.target.value,
                        )
                      }
                      placeholder="Search compatible equipment..."
                      className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone-700"
                    />

                    {query && (

                      <button
                        type="button"
                        onClick={() =>
                          setQuery('')
                        }
                        className="text-stone-600"
                      >
                        <X size={14} />
                      </button>

                    )}

                  </div>

                </div>

                <div className="max-h-[650px] overflow-y-auto p-4">

                  {renderOperatorCatalogue()}

                </div>

              </section>

            </section>

          ) : (

            <section className="mx-auto max-w-[1700px] px-5 pb-12 lg:px-8">

              <div className="mb-4">

                <button
                  type="button"
                  onClick={() =>
                    setBuilderView(
                      'operator',
                    )
                  }
                  className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-stone-400 hover:text-white"
                >
                  <ChevronLeft size={15} />

                  RETURN TO OPERATOR
                </button>

              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_540px]">

                <section className="border border-white/8 bg-[#0e1011]">

                  <div className="border-b border-white/8 p-4">

                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">

                      <div>

                        <div className="text-[9px] font-black tracking-[0.2em] text-amber-500">
                          BACKPACK CATALOGUE
                        </div>

                        <div className="mt-1 text-xl font-black text-white">
                          {backpackCategory}
                        </div>

                        <div className="mt-1 text-[10px] text-stone-600">
                          Add equipment directly to your carried loadout.
                        </div>

                      </div>

                      <div className="flex flex-wrap gap-1">

                        {backpackCategories.map(
                          (category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {

                                setBackpackCategory(
                                  category,
                                )

                                setAmmoCalibre(
                                  'ALL',
                                )

                                setQuery(
                                  '',
                                )
                              }}
                              className={[
                                'border px-3 py-2 text-[8px] font-black tracking-wider',
                                backpackCategory ===
                                category
                                  ? 'border-amber-500/45 bg-amber-500/[0.07] text-amber-400'
                                  : 'border-white/8 text-stone-600',
                              ].join(' ')}
                            >
                              {category}
                            </button>
                          ),
                        )}

                      </div>

                    </div>

                    <div className="mt-4 flex h-11 items-center gap-3 border border-white/8 bg-black/20 px-3">

                      <Search
                        size={15}
                        className="text-stone-600"
                      />

                      <input
                        value={query}
                        onChange={(event) =>
                          setQuery(
                            event.target.value,
                          )
                        }
                        placeholder="Search backpack items..."
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-stone-700"
                      />

                      {query && (

                        <button
                          type="button"
                          onClick={() =>
                            setQuery('')
                          }
                          className="text-stone-600"
                        >
                          <X size={14} />
                        </button>

                      )}

                    </div>

                  </div>

                  <div className="max-h-[760px] overflow-y-auto p-4">

                    {renderBackpackCategory()}

                  </div>

                </section>

                <aside className="space-y-4">

                  <section className="relative overflow-hidden border border-white/8 bg-[#0e1011]">

                    <div className="flex items-center justify-between border-b border-white/8 bg-[#151819] px-5 py-3">

                      <div>

                        <div className="text-xs font-black tracking-[0.14em] text-white">
                          BACKPACK
                        </div>

                        <div className="mt-1 text-[9px] text-stone-500">
                          {selectedBackpack.name}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-xl font-black text-amber-500">
                          {selectedBackpack.capacity}
                        </div>

                        <div className="text-[8px] text-stone-600">
                          CAPACITY
                        </div>

                      </div>

                    </div>

                    <div className="relative min-h-[570px] p-6">

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">

                        <svg
                          viewBox="0 0 300 620"
                          className="h-[540px]"
                        >
                          <path
                            d="M111 70 Q150 35 189 70 L187 113 Q173 137 150 139 Q127 137 113 113 Z"
                            fill="#ffffff"
                          />

                          <path
                            d="M87 165 Q150 135 213 165 L231 300 Q194 326 150 329 Q106 326 69 300 Z"
                            fill="#ffffff"
                          />

                          <path
                            d="M81 173 Q52 188 43 236 L30 350 L64 350 L85 245 L101 205 Z"
                            fill="#ffffff"
                          />

                          <path
                            d="M219 173 Q248 188 257 236 L270 350 L236 350 L215 245 L199 205 Z"
                            fill="#ffffff"
                          />

                          <path
                            d="M92 358 L144 358 L137 587 L82 587 L72 540 Z"
                            fill="#ffffff"
                          />

                          <path
                            d="M156 358 L208 358 L228 540 L218 587 L163 587 Z"
                            fill="#ffffff"
                          />
                        </svg>

                      </div>

                      <div className="relative z-10">

                        <div className="mx-auto mb-5 max-w-[360px] border border-amber-500/15 bg-black/35 px-4 py-3 text-center">

                          <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                            EQUIPPED PACK
                          </div>

                          <div className="mt-1 text-sm font-black text-white">
                            {selectedBackpack.name}
                          </div>

                          <div className="mt-1 text-[10px] font-black text-amber-500">
                            {money(
                              selectedBackpack.price,
                            )}
                          </div>

                        </div>

                        {selectedBackpack.exactLayoutPending ? (

                          <div className="mx-auto flex min-h-[330px] max-w-[390px] items-center justify-center border border-dashed border-white/10 bg-black/25 p-8 text-center">

                            <div>

                              <Backpack
                                size={42}
                                strokeWidth={1}
                                className="mx-auto text-stone-600"
                              />

                              <div className="mt-4 text-xl font-black text-white">
                                {selectedBackpack.capacity} CELLS
                              </div>

                              <div className="mt-2 text-xs leading-5 text-stone-600">
                                Exact compartment geometry is still being verified.
                              </div>

                            </div>

                          </div>

                        ) : (

                          <div
                            className="mx-auto grid max-w-[390px] gap-1 border border-white/10 bg-black/35 p-3"
                            style={{
                              gridTemplateColumns:
                                `repeat(${selectedBackpack.columns}, minmax(0, 1fr))`,
                            }}
                          >

                            {Array.from({
                              length:
                                selectedBackpack.columns *
                                selectedBackpack.rows,
                            }).map(
                              (
                                _,
                                index,
                              ) => {

                                const blocked =
                                  selectedBackpack.blocked.includes(
                                    index,
                                  )

                                return (
                                  <div
                                    key={index}
                                    className={[
                                      'aspect-square min-h-12 border',
                                      blocked
                                        ? 'border-transparent bg-transparent'
                                        : 'border-white/10 bg-[#121617]/90',
                                    ].join(' ')}
                                  />
                                )
                              },
                            )}

                          </div>

                        )}

                        {selectedBackpack.slings >
                          0 && (

                          <div className="mx-auto mt-4 max-w-[390px] space-y-2">

                            {Array.from({
                              length:
                                selectedBackpack.slings,
                            }).map(
                              (
                                _,
                                index,
                              ) => (
                                <div
                                  key={index}
                                  className="border border-dashed border-amber-500/30 bg-black/35 p-3"
                                >
                                  <div className="text-[8px] font-black tracking-wider text-amber-500">
                                    WEAPON SLING {index + 1}
                                  </div>
                                </div>
                              ),
                            )}

                          </div>

                        )}

                        <div className="mx-auto mt-5 max-w-[390px] border-t border-white/8 pt-4">

                          <div className="flex justify-between text-[9px]">

                            <span className="font-black tracking-wider text-stone-600">
                              PACKED STACKS
                            </span>

                            <span className="font-black text-white">
                              {totalPackedStacks}
                            </span>

                          </div>

                          <div className="mt-2 flex justify-between text-[9px]">

                            <span className="font-black tracking-wider text-stone-600">
                              LOOSE ROUNDS
                            </span>

                            <span className="font-black text-emerald-400">
                              {totalRounds}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  </section>

                  <section className="border border-white/8 bg-[#0e1011]">

                    <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">

                      <ShoppingCart
                        size={15}
                        className="text-amber-500"
                      />

                      <div className="text-xs font-black tracking-wider text-white">
                        PACK CONTENTS
                      </div>

                    </div>

                    <div className="max-h-[250px] space-y-2 overflow-y-auto p-3">

                      {ammoRows.length ===
                      0 ? (

                        <div className="p-5 text-center text-xs text-stone-700">
                          Backpack is empty.
                        </div>

                      ) : (

                        ammoRows.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="border border-white/8 bg-[#111416] p-3"
                            >

                              <div className="flex justify-between gap-4">

                                <div>

                                  <div className="text-[10px] font-black text-white">
                                    {item.name}
                                  </div>

                                  <div className="mt-1 text-[9px] text-stone-600">
                                    {item.stacks} STACK
                                    {item.stacks > 1
                                      ? 'S'
                                      : ''}
                                    {' / '}
                                    {item.rounds} ROUNDS
                                  </div>

                                </div>

                                <div className="text-xs font-black text-amber-500">
                                  {money(
                                    item.price *
                                    item.stacks,
                                  )}
                                </div>

                              </div>

                            </div>
                          ),
                        )

                      )}

                    </div>

                  </section>

                  <section className="border border-amber-500/20 bg-[#111416] p-5">

                    <div className="flex justify-between text-[10px] text-stone-500">

                      <span>
                        EQUIPMENT
                      </span>

                      <span className="font-black text-white">
                        {money(
                          equipmentValue,
                        )}
                      </span>

                    </div>

                    <div className="mt-3 flex justify-between text-[10px] text-stone-500">

                      <span>
                        BACKPACK CONTENTS
                      </span>

                      <span className="font-black text-white">
                        {money(
                          contentsValue,
                        )}
                      </span>

                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-4">

                      <div>

                        <div className="text-[8px] font-black tracking-[0.18em] text-amber-600">
                          TOTAL LOADOUT VALUE
                        </div>

                        <div className="mt-1 text-3xl font-black text-amber-400">
                          {money(
                            totalValue,
                          )}
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-[8px] font-black tracking-wider text-stone-600">
                          KNOWN WEIGHT
                        </div>

                        <div className="mt-1 text-lg font-black text-white">
                          {knownWeight.toFixed(
                            2,
                          )}{' '}
                          KG
                        </div>

                      </div>

                    </div>

                  </section>

                </aside>

              </div>

            </section>

          )}

        </>
      )}

    </main>
  )
}

export default LoadoutsPage