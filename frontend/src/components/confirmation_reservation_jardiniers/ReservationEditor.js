'use client'
import { useMemo } from 'react'

export default function ReservationEditor({ start, end }) {
  const times = useMemo(() => {
    // Créneaux toutes les 30min entre 08:00 et 20:00
    const out = []
    for (let h = 8; h <= 20; h++) {
      for (let m of [0, 30]) {
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        out.push(`${hh}:${mm}`)
      }
    }
    return out
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const isInvalidRange = () => {
    const s = new Date(`${start.date}T${start.time}:00`)
    const e = new Date(`${end.date}T${end.time}:00`)
    return isNaN(+s) || isNaN(+e) || e <= s
  }

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold">Demande de réservation</h2>

      {/* ARRIVÉE */}
      <div>
        <p className="text-sm font-medium">Arrivée</p>
        <p className="text-sm text-muted-foreground">
          {start?.date && start?.time
            ? `${start.date} à ${start.time}`
            : '—'}
        </p>
      </div>

      {/* DÉPART */}
      <div>
        <p className="text-sm font-medium">Départ</p>
        <p className="text-sm text-muted-foreground">
          {end?.date && end?.time
            ? `${end.date} à ${end.time}`
            : '—'}
        </p>
      </div>

      {isInvalidRange() && (
        <p className="text-sm text-red-600">
          Le départ doit être après l’arrivée.
        </p>
      )}

      <hr className="my-4" />
    </section>
  )
}
