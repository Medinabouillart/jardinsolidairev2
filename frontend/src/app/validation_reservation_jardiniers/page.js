'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function ValidationReservationJardinierPage() {
  const params = useSearchParams()
  const jardinierId = params.get('jardinierId') || ''
  const reservationId = params.get('reservationId') || ''

  const [cancelled, setCancelled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Si la page est rechargée après annulation, on peut lire l'état via l'URL si tu veux (optionnel)
    // Ici, on reste simple : on affiche "validée" par défaut, et on passe à "annulée" après le POST.
  }, [])

  const goCancel = async () => {
    if (!reservationId || !jardinierId) {
      alert("Paramètres manquants pour l'annulation.")
      return
    }
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5001/api/annulation_reservation_jardinier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, jardinierId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || "Échec de l'annulation.")
        return
      }
      setCancelled(true)
    } catch (e) {
      console.error('Annulation échouée :', e)
      alert("Impossible d'annuler la réservation pour le moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 px-[10%] pt-24 pb-16 space-y-8">
        {/* Message principal */}
        <div className="rounded-2xl border bg-white p-6 text-gray-800">
          {cancelled ? (
            <>
              <p className="text-lg font-semibold mb-2">
                Votre réservation a bien été annulée ✅
              </p>
              <p className="leading-relaxed">
                Le créneau redevient disponible dans le calendrier du jardinier.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold mb-2">
                Votre réservation a bien été validée ✅
              </p>
              <p className="leading-relaxed">
                Retrouvez toutes vos réservations dans{' '}
                <Link
                  href="/profil?tab=reservations"
                  className="font-medium underline text-[#e3107d] hover:opacity-80"
                >
                  Mes réservations
                </Link>.
              </p>
            </>
          )}
        </div>

        {/* Boutons actions */}
        <div className="flex flex-wrap gap-3">
          {!cancelled ? (
            <button
              type="button"
              onClick={goCancel}
              disabled={loading}
              className={`rounded-full ${loading ? 'bg-pink-300' : 'bg-[#e3107d] hover:bg-pink-800'} text-white font-medium px-5 py-2 transition`}
            >
              {loading ? 'Annulation…' : 'Annuler ma réservation'}
            </button>
          ) : null}

          <Link
            href="/jardiniers"
            className="rounded-full bg-[#e3107d] hover:bg-pink-800 text-white font-medium px-5 py-2 transition inline-flex items-center"
          >
            Retourner consulter les jardiniers
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
