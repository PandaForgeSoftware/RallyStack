import { Construction } from 'lucide-react'

function PlaceholderPage({ title, description }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1500px] items-center px-5 py-20 lg:px-8">
      <div>
        <Construction size={28} className="mb-5 text-amber-500" />

        <div className="text-[10px] font-bold tracking-[0.3em] text-amber-500">
          RALLYSTACK
        </div>

        <h1 className="mt-3 text-5xl font-black tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-stone-500">
          {description}
        </p>
      </div>
    </main>
  )
}

export default PlaceholderPage
