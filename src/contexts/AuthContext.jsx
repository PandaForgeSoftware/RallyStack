import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile load failed:', error)
      setProfile(null)
      return null
    }

    setProfile(data)
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null
    return loadProfile(user.id)
  }, [loadProfile, user?.id])

  useEffect(() => {
    let alive = true

    const hydrate = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!alive) return

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id)
      }

      if (alive) {
        setLoading(false)
      }
    }

    hydrate()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)

      setTimeout(async () => {
        await loadProfile(nextSession.user.id)

        if (alive) {
          setLoading(false)
        }
      }, 0)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
