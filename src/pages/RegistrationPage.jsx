import { useState } from 'react'
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function RegistrationPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!form.email.trim()) {
      setError('Enter your email address.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    })

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session) {
      navigate('/setup')
      return
    }

    setMessage(
      'Account created. Check your email and confirm your address, then RallyStack will continue your setup.',
    )
  }

  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(245,158,11,0.10),transparent_35%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1400px] items-center gap-16 px-5 py-12 lg:grid-cols-[1fr_520px] lg:px-8">
        <div className="hidden lg:block">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-500" />

            <span className="text-[10px] font-black tracking-[0.3em] text-amber-500">
              JOIN RALLYSTACK
            </span>
          </div>

          <h1 className="max-w-2xl text-6xl font-black leading-[0.95] tracking-[-0.04em] text-white">
            BUILD YOUR KIT.
            <br />
            FIND YOUR <span className="text-amber-500">PEOPLE.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-stone-500">
            One account for your loadouts, LFG profile, squads, Discord
            connection and WARDOGS community.
          </p>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
            {[
              'Build & share loadouts',
              'Find players by role',
              'Join permanent squads',
              'Connect Discord & Steam',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 border border-white/8 bg-white/[0.02] px-4 py-3 text-xs font-bold text-stone-400"
              >
                <ShieldCheck size={16} className="text-amber-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <section className="border border-white/10 bg-[#0e1011]/95">
          <div className="border-b border-white/8 p-6">
            <div className="text-[10px] font-black tracking-[0.3em] text-amber-500">
              CREATE ACCOUNT
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              Join RallyStack
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Your account is now handled by the real RallyStack backend.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 p-6">
            {error && (
              <div className="border border-red-500/25 bg-red-500/[0.05] px-4 py-3 text-xs font-semibold text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="border border-emerald-500/25 bg-emerald-500/[0.05] px-4 py-3 text-xs leading-5 text-emerald-400">
                {message}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                EMAIL ADDRESS
              </span>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
                />

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField('email', event.target.value)
                  }
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
                  value={form.password}
                  onChange={(event) =>
                    updateField('password', event.target.value)
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] pl-11 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black tracking-wider text-stone-500">
                CONFIRM PASSWORD
              </span>

              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600"
                />

                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField('confirmPassword', event.target.value)
                  }
                  className="h-12 w-full border border-white/10 bg-[#0b0d0e] pl-11 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 bg-amber-500 text-xs font-black tracking-wider text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {submitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              {!submitting && <ArrowRight size={16} />}
            </button>

            <div className="text-center text-xs text-stone-600">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-bold text-stone-300 hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default RegistrationPage
