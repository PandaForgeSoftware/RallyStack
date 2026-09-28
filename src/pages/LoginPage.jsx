import { useState } from 'react'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()

    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }

    const existingAccount = localStorage.getItem('rallystack-preview-account')

    if (!existingAccount) {
      setError('No preview account exists yet. Register first.')
      return
    }

    const profile = localStorage.getItem('rallystack-profile')

    navigate(profile ? '/profile' : '/setup')
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1400px] items-center justify-center px-5 py-12 lg:px-8">
      <section className="w-full max-w-lg border border-white/10 bg-[#0e1011]">
        <div className="border-b border-white/8 p-6">
          <div className="text-[10px] font-black tracking-[0.3em] text-amber-500">
            RALLYSTACK
          </div>

          <h1 className="mt-3 text-3xl font-black text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Sign in to your RallyStack account.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {error && (
            <div className="border border-red-500/25 bg-red-500/[0.05] px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
              EMAIL
            </span>

            <div className="relative">
              <Mail
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
              />

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full border border-white/10 bg-[#0b0d0e] pl-11 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
              PASSWORD
            </span>

            <div className="relative">
              <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
              />

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full border border-white/10 bg-[#0b0d0e] pl-11 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </label>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 bg-amber-500 text-xs font-black tracking-wider text-black"
          >
            SIGN IN
            <ArrowRight size={16} />
          </button>

          <div className="text-center text-xs text-stone-600">
            No account?{' '}
            <Link
              to="/register"
              className="font-bold text-stone-300 hover:text-white"
            >
              Register
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
