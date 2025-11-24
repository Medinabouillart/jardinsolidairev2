'use client'
import React from 'react'

export default function BlocCompetencePresentation({
  titre = 'Compétences',
  competences = [],
  emptyLabel = 'Aucune compétence renseignée.',
}) {
  const list = Array.isArray(competences) ? competences.filter(Boolean) : []

  return (
    <section className="p-5 rounded-2xl shadow bg-white text-gray-800">
      <h2 className="text-xl font-semibold mb-3">{titre}</h2>

      {list.length === 0 ? (
        <p className="text-gray-500">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-sm text-[#e3107d]"
            >
              {typeof c === 'string' ? c : c?.nom ?? '—'}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
