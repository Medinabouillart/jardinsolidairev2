'use client'

import { useEffect, useState } from 'react'

export default function BoutonAvecConnexion({ jardinierId }) {
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
        setNextUrl(window.location.pathname)
      }
    } catch {
      setIsConnected(false)
    }
  }, [])

  const handleClick = () => {
    if (!isConnected) return
    window.location.href = `/messages/nouveau?to=${encodeURIComponent(jardinierId)}`
  }

  return (
    <div className="mt-6">
      {/* Message au-dessus si pas connecté */}
      {!isConnected && (
        <p className="text-sm text-gray-600 mb-2">
          Vous devez être connecté pour envoyer un message.
        </p>
      )}

      <button
        type="button"
        onClick={isConnected ? handleClick : undefined}
        disabled={!isConnected}
        className={`px-6 py-2 rounded-full font-semibold transition duration-200 ${
          isConnected
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
    </div>
  )
}
