'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthButtons({
  loginHref = '/connexion',
  registerHref = '/inscription',
  message = 'Connectez-vous ou inscrivez-vous pour réserver',
}) {
  const router = useRouter()
  const [nextUrl, setNextUrl] = useState('/')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNextUrl(window.location.pathname + window.location.search)
    }
  }, [])

  const goLogin = () =>
    router.push(`${loginHref}?next=${encodeURIComponent(nextUrl)}`)
  const goRegister = () =>
    router.push(`${registerHref}?next=${encodeURIComponent(nextUrl)}`)

  return (
    <section className="space-y-4">
      <p className="font-medium">{message}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goLogin}
          className="rounded-full px-5 py-3 bg-[#e3107d] text-white font-semibold hover:bg-pink-700 transition"
        >
          Se connecter
        </button>

        <button
          type="button"
          onClick={goRegister}
          className="rounded-full px-5 py-3 bg-[#e3107d] text-white font-semibold hover:bg-pink-700 transition"
        >
          S’inscrire
        </button>
      </div>
    </section>
  )
}
