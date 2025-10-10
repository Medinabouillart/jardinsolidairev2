'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const ListeJardiniers = () => {
  const [jardiniers, setJardiniers] = useState([])
  const [favoris, setFavoris] = useState([])

  // Filtres (CP strict)
  const [search, setSearch]   = useState('')
  const [noteMin, setNoteMin] = useState('')
  const [type, setType]       = useState('')
  const [cp, setCp]           = useState('')     // code postal (5 chiffres)

  useEffect(() => {
    const query = new URLSearchParams()
    if (search)  query.append('search', search)
    if (noteMin) query.append('note', noteMin)
    if (type)    query.append('type', type)
    if (cp && /^\d{5}$/.test(cp)) query.append('cp', cp) // CP strict

    fetch(`http://localhost:5001/api/jardiniers?${query.toString()}`)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(data => setJardiniers(Array.isArray(data) ? data : []))
      .catch(() => setJardiniers([]))
  }, [search, noteMin, type, cp])

  const toggleFavori = (id) => {
    setFavoris(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const resetAll = () => {
    setSearch('')
    setNoteMin('')
    setType('')
    setCp('')
  }

  return (
    <div className="bg-white">
      {/* Filtres – grille (12 colonnes) SANS rayon */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Recherche (6) */}
        <div className="relative min-w-0 lg:col-span-6">
          <span className="pointer-events-none absolute left-4 top-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un jardinier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-gray-300 pl-11 pr-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
          />
        </div>

        {/* Code postal (2) */}
        <div className="min-w-0 lg:col-span-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="Code postal"
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, ''))}
            className="h-11 w-full rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
          />
        </div>

        {/* Note min (2) */}
        <div className="min-w-0 lg:col-span-2">
          <input
            type="number"
            step="0.1"
            placeholder="Note minimale"
            value={noteMin}
            onChange={(e) => setNoteMin(e.target.value)}
            className="h-11 w-full rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
          />
        </div>

        {/* Type (1) */}
        <div className="min-w-0 lg:col-span-1">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-11 w-full rounded-full border border-gray-300 px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#e3107d]"
          >
            <option value="">Type</option>
            <option value="potager">Potager</option>
            <option value="fleurs">Fleurs</option>
            <option value="permaculture">Permaculture</option>
            <option value="jardinage">Apprendre</option>
            <option value="tondre">Tondre</option>
          </select>
        </div>

        {/* Reset (1) */}
        <div className="lg:col-span-1 lg:justify-self-end">
          <button
            onClick={resetAll}
            className="h-11 w-full lg:w-auto rounded-full bg-[#e3107d] px-5 text-white text-sm transition hover:opacity-90"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste */}
      {jardiniers.length === 0 ? (
        <p className="text-center text-sm text-gray-500">Aucun jardinier trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {jardiniers.map((j) => {
            const isFav = favoris.includes(j.id_utilisateur)
            return (
              <div
                key={j.id_utilisateur}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-5">
                  {/* Avatar */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={j.photo_profil || '/assets/default-avatar.jpg'}
                      alt={`${j.prenom ?? ''} ${j.nom ?? ''}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => toggleFavori(j.id_utilisateur)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-xl leading-none transition hover:scale-110"
                      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      {isFav ? <span className="text-[#e3107d]">♥</span> : <span className="text-gray-400">♡</span>}
                    </button>
                    {j.visibility === 'dm_only' && (
                      <span className="absolute left-2 top-2 rounded-full border border-gray-300 bg-white/90 px-2 py-0.5 text-[11px] text-gray-600">
                        🔒 Privé
                      </span>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-gray-900">
                        {j.prenom ?? ''} {j.nom ?? ''}
                      </h3>
                      {j.age
                        ? <span className="rounded-full border px-2 py-0.5 text-[11px] text-gray-600">Âge {j.age}</span>
                        : <span className="rounded-full border px-2 py-0.5 text-[11px] text-gray-400">Âge n/r</span>}
                      {typeof j.note_moyenne !== 'undefined' && (
                        <span className="text-sm text-amber-600">★ {j.note_moyenne}</span>
                      )}
                    </div>

                    {/* Compétences (placeholder) */}
                    {Array.isArray(j.competences) && j.competences.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {j.competences.slice(0, 5).map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[11px] text-[#e3107d]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-2 line-clamp-3 text-[15px] text-gray-700">
                      {j.biographie || 'Pas encore de description.'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>📍 {j.ville || j.adresse || 'Ville n/r'}</span>
                      {j.telephone && <span>• 📞 {j.telephone}</span>}
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <Link
                        href={`/jardiniers/${j.id_utilisateur}`}
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

export default ListeJardiniers
