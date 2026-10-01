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

import {
  medicalItems,
  packableItems,
} from '../data/wardogsPackableData'

import {
  ammoStackRules,
} from '../data/wardogsAmmoStackRules'
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


const magazineNameMatchers = {
  ak74: [/^AK74 /i],
  amp9: [/^AMP-9 /i],
  amr50: [/^AMR 50 /i],
  deagle: [/^Deagle /i],
  fal: [/^FAL /i],
  galil: [/^Galil /i],
  ggx17: [/^GGX /i, /^Glock 17 /i],
  ggx18: [/^GGX /i, /^Glock 17 /i],
  judge: [/^Judge /i],
  m1911: [/^M1911 /i],
  m249: [/^M249 /i],
  m4: [/^M4 /i, /^STANAG /i],
  mp5: [/^MP5 /i],
  pkm: [/^PKM /i],
  pp19: [/^PP-19 /i],
  sks: [/^SKS /i],
  super45: [/^Super-45 /i],
  sv98: [/^SV98 /i],
  svd: [/^SVD /i],
}

const magazineCatalogue =
  packableItems.filter(
    (item) =>
      item.packCategory ===
      'MAGAZINES',
  )

const getMagazineOptions =
  (weapon) => {

    if (!weapon) {
      return []
    }

    const matchers =
      magazineNameMatchers[
        weapon.id
      ] || []

    return magazineCatalogue.filter(
      (item) =>
        matchers.some(
          (matcher) =>
            matcher.test(
              item.name,
            ),
        ),
    )
  }

function WeaponWorkbench({
  weapon,
  weaponSlot,
  selectedSlot,
  selectSlot,
  magazine,
  openMagazinePicker,
  openAmmoPicker,
  clearAttachment,
  loadedAmmo,
}) {

  const magazineCapacity =
    magazine?.name
      ?.match(
        /(\d+)\s*RND/i,
      )?.[1] ||
    null

  const attachmentWeight =
    Number(
      magazine?.weight ||
      0,
    )

  const attachmentPrice =
    Number(
      magazine?.price ||
      0,
    )

  const weaponWeight =
    Number(
      weapon?.weight ||
      0,
    )

  const weaponPrice =
    Number(
      weapon?.price ||
      0,
    )

  if (!weapon) {

    return (
      <div className="flex min-h-[700px] items-center justify-center p-8 text-center">

        <div className="max-w-md">

          <Crosshair
            size={52}
            strokeWidth={1}
            className="mx-auto text-stone-700"
          />

          <div className="mt-5 text-2xl font-black text-white">
            SELECT A WEAPON
          </div>

          <p className="mt-2 text-xs leading-5 text-stone-600">
            Choose a primary, sidearm or specialist weapon to open the live stats and attachment workbench.
          </p>

        </div>

      </div>
    )
  }

  const stats = [
    [
      'DAMAGE',
      weapon.damage ??
        '—',
    ],
    [
      'RPM',
      weapon.rpm ??
        '—',
    ],
    [
      'CALIBRE',
      weapon.calibre ||
        '—',
    ],
    [
      'WEIGHT',
      `${(
        weaponWeight +
        attachmentWeight
      ).toFixed(
        2,
      )} KG`,
      attachmentWeight
        ? `BASE ${weaponWeight.toFixed(2)} KG`
        : null,
    ],
    [
      'PRICE',
      money(
        weaponPrice +
        attachmentPrice,
      ),
      attachmentPrice
        ? `BASE ${money(
            weaponPrice,
          )}`
        : null,
    ],
    [
      'MAG CAPACITY',
      magazineCapacity
        ? `${magazineCapacity} RND`
        : '—',
      magazine
        ? magazine.name
        : 'NO MAG SELECTED',
    ],
    [
      'UNLOCK LEVEL',
      weapon.unlockLevel ??
        '—',
    ],
    [
      'CATEGORY',
      weapon.category ||
        '—',
    ],
  ]

  return (
    <div className="min-h-[700px]">

      <div className="grid min-h-[700px] xl:grid-cols-[minmax(0,1fr)_230px]">

        <div className="relative flex min-h-[700px] flex-col border-r border-white/8 p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="text-[8px] font-black tracking-[0.2em] text-amber-500">
                {weaponSlot.toUpperCase()}
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                {weapon.name}
              </div>

              <div className="mt-1 text-[9px] font-bold tracking-wider text-stone-600">
                {weapon.category}
                {' / '}
                {weapon.calibre}
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                selectSlot(
                  weaponSlot,
                )
              }
              className={[
                'border px-3 py-2 text-[8px] font-black tracking-wider',
                selectedSlot ===
                weaponSlot
                  ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-400'
                  : 'border-white/10 text-stone-500',
              ].join(' ')}
            >
              CHANGE
            </button>

          </div>

          <div className="relative mt-8 flex min-h-[320px] items-center justify-center overflow-hidden border border-white/8 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_62%)]">

            <WardogsItemImage
              item={weapon}
              className="h-[280px] w-[92%] border-0 bg-transparent"
              imageClassName="p-5 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.85)]"
            />

          </div>

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between">

              <div className="text-[8px] font-black tracking-[0.18em] text-stone-600">
                ATTACHMENTS
              </div>

              <div className="text-[7px] tracking-wider text-stone-700">
                VERIFIED COMPATIBILITY ONLY
              </div>

            </div>

            <div className="grid grid-cols-4 gap-2">

              <button
                type="button"
                disabled={
                  getMagazineOptions(
                    weapon,
                  ).length ===
                  0
                }
                onClick={() =>
                  openMagazinePicker(
                    weaponSlot,
                    weapon,
                  )
                }
                className={[
                  'min-h-20 border p-3 text-left transition',
                  magazine
                    ? 'border-amber-500/45 bg-amber-500/[0.06]'
                    : 'border-white/10 bg-black/20 hover:border-amber-500/30',
                  getMagazineOptions(
                    weapon,
                  ).length ===
                  0
                    ? 'cursor-not-allowed opacity-35'
                    : '',
                ].join(' ')}
              >

                <div className="text-[7px] font-black tracking-[0.16em] text-stone-600">
                  MAGAZINE
                </div>

                <div className="mt-2 truncate text-[9px] font-black text-white">
                  {magazine?.name ||
                    'SELECT'}
                </div>

                {magazine && (

                  <div className="mt-1 text-[7px] text-amber-500">
                    {magazineCapacity
                      ? `${magazineCapacity} RND`
                      : 'EQUIPPED'}
                  </div>

                )}

              </button>

              {[
                'OPTIC',
                'MUZZLE',
                'GRIP',
              ].map(
                (label) => (

                  <div
                    key={label}
                    className="min-h-20 border border-white/6 bg-black/15 p-3"
                  >

                    <div className="text-[7px] font-black tracking-[0.16em] text-stone-700">
                      {label}
                    </div>

                    <div className="mt-2 text-[8px] font-black text-stone-800">
                      DATA SYNC PENDING
                    </div>

                  </div>

                ),
              )}

            </div>

            <button
              type="button"
              onClick={() =>
                openAmmoPicker(
                  weapon,
                )
              }
              className="mt-3 flex w-full items-center gap-3 border border-white/10 bg-black/20 p-3 text-left transition hover:border-amber-500/30"
            >

              <div className="flex h-14 w-16 shrink-0 items-center justify-center border border-white/8 bg-[#111416]">

                {loadedAmmo?.item ? (

                  <WardogsItemImage
                    item={
                      loadedAmmo.item
                    }
                    className="h-full w-full border-0 bg-transparent"
                    imageClassName="p-1 object-contain"
                  />

                ) : (

                  <Package
                    size={24}
                    strokeWidth={1}
                    className="text-stone-700"
                  />

                )}

              </div>

              <div className="min-w-0 flex-1">

                <div className="text-[7px] font-black tracking-[0.16em] text-stone-600">
                  AMMUNITION
                </div>

                <div className="mt-1 truncate text-[9px] font-black text-white">
                  {loadedAmmo?.item?.name ||
                    `SELECT ${weapon.calibre} AMMO`}
                </div>

                <div className="mt-1 text-[7px] text-stone-600">
                  {loadedAmmo
                    ? `${loadedAmmo.rounds}/${loadedAmmo.capacity} LOADED`
                    : 'MAGAZINE LOADS FIRST'}
                </div>

              </div>

              <div className="text-right text-[8px] font-black text-amber-400">
                {loadedAmmo
                  ? 'ADD MORE'
                  : 'SELECT'}
              </div>

            </button>

            {magazine && (

              <div className="mt-2 flex items-center gap-3 border border-white/8 bg-black/20 p-3">

                <WardogsItemImage
                  item={magazine}
                  className="h-14 w-16 shrink-0 border-0 bg-transparent"
                  imageClassName="p-1 object-contain"
                />

                <div className="min-w-0 flex-1">

                  <div className="truncate text-[9px] font-black text-white">
                    {magazine.name}
                  </div>

                  <div className="mt-1 text-[8px] text-stone-600">
                    {magazine.weight == null
                      ? 'WEIGHT ?'
                      : `${Number(
                          magazine.weight,
                        ).toFixed(
                          2,
                        )} KG`}
                    {' / '}
                    {magazine.price == null
                      ? 'PRICE ?'
                      : money(
                          magazine.price,
                        )}
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    clearAttachment(
                      weaponSlot,
                    )
                  }
                  className="text-[8px] font-black text-red-400"
                >
                  REMOVE
                </button>

              </div>

            )}

          </div>

        </div>

        <aside className="bg-black/15 p-4">

          <div className="text-[8px] font-black tracking-[0.2em] text-amber-500">
            LIVE STATS
          </div>

          <div className="mt-4 space-y-2">

            {stats.map(
              ([
                label,
                value,
                note,
              ]) => (

                <div
                  key={label}
                  className="border border-white/8 bg-[#111416] p-3"
                >

                  <div className="text-[7px] font-black tracking-[0.15em] text-stone-600">
                    {label}
                  </div>

                  <div className="mt-1 text-sm font-black text-white">
                    {value}
                  </div>

                  {note && (

                    <div className="mt-1 truncate text-[7px] text-stone-700">
                      {note}
                    </div>

                  )}

                </div>

              ),
            )}

          </div>

          <div className="mt-4 border border-amber-500/15 bg-amber-500/[0.03] p-3">

            <div className="text-[7px] font-black tracking-[0.16em] text-amber-600">
              ATTACHMENT DELTA
            </div>

            <div className="mt-2 flex justify-between text-[8px] text-stone-500">
              <span>
                WEIGHT
              </span>
              <span className="font-black text-white">
                +{attachmentWeight.toFixed(
                  2,
                )} KG
              </span>
            </div>

            <div className="mt-2 flex justify-between text-[8px] text-stone-500">
              <span>
                COST
              </span>
              <span className="font-black text-amber-400">
                +{money(
                  attachmentPrice,
                )}
              </span>
            </div>

          </div>

        </aside>

      </div>

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
    useState('')

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
    useState(null)

  const [
    packedAmmo,
    setPackedAmmo,
  ] =
    useState({})

  

  const [
    packedGear,
    setPackedGear,
  ] =
    useState({})

const [
    selectedItem,
    setSelectedItem,
  ] =
    useState(null)


  const [
    attachmentPicker,
    setAttachmentPicker,
  ] =
    useState(null)


  const [
    weaponPicker,
    setWeaponPicker,
  ] =
    useState(null)

  const [
    ammoPicker,
    setAmmoPicker,
  ] =
    useState(null)

  const [
    builderNotice,
    setBuilderNotice,
  ] =
    useState(null)

  const [
    weaponAttachments,
    setWeaponAttachments,
  ] =
    useState({})


  const [
    weaponAmmo,
    setWeaponAmmo,
  ] =
    useState({})

  const selectedBackpack =
    backpacks.find(
      (item) =>
        item.id ===
        selectedBackpackId,
    ) ||
    null

  const selectedSlotDefinition =
    slots.find(
      (item) =>
        item.id ===
        selectedSlot,
    )


  const workbenchSlot =
    weaponSlots.has(
      selectedSlot,
    )
      ? selectedSlot
      : equipped.primary
        ? 'primary'
        : equipped.sidearm
          ? 'sidearm'
          : equipped.specialist
            ? 'specialist'
            : 'primary'

  const workbenchWeapon =
    equipped[
      workbenchSlot
    ]

  const workbenchMagazine =
    weaponAttachments[
      workbenchSlot
    ]?.magazine ||
    null


  const workbenchLoadedAmmo =
    weaponAmmo[
      workbenchSlot
    ] ||
    null

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


  const equippedAttachmentItems =
    useMemo(
      () =>
        Object.values(
          weaponAttachments,
        )
          .flatMap(
            (group) =>
              Object.values(
                group || {},
              ),
          )
          .filter(Boolean),
      [
        weaponAttachments,
      ],
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
              roundCount,
            ]) => {

              const item =
                looseAmmo.find(
                  (candidate) =>
                    candidate.id ===
                    id,
                )

              if (!item) {
                return null
              }

              const rule =
                ammoStackRules[
                  id
                ] || {
                  purchaseQuantity: 1,
                  maxStack:
                    Math.max(
                      1,
                      Number(
                        item.stack ||
                        1,
                      ),
                    ),
                }

              const rounds =
                Math.max(
                  0,
                  Number(
                    roundCount ||
                    0,
                  ),
                )

              const purchaseQuantity =
                Math.max(
                  1,
                  Number(
                    rule.purchaseQuantity ||
                    1,
                  ),
                )

              const maxStack =
                Math.max(
                  purchaseQuantity,
                  Number(
                    rule.maxStack ||
                    purchaseQuantity,
                  ),
                )

              return {
                ...item,

                rounds,

                purchaseQuantity,

                maxStack,

                purchases:
                  Math.ceil(
                    rounds /
                    purchaseQuantity,
                  ),

                physicalStacks:
                  Math.ceil(
                    rounds /
                    maxStack,
                  ),
              }
            },
          )
          .filter(Boolean),
      [
        packedAmmo,
      ],
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
            selectedBackpack?.price ||
              0,
          ),
        ) +
        equippedAttachmentItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.price ||
                0,
            ),
          0,
        ),
      [
        equippedWeapons,
        equippedAttachmentItems,
        selectedBackpack,
      ],
    )

  const medicalRows =
    useMemo(
      () =>
        Object.entries(
          packedGear,
        )
          .map(
            ([
              id,
              quantity,
            ]) => {

              const item =
                medicalItems.find(
                  (candidate) =>
                    candidate.id ===
                    id,
                )

              if (!item) {
                return null
              }

              return {
                item,
                quantity:
                  Number(
                    quantity ||
                    0,
                  ),
              }
            },
          )
          .filter(Boolean),
      [
        packedGear,
      ],
    )

  const contentsValue =
    useMemo(
      () => {

        const ammoValue =
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
                Number(
                  item.purchases ||
                  0,
                )
              ),
            0,
          )

        const gearValue =
          medicalRows.reduce(
            (
              total,
              row,
            ) =>
              total +
              (
                Number(
                  row.item.price ||
                  0,
                ) *
                row.quantity
              ),
            0,
          )

        return (
          ammoValue +
          gearValue
        )
      },
      [
        ammoRows,
        medicalRows,
      ],
    )

  const totalValue =
    equipmentValue +
    contentsValue

  const knownWeight =
    useMemo(
      () => {

        const baseWeight =
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
              selectedBackpack?.weight ||
                0,
            ),
          ) +
          equippedAttachmentItems.reduce(
            (
              total,
              item,
            ) =>
              total +
              Number(
                item.weight ||
                  0,
              ),
            0,
          )

        return medicalRows.reduce(
          (
            total,
            row,
          ) =>
            total +
            (
              Number(
                row.item.weight ||
                  0,
              ) *
              row.quantity
            ),
          baseWeight,
        )
      },
      [
        equippedWeapons,
        equippedAttachmentItems,
        selectedBackpack,
        medicalRows,
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
        Number(
          item.physicalStacks ||
          item.stacks ||
          0,
        ),
      0,
    ) +
    medicalRows.reduce(
      (
        total,
        row,
      ) =>
        total +
        Math.ceil(
          row.quantity /
          Math.max(
            1,
            Number(
              row.item.maxStack ||
              1,
            ),
          ),
        ),
      0,
    )


  const usedPackCells =
    ammoRows.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.physicalStacks ||
          0,
        ),
      0,
    ) +
    medicalRows.reduce(
      (
        total,
        row,
      ) => {

        const physicalStacks =
          Math.ceil(
            row.quantity /
            Math.max(
              1,
              Number(
                row.item.maxStack ||
                1,
              ),
            ),
          )

        return (
          total +
          (
            physicalStacks *
            Number(
              row.item.inventoryWidth ||
              1,
            ) *
            Number(
              row.item.inventoryHeight ||
              1,
            )
          )
        )
      },
      0,
    )

  const freePackCells =
    selectedBackpack
      ? Math.max(
          0,
          Number(
            selectedBackpack.capacity ||
            0,
          ) -
          usedPackCells,
        )
      : 0

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

      if (
        weaponSlots.has(
          slot,
        )
      ) {

        setWeaponPicker({
          slot,
        })
      }
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

      setWeaponAttachments(
        (current) => ({
          ...current,
          [selectedSlot]:
            {},
        }),
      )

      setWeaponAmmo(
        (current) => ({
          ...current,
          [selectedSlot]:
            null,
        }),
      )

      setSelectedItem(
        item,
      )

      setWeaponPicker(
        null,
      )
    }

  const openMagazinePicker =
    (
      weaponSlot,
      weapon,
    ) => {

      const options =
        getMagazineOptions(
          weapon,
        )

      if (
        options.length ===
        0
      ) {
        return
      }

      setAttachmentPicker({
        weaponSlot,
        weapon,
        options,
      })
    }

  const equipAttachment =
    (item) => {

      if (!attachmentPicker) {
        return
      }

      setWeaponAttachments(
        (current) => ({
          ...current,
          [attachmentPicker.weaponSlot]: {
            ...(current[
              attachmentPicker.weaponSlot
            ] || {}),
            magazine:
              item,
          },
        }),
      )

      setWeaponAmmo(
        (current) => ({
          ...current,
          [attachmentPicker.weaponSlot]:
            null,
        }),
      )

      setAttachmentPicker(
        null,
      )
    }

  const clearAttachment =
    (weaponSlot) => {

      setWeaponAttachments(
        (current) => ({
          ...current,
          [weaponSlot]: {
            ...(current[
              weaponSlot
            ] || {}),
            magazine:
              null,
          },
        }),
      )
    }

  const openAmmoPicker =
    (weapon) => {

      if (!weapon) {
        return
      }

      const options =
        looseAmmo.filter(
          (item) =>
            item.calibre ===
              weapon.calibre &&
            !item.tracer,
        )

      setAmmoPicker({
        weapon,
        weaponSlot:
          workbenchSlot,
        options,
      })
    }

  const addAmmoFromPicker =
    (item) => {

      if (!ammoPicker) {
        return
      }

      const weaponSlot =
        ammoPicker.weaponSlot

      const magazine =
        weaponAttachments[
          weaponSlot
        ]?.magazine ||
        null

      const capacity =
        Number(
          magazine?.name
            ?.match(
              /(\d+)\s*RND/i,
            )?.[1] ||
          0,
        )

      if (
        capacity <=
        0
      ) {

        setBuilderNotice(
          'Select a magazine first so RallyStack knows how many rounds the weapon can hold.'
        )

        setAmmoPicker(
          null,
        )

        return
      }

      const rule =
        ammoStackRules[
          item.id
        ] || {}

      const purchaseQuantity =
        Math.max(
          1,
          Number(
            rule.purchaseQuantity ||
            item.stack ||
            1,
          ),
        )

      const currentLoaded =
        weaponAmmo[
          weaponSlot
        ]

      const currentlyLoadedRounds =
        currentLoaded?.item?.id ===
          item.id
          ? Number(
              currentLoaded.rounds ||
              0,
            )
          : 0

      const magazineSpace =
        Math.max(
          0,
          capacity -
          currentlyLoadedRounds,
        )

      const roundsToMagazine =
        Math.min(
          magazineSpace,
          purchaseQuantity,
        )

      const roundsToPack =
        purchaseQuantity -
        roundsToMagazine

      if (
        roundsToPack >
        0 &&
        !selectedBackpack
      ) {

        setBuilderNotice(
          `The ${capacity}-round magazine will fill first, but ${roundsToPack} rounds would be left over. Equip a backpack for the spare ammunition.`
        )

        setAmmoPicker(
          null,
        )

        return
      }

      if (
        roundsToPack >
        0
      ) {

        const existingPackRounds =
          Number(
            packedAmmo[
              item.id
            ] ||
            0,
          )

        const maxStack =
          Math.max(
            1,
            Number(
              rule.maxStack ||
              item.stack ||
              1,
            ),
          )

        const beforeStacks =
          Math.ceil(
            existingPackRounds /
            maxStack,
          )

        const afterStacks =
          Math.ceil(
            (
              existingPackRounds +
              roundsToPack
            ) /
            maxStack,
          )

        const extraCells =
          Math.max(
            0,
            afterStacks -
            beforeStacks,
          )

        if (
          extraCells >
          freePackCells
        ) {

          setBuilderNotice(
            `Your ${selectedBackpack.name} does not have enough free space for the ${roundsToPack} spare rounds. Free a backpack cell or choose a larger pack.`
          )

          setAmmoPicker(
            null,
          )

          return
        }
      }

      setWeaponAmmo(
        (current) => ({
          ...current,
          [weaponSlot]: {
            item,
            rounds:
              currentlyLoadedRounds +
              roundsToMagazine,
            capacity,
          },
        }),
      )

      if (
        roundsToPack >
        0
      ) {

        changeAmmoRounds(
          item.id,
          roundsToPack,
        )
      }

      setAmmoPicker(
        null,
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

      setWeaponAmmo(
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

      if (
        !selectedBackpack
      ) {

        selectSlot(
          'backpack',
        )

        return
      }

      setBuilderView(
        'backpack',
      )

      setBackpackCategory(
        '',
      )

      setAmmoCalibre(
        'ALL',
      )

      setQuery(
        '',
      )
    }

  const changeAmmoRounds =
    (
      id,
      differenceRounds,
    ) => {

      setPackedAmmo(
        (current) => {

          const next =
            Math.max(
              0,
              Number(
                current[
                  id
                ] ||
                0,
              ) +
              Number(
                differenceRounds ||
                0,
              ),
            )

          const updated = {
            ...current,
          }

          if (
            next === 0
          ) {

            delete updated[
              id
            ]
          }
          else {

            updated[
              id
            ] =
              next
          }

          return updated
        },
      )
    }

  const changePackedGear =
    (
      id,
      difference,
    ) => {

      setPackedGear(
        (current) => {

          const next =
            Math.max(
              0,
              Number(
                current[
                  id
                ] ||
                0,
              ) +
              Number(
                difference ||
                0,
              ),
            )

          const updated = {
            ...current,
          }

          if (
            next === 0
          ) {

            delete updated[
              id
            ]
          }
          else {

            updated[
              id
            ] =
              next
          }

          return updated
        },
      )
    }

  if (
    activeTab === 'builder' &&
    builderView === 'backpack' &&
    selectedBackpack
  ) {
    return (
      <BackpackPackingView
        backpack={selectedBackpack}
        looseAmmo={looseAmmo}
        medicalItems={medicalItems}
        packedAmmo={packedAmmo}
        packedGear={packedGear}
        equippedCalibres={equippedCalibres}
        changeAmmoRounds={changeAmmoRounds}
        changePackedGear={changePackedGear}
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

        const currentWeapon =
          equipped[
            selectedSlot
          ]

        return (
          <div className="flex min-h-[360px] items-center justify-center p-5 text-center">

            <div className="w-full max-w-sm">

              {currentWeapon ? (

                <WardogsItemImage
                  item={
                    currentWeapon
                  }
                  className="mx-auto h-32 w-full border border-white/8 bg-black/20"
                  imageClassName="p-3 object-contain"
                />

              ) : (

                <Crosshair
                  size={44}
                  strokeWidth={1}
                  className="mx-auto text-stone-700"
                />

              )}

              <div className="mt-4 text-lg font-black text-white">
                {currentWeapon?.name ||
                  'NO WEAPON EQUIPPED'}
              </div>

              <div className="mt-2 text-[9px] text-stone-600">
                Weapon selection now opens in a dedicated popout.
              </div>

              <button
                type="button"
                onClick={() =>
                  setWeaponPicker({
                    slot:
                      selectedSlot,
                  })
                }
                className="mt-5 w-full bg-amber-500 px-4 py-3 text-[9px] font-black tracking-wider text-black"
              >
                {currentWeapon
                  ? 'CHANGE WEAPON'
                  : 'SELECT WEAPON'}
              </button>

            </div>

          </div>
        )
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

            <section className="mx-auto grid max-w-[1700px] gap-5 px-5 pb-12 xl:grid-cols-[320px_620px_minmax(380px,1fr)] lg:px-8">

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

                            <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden border border-white/8 bg-black/20 text-amber-500">

                              {weapon ||
                              bag ? (
                                <WardogsItemImage
                                  item={
                                    weapon ||
                                    bag
                                  }
                                  className="h-full w-full border-0 bg-transparent"
                                  imageClassName="p-1 object-contain"
                                />
                              ) : (
                                <Icon
                                  size={17}
                                />
                              )}

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
                            <>
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
                            </>
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
                      WEAPON WORKBENCH
                    </div>

                    <div className="mt-1 text-[9px] text-stone-600">
                      LIVE WEAPON STATS + VERIFIED ATTACHMENTS
                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <div className="border border-white/8 bg-black/20 px-3 py-2 text-right">
                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        TOTAL
                      </div>
                      <div className="mt-1 text-[11px] font-black text-amber-400">
                        {money(
                          totalValue,
                        )}
                      </div>
                    </div>

                    <div className="border border-white/8 bg-black/20 px-3 py-2 text-right">
                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        WEIGHT
                      </div>
                      <div className="mt-1 text-[11px] font-black text-white">
                        {knownWeight.toFixed(
                          2,
                        )}{' '}
                        KG
                      </div>
                    </div>

                    <div className="border border-amber-500/20 px-3 py-2 text-[8px] font-black tracking-wider text-amber-500">
                      {selectedSlotDefinition?.title}
                    </div>

                  </div>

                </div>

                <WeaponWorkbench
                  weapon={
                    workbenchWeapon
                  }
                  weaponSlot={
                    workbenchSlot
                  }
                  selectedSlot={
                    selectedSlot
                  }
                  selectSlot={
                    selectSlot
                  }
                  magazine={
                    workbenchMagazine
                  }
                  openMagazinePicker={
                    openMagazinePicker
                  }
                  openAmmoPicker={
                    openAmmoPicker
                  }
                  clearAttachment={
                    clearAttachment
                  }
                  loadedAmmo={
                    workbenchLoadedAmmo
                  }
                />

              </section>

              <section className="border border-white/8 bg-[#0e1011]">

                <div className="border-b border-white/8 bg-[#0b0d0e] p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="text-[9px] font-black tracking-[0.2em] text-amber-500">
                        CARRY
                      </div>

                      <div className="mt-1 text-lg font-black text-white">
                        FIELD LOADOUT
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={
                        openBackpack
                      }
                      className="border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[8px] font-black tracking-[0.12em] text-amber-400 hover:bg-amber-500/[0.12]"
                    >
                      {selectedBackpack
                        ? 'OPEN PACK'
                        : 'SELECT PACK'}
                    </button>

                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        selectSlot(
                          'backpack',
                        )
                      }
                      className={[
                        'group border bg-[#131617] p-2 text-left transition',
                        selectedBackpack
                          ? 'border-white/10 hover:border-amber-500/30'
                          : 'border-amber-500/25 hover:border-amber-500/50',
                      ].join(' ')}
                    >

                      {selectedBackpack ? (

                        <WardogsItemImage
                          item={
                            selectedBackpack
                          }
                          className="h-20 w-full border-0 bg-transparent"
                          imageClassName="p-1 object-contain"
                        />

                      ) : (

                        <div className="flex h-20 items-center justify-center border border-dashed border-amber-500/20 text-amber-500/60">
                          <Backpack
                            size={30}
                            strokeWidth={1.2}
                          />
                        </div>

                      )}

                      <div className="mt-2 truncate text-[8px] font-black text-white">
                        BACKPACK
                      </div>

                      <div className={[
                        'mt-1 truncate text-[7px]',
                        selectedBackpack
                          ? 'text-stone-600'
                          : 'text-amber-500',
                      ].join(' ')}
                      >
                        {selectedBackpack?.name ||
                          'SELECT A PACK'}
                      </div>

                    </button>

                    <div className="border border-white/10 bg-[#131617] p-2">

                      <div className="flex h-20 items-center justify-center border border-dashed border-white/8 text-stone-700">
                        <span className="text-3xl font-thin">
                          ↟
                        </span>
                      </div>

                      <div className="mt-2 text-[8px] font-black text-white">
                        TRAVERSAL
                      </div>

                      <div className="mt-1 text-[7px] text-stone-700">
                        COMING NEXT
                      </div>

                    </div>

                    <div className="border border-white/10 bg-[#131617] p-2">

                      <div className="flex h-20 items-center justify-center border border-dashed border-white/8 text-stone-700">
                        <span className="text-2xl">
                          ◫
                        </span>
                      </div>

                      <div className="mt-2 text-[8px] font-black text-white">
                        TRANSPORT
                      </div>

                      <div className="mt-1 text-[7px] text-stone-700">
                        COMING NEXT
                      </div>

                    </div>

                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">

                    <div className="border border-white/8 bg-black/25 p-3">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        PACKED
                      </div>

                      <div className="mt-1 text-sm font-black text-white">
                        {
                          totalPackedStacks
                        }
                      </div>

                    </div>

                    <div className="border border-white/8 bg-black/25 p-3">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        ROUNDS
                      </div>

                      <div className="mt-1 text-sm font-black text-emerald-400">
                        {
                          totalRounds
                        }
                      </div>

                    </div>

                    <div className="border border-white/8 bg-black/25 p-3">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        PACK
                      </div>

                      <div className="mt-1 text-sm font-black text-amber-400">
                        {selectedBackpack
                          ? money(
                              selectedBackpack.price,
                            )
                          : '—'}
                      </div>

                    </div>

                  </div>

                </div>

                <div className="border-b border-white/8 bg-[#0f1213] p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="text-[9px] font-black tracking-[0.2em] text-amber-500">
                        OVERALL LOADOUT
                      </div>

                      <div className="mt-1 text-[9px] text-stone-600">
                        Combined build stats
                      </div>

                    </div>

                    <div className="text-right">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        TOTAL VALUE
                      </div>

                      <div className="mt-1 text-lg font-black text-amber-400">
                        {money(
                          totalValue,
                        )}
                      </div>

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    {[
                      [
                        'WEIGHT',
                        `${knownWeight.toFixed(
                          2,
                        )} KG`,
                      ],
                      [
                        'WEAPONS',
                        equippedWeapons.length,
                      ],
                      [
                        'ATTACHMENTS',
                        equippedAttachmentItems.length,
                      ],
                      [
                        'ROUNDS',
                        totalRounds,
                      ],
                      [
                        'PACKED',
                        totalPackedStacks,
                      ],
                      [
                        'BAG',
                        selectedBackpack
                          ? `${selectedBackpack.capacity} CELLS`
                          : 'NONE',
                      ],
                    ].map(
                      ([
                        label,
                        value,
                      ]) => (

                        <div
                          key={label}
                          className="border border-white/8 bg-black/25 p-3"
                        >

                          <div className="text-[7px] font-black tracking-wider text-stone-600">
                            {label}
                          </div>

                          <div className="mt-1 truncate text-[11px] font-black text-white">
                            {value}
                          </div>

                        </div>

                      ),
                    )}

                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">

                    <div className="border border-white/8 bg-black/20 p-3">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        PRIMARY FIREPOWER
                      </div>

                      <div className="mt-2 flex items-end justify-between gap-3">

                        <div>
                          <div className="text-[8px] text-stone-600">
                            DAMAGE
                          </div>
                          <div className="text-sm font-black text-white">
                            {equipped.primary?.damage ??
                              '—'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[8px] text-stone-600">
                            RPM
                          </div>
                          <div className="text-sm font-black text-white">
                            {equipped.primary?.rpm ??
                              '—'}
                          </div>
                        </div>

                      </div>

                    </div>

                    <div className="border border-white/8 bg-black/20 p-3">

                      <div className="text-[7px] font-black tracking-wider text-stone-600">
                        SIDEARM FIREPOWER
                      </div>

                      <div className="mt-2 flex items-end justify-between gap-3">

                        <div>
                          <div className="text-[8px] text-stone-600">
                            DAMAGE
                          </div>
                          <div className="text-sm font-black text-white">
                            {equipped.sidearm?.damage ??
                              '—'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[8px] text-stone-600">
                            RPM
                          </div>
                          <div className="text-sm font-black text-white">
                            {equipped.sidearm?.rpm ??
                              '—'}
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

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

                  {!weaponSlots.has(
                    selectedSlot,
                  ) && (

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

                  )}

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

      {builderNotice && (

        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">

          <div className="w-full max-w-md border border-amber-500/30 bg-[#0d0f10] p-6 text-center">

            <Backpack
              size={38}
              strokeWidth={1.2}
              className="mx-auto text-amber-500"
            />

            <div className="mt-4 text-xl font-black text-white">
              LOADOUT CHECK
            </div>

            <p className="mt-2 text-xs leading-5 text-stone-500">
              {builderNotice}
            </p>

            {builderNotice?.includes(
              'magazine'
            ) ? (

              <button
                type="button"
                onClick={() =>
                  setBuilderNotice(
                    null,
                  )
                }
                className="mt-5 bg-amber-500 px-5 py-3 text-[9px] font-black tracking-wider text-black"
              >
                CLOSE
              </button>

            ) : (

              <button
                type="button"
                onClick={() => {

                  setBuilderNotice(
                    null,
                  )

                  selectSlot(
                    'backpack',
                  )
                }}
                className="mt-5 bg-amber-500 px-5 py-3 text-[9px] font-black tracking-wider text-black"
              >
                SELECT BACKPACK
              </button>

            )}



          </div>

        </div>

      )}

      {weaponPicker && (

        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setWeaponPicker(
                null,
              )
            }
          }}
        >

          <div className="flex max-h-[88vh] w-full max-w-6xl flex-col border border-white/12 bg-[#0d0f10] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

              <div>

                <div className="text-[8px] font-black tracking-[0.18em] text-amber-500">
                  {slots.find(
                    (item) =>
                      item.id ===
                      weaponPicker.slot,
                  )?.title}
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  SELECT WEAPON
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setWeaponPicker(
                    null,
                  )
                }
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-stone-500 hover:text-white"
              >
                <X size={16} />
              </button>

            </div>

            <div className="overflow-y-auto p-4">

              {renderWeaponCatalogue()}

            </div>

          </div>

        </div>

      )}

      {ammoPicker && (

        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setAmmoPicker(
                null,
              )
            }
          }}
        >

          <div className="w-full max-w-4xl border border-white/12 bg-[#0d0f10] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

              <div>

                <div className="text-[8px] font-black tracking-[0.18em] text-amber-500">
                  {ammoPicker.weapon.name}
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  {ammoPicker.weapon.calibre} AMMUNITION
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setAmmoPicker(
                    null,
                  )
                }
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-stone-500 hover:text-white"
              >
                <X size={16} />
              </button>

            </div>

            <div className="grid max-h-[600px] gap-2 overflow-y-auto p-4 md:grid-cols-2">

              {ammoPicker.options.map(
                (item) => {

                  const rule =
                    ammoStackRules[
                      item.id
                    ] || {}

                  const quantity =
                    Math.max(
                      1,
                      Number(
                        rule.purchaseQuantity ||
                        item.stack ||
                        1,
                      ),
                    )

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        addAmmoFromPicker(
                          item,
                        )
                      }
                      className="flex items-center gap-3 border border-white/8 bg-[#121516] p-3 text-left transition hover:border-amber-500/35"
                    >

                      <WardogsItemImage
                        item={item}
                        className="h-16 w-20 shrink-0 border border-white/8 bg-black/20"
                        imageClassName="p-1 object-contain"
                      />

                      <div className="min-w-0 flex-1">

                        <div className="text-[10px] font-black text-white">
                          {item.name}
                        </div>

                        <div className="mt-1 text-[8px] text-stone-600">
                          DAMAGE {item.damage ?? '—'}
                          {' / '}
                          SPEED {item.speed ?? '—'}
                          {' / '}
                          PEN {item.penetration ?? '—'}
                        </div>

                        <div className="mt-1 text-[7px] text-stone-700">
                          MAGAZINE FILLS FIRST • SPARE ROUNDS GO TO BACKPACK
                        </div>

                      </div>

                      <div className="text-right">

                        <div className="text-[10px] font-black text-amber-400">
                          {money(
                            item.price,
                          )}
                        </div>

                        <div className="mt-1 text-[7px] text-stone-600">
                          +{quantity} ROUNDS
                        </div>

                      </div>

                    </button>
                  )
                },
              )}

            </div>

          </div>

        </div>

      )}

      {attachmentPicker && (

        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setAttachmentPicker(
                null,
              )
            }
          }}
        >

          <div className="w-full max-w-3xl border border-white/12 bg-[#0d0f10] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">

              <div>

                <div className="text-[8px] font-black tracking-[0.18em] text-amber-500">
                  {attachmentPicker.weapon.name}
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  MAGAZINE
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setAttachmentPicker(
                    null,
                  )
                }
                className="flex h-10 w-10 items-center justify-center border border-white/10 text-stone-500 hover:text-white"
              >
                <X size={16} />
              </button>

            </div>

            <div className="grid max-h-[520px] gap-2 overflow-y-auto p-4 md:grid-cols-2">

              {attachmentPicker.options.map(
                (item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      equipAttachment(
                        item,
                      )
                    }
                    className="flex items-center gap-3 border border-white/8 bg-[#121516] p-3 text-left transition hover:border-amber-500/35"
                  >

                    <WardogsItemImage
                      item={item}
                      className="h-16 w-20 shrink-0 border border-white/8 bg-black/20"
                      imageClassName="p-1 object-contain"
                    />

                    <div className="min-w-0 flex-1">

                      <div className="truncate text-[10px] font-black text-white">
                        {item.name}
                      </div>

                      <div className="mt-1 text-[8px] text-stone-600">
                        {item.inventoryWidth}
                        x
                        {item.inventoryHeight}
                        {' / '}
                        {item.weight == null
                          ? 'WEIGHT ?'
                          : `${Number(
                              item.weight,
                            ).toFixed(
                              2,
                            )} KG`}
                      </div>

                    </div>

                    <div className="text-right text-[10px] font-black text-amber-400">
                      {item.price == null
                        ? 'PRICE ?'
                        : money(
                            item.price,
                          )}
                    </div>

                  </button>

                ),
              )}

            </div>

            <div className="border-t border-white/8 px-5 py-3 text-[8px] text-stone-600">
              Showing verified magazine options currently available in the RallyStack catalogue.
            </div>

          </div>

        </div>

      )}

    </main>
  )
}

export default LoadoutsPage