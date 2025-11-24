'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const Stars = ({ value }) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) {
    return <span className="text-xs text-gray-500">Aucune note</span>
  }
  const v = Math.max(0, Math.min(5, num))
  const pct = (v / 5) * 100
  return (
    <div className="flex items-center gap-2" aria-label={`Note ${v.toFixed(1)}/5`}>
      <div className="relative inline-block leading-none">
        <div className="text-gray-300 select-none">★★★★★</div>
        <div className="absolute left-0 top-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="text-[#e3107d] select-none">★★★★★</div>
        </div>
      </div>
      <span className="text-xs text-gray-600">{v.toFixed(1)}</span>
    </div>
  )
}

const ListeJardins = () => {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [search, setSearch]   = useState('')
  const [codePostal, setCP]   = useState('')
  const [type, setType]       = useState('')
  const [noteMin, setNoteMin] = useState('') // identique jardiniers (input number)

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '')
    const url  = `${base}/api/jardins`
    setLoading(true)
    fetch(url)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(data => setAll(Array.isArray(data) ? data : []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false))
  }, [])

  const resetAll = () => { setSearch(''); setCP(''); setType(''); setNoteMin('') }

  const normalized = useMemo(() => {
    return (all || []).map(j => {
      const id    = j.id ?? j.id_jardin ?? Math.random().toString(36).slice(2)
      const titre = j.titre || `Jardin #${id}`
      const description = j.description || ''
      const ville = j.ville || ''
      const code_postal =
        j.code_postal ?? j.cp ?? j.postal_code ?? j.postalcode ?? j.zip ?? ''
      const photos = Array.isArray(j.photos) ? j.photos : []
      const note =
        j.note ?? j.note_moyenne ?? j.rating ?? j.moyenne ?? j.score ?? 0
      const theType = j.type || j.categorie || ''
      return { id, titre, description, ville, code_postal, photos, note, type: theType }
    })
  }, [all])

  const typeOptions = useMemo(() => {
    const set = new Set()
    normalized.forEach(j => { if (j.type && String(j.type).trim()) set.add(String(j.type).trim()) })
    return Array.from(set).sort((a,b) => a.localeCompare(b, 'fr'))
  }, [normalized])

  const filtered = useMemo(() => {
    const s  = search.trim().toLowerCase()
    const c  = codePostal.trim().toLowerCase()
    const t  = type.trim().toLowerCase()
    const mn = noteMin === '' ? 0 : Number(noteMin)

    return normalized.filter(j => {
      const okS = !s || (j.titre.toLowerCase().includes(s) || j.description.toLowerCase().includes(s))
      const okC = !c || String(j.code_postal).toLowerCase().includes(c)
      const okT = !t || (j.type && j.type.toLowerCase().includes(t))
      const v   = Number(j.note || 0)
      const okN = !mn || (v && v >= mn)
      return okS && okC && okT && okN
    })
  }, [normalized, search, codePostal, type, noteMin])

  return (
    <div className="bg-white">
      {/* Barre filtres : même gabarit que jardiniers */}
      <div className="mb-6 px-2">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
          {/* Recherche (4) */}
          <div className="relative min-w-0 md:col-span-4">
            <span className="pointer-events-none absolute left-4 top-3 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un jardin…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-gray-300 pl-11 pr-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
            />
          </div>

          {/* Code postal (2) */}
          <div className="min-w-0 md:col-span-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="Code postal"
              value={codePostal}
              onChange={(e) => setCP(e.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
            />
          </div>

          {/* Note min (2) — identique jardiniers */}
          <div className="min-w-0 md:col-span-2">
            <input
              type="number"
              step="0.1"
              placeholder="Note minimale"
              value={noteMin}
              onChange={(e) => setNoteMin(e.target.value)}
              className="h-11 w-full rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
            />
          </div>

          {/* Type (2) */}
          <div className="min-w-0 md:col-span-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 w-full min-w-[120px] rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
              disabled={typeOptions.length === 0}
            >
              <option value="">{typeOptions.length ? 'Type' : 'Type (aucun)'}</option>
              {typeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Reset (2) */}
          <div className="md:col-span-2 md:justify-self-end">
            <button
              onClick={resetAll}
              className="h-11 min-w-[140px] rounded-full bg-[#e3107d] px-5 text-white text-sm transition hover:opacity-90 md:w-auto"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste — même taille que jardiniers */}
      {loading ? (
        <p className="text-center text-sm text-gray-500">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-500">Aucun jardin trouvé.</p>
      ) : (
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((j) => {
            // 🔥 Normalisation de la première photo (string OU objet)
            const raw = (j.photos && j.photos.length) ? j.photos[0] : null
            const photo =
              raw && typeof raw === 'object'
                ? raw.dataUrl || raw.url || ''
                : raw || ''

            return (
              <div
                key={j.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-5">
                  {/* Cover — hauteur identique (h-24) */}
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {photo ? (
                      <img src={photo} alt={j.titre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Pas d’image
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-gray-900">
                        {j.titre}
                      </h3>
                      <Stars value={j.note} />
                    </div>

                    <p className="mt-2 line-clamp-3 text-[15px] text-gray-700">
                      {j.description || 'Pas encore de description.'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>📍 {j.code_postal || '—'}</span>
                      {j.type && <span>🌿 {j.type}</span>}
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <Link
                        href={`/reservation_jardin/${encodeURIComponent(j.id)}`}
                        className="rounded-full border border-[#e3107d] bg-white px-5 py-2 text-sm font-medium text-[#e3107d] transition hover:bg-[#e3107d] hover:text-white"
                      >
                        En savoir plus
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ListeJardins
