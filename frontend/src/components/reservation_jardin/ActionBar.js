// src/components/reservation_jardin/ActionBar.js
'use client'

import { useEffect, useState } from 'react'
import { Share2 /*, Heart*/ } from 'lucide-react'

/** Identique à l’ActionBar des jardiniers, adapté pour un JARDIN */
export default function ActionBar({ jardinId }) {
  // 🔕 Favoris désactivé pour l’instant
  // const [liked, setLiked] = useState(false)
  // const [userId, setUserId] = useState(null)
  // const [busy, setBusy] = useState(false)

  // 🔕 Favoris désactivé : récupération user locale
  // useEffect(() => {
  //   try {
  //     const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
  //     if (raw) {
  //       const u = JSON.parse(raw)
  //       const id = u?.id_utilisateur || u?.id || null
  //       if (id) setUserId(Number(id))
  //     }
  //   } catch {}
  // }, [])

  // 🔕 Favoris désactivé : hydratation depuis la DB
  // useEffect(() => {
  //   if (!userId || !jardinId) return
  //   ;(async () => {
  //     try {
  //       const res = await fetch(`http://localhost:5001/api/favoris/ids?user_id=${userId}`, { cache: 'no-store' })
  //       if (!res.ok) return
  //       const ids = await res.json()
  //       setLiked(ids.includes(Number(jardinId)))
  //     } catch {}
  //   })()
  // }, [userId, jardinId])

  // 🔕 Favoris désactivé : handler
  // const handleLike = async () => {}

  const handleShare = () => {
    const shareData = { title: 'Découvrez ce jardin', url: window.location.href }
    if (navigator.share) {
      navigator.share(shareData).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareData.url)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  // const isConnected = Boolean(userId)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-6">
        {/* 🔕 Bouton favoris désactivé
        <button
          onClick={handleLike}
          disabled={!isConnected || busy}
          className={`flex items-center gap-2 text-sm font-medium transition ${
            liked && isConnected ? 'text-pink-600' : 'text-gray-500'
          } ${(!isConnected || busy) ? 'opacity-60 cursor-not-allowed' : 'hover:text-pink-600'}`}
          aria-disabled={!isConnected}
          title={isConnected ? (liked ? 'Retirer des favoris' : 'Ajouter aux favoris') : 'Connectez-vous pour ajouter aux favoris'}
        >
          <Heart size={20} fill={liked && isConnected ? 'currentColor' : 'none'} />
          {liked && isConnected ? 'Aimé' : 'Aimer'}
        </button>
        */}

        {/* Partager */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition"
        >
          <Share2 size={20} />
          Partager
        </button>
      </div>

      {/* 🔕 Message connexion favoris désactivé
      {!isConnected && (
        <p className="mt-2 text-xs text-gray-600">
          Vous devez être connecté pour ajouter aux favoris.{' '}
          <a href="/connexion" className="text-[#e3107d] underline">
            Cliquez ici pour vous connecter
          </a>
        </p>
      )}
      */}
    </div>
  )
}
