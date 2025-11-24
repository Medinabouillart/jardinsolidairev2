'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import startOfDay from 'date-fns/startOfDay'
import endOfDay from 'date-fns/endOfDay'
import fr from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

export default function CalendrierBloc({ jardinierId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [range, setRange] = useState(null)

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
      setIsConnected(Boolean(token || hasCookie || hasUserId))
    } catch {
      setIsConnected(false)
    }
  }, [])

  // Calcule la plage visible
  const handleRangeChange = useCallback((r) => {
    if (Array.isArray(r) && r.length) {
      const from = startOfDay(r[0])
      const to = endOfDay(r[r.length - 1])
      setRange({ from, to })
    } else if (r && r.start && r.end) {
      setRange({ from: startOfDay(r.start), to: endOfDay(r.end) })
    }
  }, [])

  // Fetch dispos datées (utilise from/to)
  useEffect(() => {
    if (!jardinierId || !range) return
    const controller = new AbortController()

    ;(async () => {
      try {
        setLoading(true)
        setError('')

        const fromStr = format(range.from, 'yyyy-MM-dd')
        const toStr = format(range.to, 'yyyy-MM-dd')
        const url = `http://localhost:5001/api/reservation_jardiniers/${encodeURIComponent(
          jardinierId
        )}/disponibilites?from=${fromStr}&to=${toStr}`

        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const rows = await res.json()

        const dispoEvents = Array.isArray(rows)
          ? rows.map((d) => ({
              id: `dispo-${d.id_dispo}-${d.start}`,
              title: `${format(new Date(d.start), 'HH:mm')} - ${format(
                new Date(d.end),
                'HH:mm'
              )}`,
              start: new Date(d.start),
              end: new Date(d.end),
              allDay: false,
              type: 'dispo',
            }))
          : []

        setEvents(dispoEvents)
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('Calendrier – fetch failed:', e)
          setError("Impossible de charger le calendrier.")
          setEvents([])
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [jardinierId, range])

  // Plage initiale = semaine en cours
  useEffect(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1, locale: fr })
    const from = startOfDay(weekStart)
    const to = endOfDay(new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000))
    setRange({ from, to })
  }, [])

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow-md">
      <h2 className="text-xl font-bold text-green-700 mb-4">Créneaux disponibles</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={['month', 'week', 'day']}
        onRangeChange={handleRangeChange}
        onSelectEvent={setSelectedEvent}
        eventPropGetter={(event) => {
          if (event.type === 'dispo') {
            return {
              style: {
                backgroundColor: '#e3107d',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                padding: '2px 4px',
              },
            }
          }
          return {}
        }}
        messages={{
          next: 'Suivant',
          previous: 'Précédent',
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
      />

      {loading && <p className="mt-3 text-sm text-gray-500">Chargement…</p>}
      {!loading && error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">Aucun créneau trouvé.</p>
      )}

      {selectedEvent && (
        <div className="mt-5 p-4 border rounded bg-pink-50 text-gray-800">
          <p>
            Disponible de <strong>{format(selectedEvent.start, 'HH:mm')}</strong> à{' '}
            <strong>{format(selectedEvent.end, 'HH:mm')}</strong>
          </p>
          <button
            disabled={!isConnected}
            className={`mt-3 px-4 py-2 rounded ${
              isConnected
                ? 'bg-[#e3107d] text-white hover:bg-pink-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={() => {
              if (!isConnected) return
              const startDate = format(selectedEvent.start, 'yyyy-MM-dd')
              const startTime = format(selectedEvent.start, 'HH:mm')
              const endDate = format(selectedEvent.end, 'yyyy-MM-dd')
              const endTime = format(selectedEvent.end, 'HH:mm')
              window.location.href = `/confirmation_reservation_jardiniers?jardinierId=${jardinierId}&startDate=${startDate}&startTime=${startTime}&endDate=${endDate}&endTime=${endTime}`
            }}
          >
            Réserver
          </button>

          {!isConnected && (
            <p className="mt-2 text-sm text-gray-600">
              Vous devez être connecté pour réserver ce créneau.{' '}
              <a href="/connexion" className="text-[#e3107d] underline">
                Cliquez ici pour vous connecter
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
