// components/reservation_jardin/ProfilPhoto.js
'use client'

import React from 'react'

/**
 * Carte profil propriétaire (avatar + infos rapides).
 * Props:
 *  - name?: string
 *  - avatar?: string
 *  - note?: number        // 0..5
 *  - code_postal?: string
 *  - ville?: string
 *  - className?: string
 */
export default function ProfilPhoto({
  name = 'Propriétaire',
  avatar = '',
  note = null,
  code_postal = '',
  ville = '',
  className = '',
}) {
  const Stars = ({ value }) => {
    if (typeof value !== 'number') return null
    const v = Math.max(0, Math.min(5, value))
    const pct = (v / 5) * 100
    return (
      <div className="relative inline-block leading-none align-middle">
        <div className="select-none text-gray-300">★★★★★</div>
        <div className="absolute left-0 top-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="select-none text-[#e3107d]">★★★★★</div>
        </div>
      </div>
    )
  }

  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
          <img
            src={avatar || '/assets/default-avatar.jpg'}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-gray-900">{name}</h3>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {(code_postal || ville) && (
              <span>📍 {code_postal || '—'}{ville ? ` • ${ville}` : ''}</span>
            )}
            {typeof note === 'number' && (
              <span className="flex items-center gap-2">
                <Stars value={note} />
                <span className="text-xs text-gray-600">{note.toFixed(1)}/5</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
