'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const AUTH_KEYS = ['token','utilisateur','user_auth']
const DEFAULT_MS = 2 * 60 * 60 * 1000 // 2h

export default function SessionWatcher({ durationMs = DEFAULT_MS, redirect = '/connexion' }) {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef(null)

  useEffect(() => {
    const getExp = () => Number(localStorage.getItem('auth_expires_at') || 0)
    const setExp = (ms) => localStorage.setItem('auth_expires_at', String(Date.now() + ms))
    const clearAuth = () => {
      AUTH_KEYS.forEach(k => localStorage.removeItem(k))
      localStorage.removeItem('auth_expires_at')
    }

    const check = () => {
      const exp = getExp()
      if (!exp) return
      if (Date.now() > exp) {
        clearAuth()
        router.push(redirect)
      }
    }

    timerRef.current = setInterval(check, 30_000)

    const bump = () => { if (getExp()) setExp(durationMs) }
    const evts = ['mousemove','keydown','click','touchstart']
    evts.forEach(e => window.addEventListener(e, bump))

    check()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      evts.forEach(e => window.removeEventListener(e, bump))
    }
  }, [router, redirect, durationMs, pathname])

  return null
}
