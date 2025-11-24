'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001'

function formatDateTime(date, time) {
  if (!date || !time) return '—'
  const d = new Date(`${date}T${time}:00`)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} à ${hh}:${mi}`
}

function firstGardenPhoto(garden) {
  const p = garden?.photos
  try {
    if (typeof p === 'string') {
      const parsed = JSON.parse(p)
      if (Array.isArray(parsed) && parsed.length) {
        const v = parsed[0]
        return typeof v === 'string' ? v : (v?.url || null)
      }
    } else if (Array.isArray(p) && p.length) {
      const v = p[0]
      return typeof v === 'string' ? v : (v?.url || null)
    }
  } catch {}
  return garden?.photo_couverture || garden?.photo || null
}

function getClientId() {
  try {
    const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
    const u = raw ? JSON.parse(raw) : null
    return (u && (u.id_utilisateur || u.id)) || null
  } catch { return null }
}

/* ===== Carte infos jardin ===== */
function GardenInfoCard({ garden, onReserve }) {
  const loading = !garden
  const name = garden?.titre || garden?.nom || garden?.name || '—'
  const location =
    (garden?.ville && garden?.code_postal
      ? `${garden.ville} ${garden.code_postal}`
      : garden?.ville) ||
    garden?.adresse || 'Localisation non renseignée'
  const desc = garden?.description || 'Pas encore de description.'
  const photo = firstGardenPhoto(garden)

  return (
    <aside className="rounded-2xl border p-4 bg-white dark:bg-zinc-800 dark:text-zinc-100 text-gray-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden border">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">photo</div>
          )}
        </div>
        <div>
          <p className="font-semibold">{loading ? 'Chargement…' : name}</p>
          <p className="text-sm text-gray-600 dark:text-zinc-300">{loading ? '—' : location}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-zinc-200 mb-4">
        {loading ? 'Chargement…' : desc}
      </p>

      <button
        type="button"
        onClick={onReserve}
        disabled={loading}
        className="w-full rounded-full px-5 py-3 bg-[#e3107d] text-white font-semibold hover:bg-pink-700 transition disabled:opacity-60"
      >
        Confirmer la réservation
      </button>
    </aside>
  )
}

export default function ConfirmationReservationJardinsPage() {
  const search = useSearchParams()
  const router = useRouter()

  const jardinId = Number(search.get('jardinId') || 0)
  const startDate = search.get('startDate') || ''
  const startTime = search.get('startTime') || ''
  const endDate = search.get('endDate') || ''
  const endTime = search.get('endTime') || ''

  const [garden, setGarden] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentaire, setCommentaire] = useState('')

  const start = useMemo(() => ({ date: startDate, time: startTime }), [startDate, startTime])
  const end   = useMemo(() => ({ date: endDate,   time: endTime   }), [endDate, endTime])

  // Connexion
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      const hasCookie =
        typeof document !== 'undefined' &&
        /(?:^|;\s*)(jwt|token|auth|session)=/.test(document.cookie)
      const hasUserId = !!(u && (u.id_utilisateur || u.id))
      setIsConnected(Boolean(hasUserId || token || hasCookie))
    } catch {
      setIsConnected(false)
    }
  }, [])

  // Chargement jardin
  useEffect(() => {
    if (!jardinId) { setError('Paramètre jardinId manquant.'); setLoading(false); return }
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetch(`${API_BASE}/api/confirmation_reservation_jardins/${jardinId}`, { credentials: 'include' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        setGarden(await r.json())
      } catch (e) {
        console.error('[fetch garden]', e)
        setError('Impossible de charger le jardin.')
      } finally {
        setLoading(false)
      }
    })()
  }, [jardinId])

  // Réserver
  const handleReserve = async () => {
    if (!isConnected) return
    try {
      const startIso = new Date(`${start.date}T${start.time}:00`).toISOString()
      const endIso   = new Date(`${end.date}T${end.time}:00`).toISOString()
      const uid = getClientId()

      const r = await fetch(`${API_BASE}/api/confirmation_reservation_jardins/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(uid ? { 'x-user-id': String(uid) } : {}), // ✅ passe l'ID côté header (dev)
        },
        credentials: 'include',
        body: JSON.stringify({
          id_jardin: jardinId,
          start: startIso,
          end: endIso,
          commentaire: commentaire?.trim() || null,
        }),
      })

      let payload = null
      try { payload = await r.json() } catch {}

      if (r.status === 409) { alert('Ce créneau vient d’être pris.'); return }
      if (!r.ok) {
        alert(`Échec de la réservation du jardin : ${payload?.error || `HTTP ${r.status}`}`)
        return
      }

      const id = payload?.reservation?.id_reservation
      if (!id) { alert('Réservation créée mais id manquant.'); return }

      const q = new URLSearchParams({
        reservationId: String(id),
        jardinId: String(jardinId),
        startDate: start.date || '',
        startTime: start.time || '',
        endDate: end.date || '',
        endTime: end.time || '',
        commentaire: commentaire || '',
      }).toString()

      // ✅ redirige vers la page de validation
      router.push(`/validation_reservation_jardins?${q}`)
    } catch (e) {
      console.error('[reserve garden]', e)
      alert('Échec de la réservation du jardin.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">{/* Footer collé en bas */}
      <Navbar />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Demande de réservation</h1>

        {loading && <p className="text-sm text-gray-600">Chargement…</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne gauche : récap + message */}
            <div className="md:col-span-2 space-y-6">
              <section>
                <div className="mb-6">
                  <p className="text-sm text-gray-700">Arrivée</p>
                  <p className="font-medium">{formatDateTime(start.date, start.time)}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-700">Départ</p>
                  <p className="font-medium">{formatDateTime(end.date, end.time)}</p>
                </div>

                <hr className="my-6 border-gray-300" />

                <div>
                  <p className="mb-2">Voulez-vous laisser un message au jardinier ?</p>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Ex: J’ai un grand potager, pensez à amener vos outils..."
                    className="w-full h-40 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#e3107d]"
                  />
                </div>
              </section>
            </div>

            {/* Colonne droite : carte + bouton */}
            <div className="md:col-span-1 space-y-4">
              <GardenInfoCard garden={garden} onReserve={handleReserve} />
            </div>
          </div>
        )}
      </main>

      <div className="[&_*]:mt-0">
        <Footer />
      </div>
    </div>
  )
}
