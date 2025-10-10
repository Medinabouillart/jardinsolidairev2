'use client'

import { useEffect, useState } from 'react'
import { Share2, Heart } from 'lucide-react'

/**
 * props:
 * - jardinierId (obligatoire)
 */
export default function ActionBar({ jardinierId }) {
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState(null)   // id utilisateur connecté (ou null)
  const [busy, setBusy] = useState(false)

  // Récupère l'utilisateur local (pas de redirection)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        const id = u?.id_utilisateur || u?.id || null
        if (id) setUserId(Number(id))
      }
    } catch {}
  }, [])

  // Hydrate l’état initial du cœur depuis la DB
  useEffect(() => {
    if (!userId || !jardinierId) return
    ;(async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/favoris/ids?user_id=${userId}`, { cache: 'no-store' })
        if (!res.ok) return
        const ids = await res.json() // ex: [1,3,5]
        setLiked(ids.includes(Number(jardinierId)))
      } catch {}
    })()
  }, [userId, jardinierId])

  const handleLike = async () => {
    if (!userId) return // non connecté -> inactif
    if (busy) return
    setBusy(true)

    const next = !liked
    setLiked(next) // optimistic

    try {
      const method = next ? 'POST' : 'DELETE'
      const res = await fetch('http://localhost:5001/api/favoris', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, jardinier_id: Number(jardinierId) }),
      })
      if (!res.ok) throw new Error('favoris failed')
    } catch (e) {
      setLiked(!next) // revert
      console.error('Erreur favoris:', e)
      alert("Oups, impossible d'enregistrer le favori.")
    } finally {
      setBusy(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Découvrez ce jardinier', url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  const isConnected = Boolean(userId)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-6">
        {/* Favoris */}
        <button
          onClick={handleLike}
          disabled={!isConnected || busy}
          className={`flex items-center gap-2 text-sm font-medium transition ${
            liked && isConnected ? 'text-pink-600' : 'text-gray-500'
          } ${(!isConnected || busy) ? 'opacity-60 cursor-not-allowed' : 'hover:text-pink-600'}`}
          aria-disabled={!isConnected}
          title={isConnected ? (liked ? 'Retirer des favoris' : 'Ajouter aux favoris') : 'Connectez-vous pour ajouter aux favoris'}
        >
          <Heart
            size={20}
            // rempli si liké + connecté, sinon contour gris
            fill={liked && isConnected ? 'currentColor' : 'none'}
          />
          {liked && isConnected ? 'Aimé' : 'Aimer'}
        </button>

        {/* Partager */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition"
        >
          <Share2 size={20} />
          Partager
        </button>
      </div>

      {/* Message si non connecté */}
      {!isConnected && (
        <p className="mt-2 text-xs text-gray-600">
          Vous devez être connecté pour ajouter aux favoris.{' '}
          <a href="/connexion" className="text-[#e3107d] underline">
            Cliquez ici pour vous connecter
          </a>
        </p>
      )}
    </div>
  )
}
