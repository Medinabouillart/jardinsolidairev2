'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import ActionBar from '@/components/reservation_jardin/ActionBar'
import CalendrierBloc from '@/components/reservation_jardin/CalendrierBloc'
import CommentaireBloc from '@/components/reservation_jardin/CommentaireBloc'

function CarouselPhotos({ photos = [] }) {
  const [i, setI] = useState(0)
  const many = photos.length > 1
  const current = photos[i] || ''

  return (
    <div className="relative w-full">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
        {current ? (
          <img src={current} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            Aucune image
          </div>
        )}
        {many && (
          <>
            <button
              onClick={() => setI((p) => (p - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xl shadow hover:bg-white"
              aria-label="Précédent"
            >
              ‹
            </button>
            <button
              onClick={() => setI((p) => (p + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xl shadow hover:bg-white"
              aria-label="Suivant"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className={`h-2 w-2 rounded-full ${idx === i ? 'bg-[#e3107d]' : 'bg-white/70'}`}
                  aria-label={`Aller à l’image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ReservationJardinPage({ params }) {
  const { id } = params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Auth (détection pour la redirection au clic)
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [nextUrl, setNextUrl] = useState('/')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${apiBase}/api/me`, { credentials: 'include', cache: 'no-store' })
        setIsAuthenticated(r.ok || !!localStorage.getItem('user') || !!localStorage.getItem('token'))
      } catch {
        setIsAuthenticated(!!localStorage.getItem('user') || !!localStorage.getItem('token'))
      }
      if (typeof window !== 'undefined') {
        setNextUrl(window.location.pathname + window.location.search)
      }
    })()
  }, [apiBase])

  useEffect(() => {
    const base = apiBase
    const url = `${base}/api/jardins/${encodeURIComponent(id)}`
    ;(async () => {
      try {
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = await r.json()
        setData(j)
      } catch {
        setError('Impossible de charger ce jardin.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, apiBase])

  // 🔥 Normalisation des photos (string OU objet {dataUrl/url})
  const photos = useMemo(() => {
    if (!Array.isArray(data?.photos)) return []
    return data.photos
      .map((p) => {
        if (p && typeof p === 'object') {
          return p.dataUrl || p.url || ''
        }
        return p || ''
      })
      .filter(Boolean)
  }, [data])

  const categories = useMemo(
    () => (Array.isArray(data?.categories) ? data.categories : []),
    [data]
  )

  // 🔥 Normalisation avatar (string OU objet {dataUrl/url})
  const avatar = useMemo(() => {
    const raw = data?.avatar || data?.photo_profil || null
    if (!raw) return ''
    if (typeof raw === 'object') {
      return raw.dataUrl || raw.url || ''
    }
    return raw || ''
  }, [data])

  // Styles bouton
  const baseBtn =
    'inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-2xl text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  const enabledBtn =
    'bg-[#e3107d] text-white hover:opacity-90 active:opacity-85 focus-visible:ring-[#e3107d] ring-offset-1'

  const handleSendMessage = () => {
    if (isAuthenticated) {
      window.location.href = `/messages/nouveau?to=${encodeURIComponent(id)}`
    } else {
      window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-[10%] pt-24 pb-10 space-y-8">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Image
              src={avatar || '/assets/default-avatar.jpg'}
              alt={data?.proprietaire || 'Propriétaire'}
              width={120}
              height={120}
              unoptimized
              className="rounded-full object-cover border-2 border-[#e3107d]"
            />
            <div>
              <h1 className="text-2xl font-bold">
                {loading ? 'Chargement…' : data?.proprietaire || 'Propriétaire'}
              </h1>
              <p className="mt-1 text-sm text-gray-700 flex flex-wrap items-center gap-2">
                <span>
                  {loading ? '—' : data?.ville || 'Ville n/r'}
                  {data?.code_postal ? ` (${data.code_postal})` : ''}
                </span>
                {typeof data?.note === 'number' && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-amber-500" aria-hidden>
                      ⭐
                    </span>
                    <span className="text-gray-800">{data.note.toFixed(1)}</span>
                  </span>
                )}
                {data?.type && <span>• {data.type}</span>}
              </p>
              {data?.titre && <p className="text-sm text-gray-900 mt-1">{data.titre}</p>}
            </div>
          </div>

          <ActionBar jardinId={id} />
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {/* Carrousel */}
        <CarouselPhotos photos={photos} />

        {/* 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne gauche */}
          <div className="lg:col-span-4 order-1 space-y-4">
            <section className="p-5 rounded-2xl shadow bg-white text-gray-800 min-h-[560px]">
              <h2 className="text-xl font-semibold mb-3">À propos</h2>
              <p className="leading-relaxed whitespace-pre-line">
                {data?.description || (loading ? 'Chargement…' : 'Pas encore de description.')}
              </p>

              <hr className="my-5" />

              <h3 className="text-lg font-semibold mb-2">Compétences</h3>
              {(() => {
                const chips = []
                if (data?.type) chips.push(String(data.type))
                if (categories?.length) {
                  for (const c of categories) chips.push(typeof c === 'string' ? c : c?.nom ?? '—')
                }
                if (chips.length === 0) {
                  return (
                    <p className="text-sm text-gray-600">
                      {loading ? 'Chargement…' : 'Aucune compétence renseignée.'}
                    </p>
                  )
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((label, i) => (
                      <span
                        key={`${label}-${i}`}
                        className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[12px] text-[#e3107d]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )
              })()}

              <div className="mt-4">
                {/* Bouton toujours cliquable : redirige selon l’auth */}
                <button
                  type="button"
                  className={`${baseBtn} ${enabledBtn}`}
                  onClick={handleSendMessage}
                >
                  Envoyer un message
                </button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    Pas encore connecté ?{' '}
                    <a
                      href={`/login?next=${encodeURIComponent(nextUrl)}`}
                      className="text-[#e3107d] underline"
                    >
                      Se connecter / créer un compte
                    </a>
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Colonne droite */}
          <div className="lg:col-span-8 order-2">
            <CalendrierBloc idJardin={id} />
          </div>
        </div>

        <CommentaireBloc jardinId={id} />
      </main>

      <Footer />
    </div>
  )
}
