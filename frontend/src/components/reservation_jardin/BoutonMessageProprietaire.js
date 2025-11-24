'use client'

import { useEffect, useState } from 'react'

export default function BoutonMessageProprietaire({ jardinierId, jardinier }) {
  const [isConnected, setIsConnected] = useState(false)
  const [nextUrl, setNextUrl] = useState('/')

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null

      const hasCookie =
        typeof document !== 'undefined' &&
        /(?:^|;\s*)(jwt|token|auth|session)=/.test(document.cookie)

      const hasUserId = !!(u && (u.id_utilisateur || u.id))
      setIsConnected(Boolean(token || hasCookie || hasUserId))

      if (typeof window !== 'undefined') {
        setNextUrl(window.location.pathname + window.location.search)
      }
    } catch (e) {
      console.error('[BoutonMessageProprietaire] auth check error:', e)
      setIsConnected(false)
    }
  }, [])

  const handleClick = () => {
    if (!jardinierId) return

    // pas connecté → page de connexion
    if (!isConnected) {
      window.location.href = `/connexion?next=${encodeURIComponent(nextUrl)}`
      return
    }

    // connecté → on construit l’URL de la messagerie
    const params = new URLSearchParams()
    params.set('to', String(jardinierId))

    if (jardinier) {
      if (jardinier.prenom) params.set('prenom', jardinier.prenom)
      if (jardinier.nom) params.set('nom', jardinier.nom)
      if (jardinier.ville) params.set('ville', jardinier.ville)
      if (jardinier.photo_profil) params.set('avatar', jardinier.photo_profil)

      const displayName = [jardinier.prenom, jardinier.nom].filter(Boolean).join(' ')
      if (displayName) params.set('displayName', displayName)
    }

    window.location.href = `/messages/nouveau?${params.toString()}`
  }

  const disabled = !jardinierId

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

      {!isConnected && (
        <p className="text-sm text-gray-600 italic mt-2">
          <a
            href={`/connexion?next=${encodeURIComponent(nextUrl)}`}
            className="text-[#e3107d] underline"
          >
            Cliquez ici pour vous connecter / créer un compte
          </a>
        </p>
      )}

      {!jardinierId && (
        <p className="text-xs text-gray-500 mt-2">
          Propriétaire introuvable pour ce jardin.
        </p>
      )}
    </div>
  )
}
