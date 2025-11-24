'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
      const arr = JSON.parse(p)
      if (Array.isArray(arr) && arr.length) {
        const v = arr[0]
        return typeof v === 'string' ? v : (v?.url || null)
      }
    } else if (Array.isArray(p) && p.length) {
      const v = p[0]
      return typeof v === 'string' ? v : (v?.url || null)
    }
  } catch {}
  return garden?.photo_couverture || garden?.photo || null
}

export default function ValidationReservationJardinsPage() {
  const params = useSearchParams()

  const jardinId = Number(params.get('jardinId') || 0)
  const reservationId = params.get('reservationId') || ''
  const startDate = params.get('startDate') || ''
  const startTime = params.get('startTime') || ''
  const endDate = params.get('endDate') || ''
  const endTime = params.get('endTime') || ''
  const commentaire = params.get('commentaire') || ''

  const start = useMemo(() => ({ date: startDate, time: startTime }), [startDate, startTime])
  const end   = useMemo(() => ({ date: endDate,   time: endTime   }), [endDate, endTime])

  const [garden, setGarden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const name = garden?.titre || garden?.nom || garden?.name || '—'
  const location =
    (garden?.ville && garden?.code_postal ? `${garden.ville} ${garden.code_postal}` : garden?.ville) ||
    garden?.adresse || 'Localisation non renseignée'
  const desc = garden?.description || 'Pas encore de description.'
  const photo = firstGardenPhoto(garden)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Réservation confirmée</h1>

        {loading && <p className="text-sm text-gray-600">Chargement…</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Récap */}
            <div className="md:col-span-2 space-y-6">
              <section className="rounded-2xl border bg-white dark:bg-zinc-800 dark:text-zinc-100 p-4">
                <p className="text-lg font-semibold mb-1">Votre réservation est validée</p>
                {reservationId ? (
                  <p className="text-sm text-gray-600 mb-4">Référence : {reservationId}</p>
                ) : null}

                <div className="mb-4">
                  <p className="text-sm text-gray-700">Arrivée</p>
                  <p className="font-medium">{formatDateTime(start.date, start.time)}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700">Départ</p>
                  <p className="font-medium">{formatDateTime(end.date, end.time)}</p>
                </div>

                {commentaire ? (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 mb-1">Votre message</p>
                    <div className="p-3 border rounded bg-gray-50 dark:bg-zinc-900 whitespace-pre-wrap">
                      {commentaire}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/profil?tab=reservations"
                  className="rounded-full bg-[#e3107d] hover:bg-pink-800 text-white font-medium px-5 py-2 transition inline-flex items-center"
                >
                  Annuler ma réservation
                </Link>
                <Link
                  href="/jardins"
                  className="rounded-full bg-[#e3107d] hover:bg-pink-800 text-white font-medium px-5 py-2 transition inline-flex items-center"
                >
                  Retourner consulter les jardins
                </Link>
              </div>
            </div>

            {/* Carte jardin */}
            <div className="md:col-span-1">
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
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-300">{location}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-zinc-200">{desc}</p>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
