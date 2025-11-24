'use client'

import { useEffect, useState } from 'react'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '')

export default function BoutonAvecConnexion({ proprietaireId, jardinierId }) {
  const [isConnected, setIsConnected] = useState(false)
  const [nextUrl, setNextUrl] = useState('/')
  const toId = proprietaireId ?? jardinierId ?? null

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Vérif serveur (cookie session)
        const r = await fetch(`${API_BASE}/api/connexion/me`, { credentials: 'include' })
        if (r.ok) {
          const j = await r.json()
          setIsConnected(!!j?.loggedIn)
        } else {
          // 2) Fallback: localStorage + cookie
          const token = localStorage.getItem('token')
          const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
          const u = raw ? JSON.parse(raw) : null
          const hasCookie =
            typeof document !== 'undefined' &&
            /(?:^|;\s*)(jwt|token|auth|session|user_id)=/.test(document.cookie)
          const hasUserId = !!(u && (u.id_utilisateur || u.id))
          setIsConnected(Boolean(token || hasCookie || hasUserId))
        }
      } catch {
        // Fallback en cas d'erreur réseau
        try {
          const token = localStorage.getItem('token')
          const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
          const u = raw ? JSON.parse(raw) : null
          const hasCookie =
            typeof document !== 'undefined' &&
            /(?:^|;\s*)(jwt|token|auth|session|user_id)=/.test(document.cookie)
          const hasUserId = !!(u && (u.id_utilisateur || u.id))
          setIsConnected(Boolean(token || hasCookie || hasUserId))
        } catch {
          setIsConnected(false)
        }
      } finally {
        if (typeof window !== 'undefined') {
          setNextUrl(window.location.pathname + window.location.search)
        }
      }
    }
    run()
  }, [])

  const handleClick = () => {
    if (!toId) return

    // pas connecté → on envoie vers la page de connexion
    if (!isConnected) {
      window.location.href = `/connexion?next=${encodeURIComponent(nextUrl)}`
      return
    }

    // connecté → on ouvre la messagerie
    const params = new URLSearchParams()
    params.set('to', String(toId))
    window.location.href = `/messages?${params.toString()}`
  }

  const disabled = !toId // seulement si pas d’ID destinataire

  return (
    <div className="mt-6">
      {!isConnected && (
        <p className="text-sm text-gray-600 mb-2">
          Vous devez être connecté pour envoyer un message.
        </p>
      )}

      <button
        type="button"
        onClick={disabled ? undefined : handleClick}
        disabled={disabled}
        className={`px-6 py-2 rounded-full font-semibold transition duration-200 ${
          !disabled
            ? 'bg-[#e3107d] text-white hover:bg-pink-700'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
      >
        Envoyer un message
      </button>

      {!toId && (
        <p className="text-xs text-gray-500 mt-2">
          Propriétaire introuvable pour ce jardin.
        </p>
      )}
    </div>
  )
}
