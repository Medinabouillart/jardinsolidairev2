'use client'

import { useEffect, useState } from 'react'

export default function BoutonAvecConnexion({ jardinierId, jardinier }) {
  const [isConnected, setIsConnected] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        const raw =
          localStorage.getItem('utilisateur') || localStorage.getItem('user')
        const u = raw ? JSON.parse(raw) : null
        const hasCookie =
          /(?:^|;\s*)(jwt|token|auth|session)=/.test(document.cookie)

        setIsConnected(Boolean(token || (u && u.id_utilisateur) || hasCookie))
        setCurrentPath(window.location.pathname)
      }
    } catch (e) {
      console.error('[BoutonAvecConnexion] erreur lecture session', e)
      setIsConnected(false)
    }
  }, [])

  const handleClick = () => {
    if (!jardinierId) return

    // ❌ pas connecté → on redirige vers connexion
    if (!isConnected) {
      const next = encodeURIComponent(currentPath)
      window.location.href = `/connexion?next=${next}`
      return
    }

    // ✅ connecté → on construit l’URL vers /messages
    const params = new URLSearchParams()
    params.set('to', String(jardinierId))

    if (jardinier) {
      if (jardinier.prenom) params.set('prenom', jardinier.prenom)
      if (jardinier.nom) params.set('nom', jardinier.nom)
      if (jardinier.ville) params.set('ville', jardinier.ville)
      if (jardinier.photo_profil) params.set('avatar', jardinier.photo_profil)

      const displayName = [jardinier.prenom, jardinier.nom]
        .filter(Boolean)
        .join(' ')
      if (displayName) {
        params.set('displayName', displayName)
      }
    }

    window.location.href = `/messages?${params.toString()}`
  }

  return (
    <div className="mt-6">
      {!isConnected && (
        <p className="text-sm text-gray-600 mb-2">
          Vous devez être connecté pour envoyer un message.
        </p>
      )}

      <button
        type="button"
        onClick={handleClick}
        className="px-6 py-2 rounded-full font-semibold transition duration-200 bg-[#e3107d] text-white hover:bg-pink-700"
      >
        Contacter ce jardinier
      </button>
    </div>
  )
}
