'use client'

import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import fr from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

export default function CalendrierBloc({ idJardin, titre = 'Créneaux disponibles' }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const raw = localStorage.getItem('utilisateur') || localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      const hasCookie = /(?:^|;\s*)(jwt|token|auth|session)=/.test(document.cookie)
      const hasUserId = !!(u && (u.id_utilisateur || u.id))
      setIsConnected(Boolean(token || hasCookie || hasUserId))
    } catch { setIsConnected(false) }
  }, [])

  useEffect(() => {
    if (!idJardin) return
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true); setError('')
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '')

        // 🔹 1. Récupère toutes les disponibilités
        const res = await fetch(`${base}/api/reservation_jardins/${encodeURIComponent(idJardin)}/disponibilites`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        // 🔹 2. Récupère les créneaux déjà réservés
        const occRes = await fetch(`${base}/api/reservation_jardins/occupied?jardinId=${idJardin}`, { signal: controller.signal })
        const occupied = occRes.ok ? await occRes.json() : []

        // 🔹 3. Filtre les disponibilités pour retirer les créneaux déjà pris
        const isOverlapping = (a, b) => a.start < b.end && a.end > b.start
        const occupiedIntervals = occupied.map(o => ({
          start: new Date(o.start),
          end: new Date(o.end),
        }))

        const filtered = Array.isArray(data)
          ? data.filter(d => {
              const start = new Date(d.start)
              const end = new Date(d.end)
              return !occupiedIntervals.some(o => isOverlapping({ start, end }, o))
            })
          : []

        // 🔹 4. Formate les créneaux restants
        const evts = filtered.map(d => ({
          id: `dispo-${d.id_dispo ?? `${d.start}-${d.end}`}`,
          title: `${format(new Date(d.start), 'HH:mm')} - ${format(new Date(d.end), 'HH:mm')}`,
          start: new Date(d.start),
          end: new Date(d.end),
          allDay: false,
          type: 'dispo',
        }))

        setEvents(evts)
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError("Impossible de charger le calendrier.")
          setEvents([])
        }
      } finally { setLoading(false) }
    })()
    return () => controller.abort()
  }, [idJardin])

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded shadow-md">
      <h2 className="text-xl font-bold text-green-700 mb-4">{titre}</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={['month', 'week', 'day']}
        onSelectEvent={setSelectedEvent}
        eventPropGetter={event =>
          event.type === 'dispo'
            ? { style: { backgroundColor: '#e3107d', color: 'white', borderRadius: '6px', border: 'none', padding: '2px 4px' } }
            : {}
        }
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
        <p className="mt-3 text-sm text-gray-600">Aucun créneau disponible.</p>
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
              const endDate   = format(selectedEvent.end, 'yyyy-MM-dd')
              const endTime   = format(selectedEvent.end, 'HH:mm')
              window.location.href =
                `/confirmation_reservation_jardins?jardinId=${idJardin}` +
                `&startDate=${startDate}&startTime=${startTime}&endDate=${endDate}&endTime=${endTime}`
            }}
          >
            Réserver
          </button>

          {!isConnected && (
            <p className="mt-2 text-sm text-gray-600">
              Vous devez être connecté pour réserver ce créneau.{' '}
              <a href="/connexion" className="text-[#e3107d] underline">Cliquez ici pour vous connecter</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
