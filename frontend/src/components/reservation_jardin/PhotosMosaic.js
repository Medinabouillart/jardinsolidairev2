// components/reservation_jardin/PhotosMosaic.js
'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * Mosaic responsive avec lightbox simple.
 * Props:
 *  - photos: string[] (URLs)
 *  - title?: string   (alt/aria)
 *  - className?: string
 */
export default function PhotosMosaic({ photos = [], title = 'Jardin', className = '' }) {
  const list = useMemo(() => (Array.isArray(photos) ? photos.filter(Boolean) : []), [photos])
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    function onKey(e) {
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + list.length) % list.length)
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % list.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, list.length])

  if (list.length === 0) {
    return (
      <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
        <p className="mt-2 text-sm text-gray-500">Aucune photo.</p>
      </section>
    )
  }

  // 1 seule photo → simple bloc
  if (list.length === 1) {
    return (
      <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Photos</h2>
        <button
          onClick={() => { setIndex(0); setOpen(true) }}
          className="block w-full overflow-hidden rounded-xl"
          aria-label="Voir la photo en plein écran"
        >
          <img src={list[0]} alt={title} className="h-72 w-full object-cover md:h-96" />
        </button>

        <Lightbox open={open} onClose={() => setOpen(false)} list={list} index={index} setIndex={setIndex} title={title} />
      </section>
    )
  }

  // 2 à N → mosaïque (1 grande + 3/4 petites)
  const main = list[0]
  const thumbs = list.slice(1, 5)
  const moreCount = Math.max(0, list.length - 5)

  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      <h2 className="mb-3 text-xl font-semibold text-gray-900">Photos</h2>

      <div className="grid h-[420px] grid-cols-2 grid-rows-2 gap-2 md:h-[520px] md:grid-cols-3 md:grid-rows-2">
        {/* Grande image */}
        <button
          onClick={() => { setIndex(0); setOpen(true) }}
          className="relative col-span-2 row-span-2 overflow-hidden rounded-xl md:col-span-2 md:row-span-2"
          aria-label="Voir la photo en plein écran"
        >
          <img src={main} alt={title} className="h-full w-full object-cover" />
        </button>

        {/* Miniatures */}
        {thumbs.map((src, i) => {
          const isLastAndMore = i === thumbs.length - 1 && moreCount > 0
          const globalIndex = i + 1
          return (
            <button
              key={src + i}
              onClick={() => { setIndex(globalIndex); setOpen(true) }}
              className="relative overflow-hidden rounded-xl"
              aria-label={`Voir la photo ${globalIndex + 1} en plein écran`}
            >
              <img src={src} alt={`${title} – ${globalIndex + 1}`} className="h-full w-full object-cover" />
              {isLastAndMore && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900">
                    +{moreCount}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Lightbox open={open} onClose={() => setOpen(false)} list={list} index={index} setIndex={setIndex} title={title} />
    </section>
  )
}

function Lightbox({ open, onClose, list, index, setIndex, title }) {
  if (!open) return null
  if (!Array.isArray(list) || list.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm text-gray-900 hover:bg-white"
        aria-label="Fermer"
      >
        Fermer ✕
      </button>

      <button
        onClick={() => setIndex(i => (i - 1 + list.length) % list.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-lg text-gray-900 hover:bg-white"
        aria-label="Précédent"
      >
        ‹
      </button>

      <div className="max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl bg-black">
        <img
          src={list[index]}
          alt={`${title} – ${index + 1}`}
          className="max-h-[85vh] max-w-[90vw] object-contain"
        />
      </div>

      <button
        onClick={() => setIndex(i => (i + 1) % list.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-1 text-lg text-gray-900 hover:bg-white"
        aria-label="Suivant"
      >
        ›
      </button>
    </div>
  )
}
