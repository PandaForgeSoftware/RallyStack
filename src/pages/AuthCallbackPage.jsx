import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const finishAuth = async () => {
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setError(exchangeError.message)
          return
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('RallyStack could not finish signing you in.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('setup_complete')
        .eq('id', user.id)
        .single()

      navigate(profile?.setup_complete ? '/profile' : '/setup', {
        replace: true,
      })
    }

    finishAuth()
  }, [navigate])

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-sm font-black text-red-400">
              AUTHENTICATION FAILED
            </div>

            <div className="mt-3 text-sm text-stone-500">
              {error}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-black tracking-[0.2em] text-amber-500">
              CONNECTING RALLYSTACK
            </div>

            <div className="mt-3 text-sm text-stone-500">
              Finishing authentication...
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default AuthCallbackPage
