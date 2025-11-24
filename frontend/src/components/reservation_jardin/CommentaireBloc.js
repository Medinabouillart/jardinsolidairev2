'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CommentaireBloc({ jardinId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jardinId) return
    const controller = new AbortController()

    ;(async () => {
      try {
        setLoading(true); setError('')
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '')
        const url  = `${base}/api/reservation_jardins/${encodeURIComponent(jardinId)}/commentaires?limit=30`
        let res    = await fetch(url, { signal: controller.signal })

        // fallback si la table jardin n'existe pas encore et que tu réutilises celle des jardiniers
        if (res.status === 404) {
          const alt = `${base}/api/reservation_jardiniers/${encodeURIComponent(jardinId)}/commentaires?limit=30`
          res = await fetch(alt, { signal: controller.signal })
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (e.name !== 'AbortError') setError('Impossible de charger les commentaires.')
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [jardinId])

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-green-700 mb-3">Commentaires</h2>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-2 mb-3">
          {error}
        </div>
      )}

      {!error && loading && <p className="text-sm text-gray-500">Chargement…</p>}

      {!error && !loading && items.length === 0 && (
        <p className="text-sm text-gray-600">Aucun commentaire pour le moment.</p>
      )}

      {!error && !loading && items.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((c) => (
            <div
              key={c.id_reservation ?? `${c.date_reservation}-${c.commentaires?.slice(0,10)}`}
              className="min-w-[260px] max-w-[320px] bg-white border border-gray-200 rounded-lg shadow p-4 flex-shrink-0"
            >
              <div className="text-xs text-gray-500 mb-1">
                {c.date_reservation
                  ? format(new Date(c.date_reservation), "d MMM yyyy 'à' HH:mm", { locale: fr })
                  : 'Date n/r'}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {c.commentaires}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
