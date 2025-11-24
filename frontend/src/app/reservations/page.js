"use client"

import { useEffect, useMemo, useState } from "react"
import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001"

export default function PageReservations() {
  const [futureReservations, setFutureReservations] = useState([])
  const [pastReservations, setPastReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    try {
      const raw =
        (typeof window !== "undefined" &&
          (localStorage.getItem("utilisateur") ||
            localStorage.getItem("user"))) ||
        null

      if (!raw) {
        setHasUser(false)
        setLoading(false)
        return
      }

      const u = JSON.parse(raw)
      const userId = u.id_utilisateur || u.id

      if (!userId) {
        setHasUser(false)
        setLoading(false)
        return
      }

      setHasUser(true)

      ;(async () => {
        try {
          setLoading(true)
          setError(null)

          const url = `${API_BASE}/api/reservations?userId=${userId}`
          console.log("[Mes réservations] fetch =", url)

          const res = await fetch(url)

          if (!res.ok) {
            console.error("[Mes réservations] HTTP status =", res.status)
            throw new Error(`HTTP ${res.status}`)
          }

          const data = await res.json()
          setFutureReservations(data.future || [])
          setPastReservations(data.past || [])
        } catch (e) {
          console.error("[Mes réservations] fetch error:", e)
          setError("Impossible de charger les réservations.")
        } finally {
          setLoading(false)
        }
      })()
    } catch (e) {
      console.error("[Mes réservations] localStorage error:", e)
      setHasUser(false)
      setLoading(false)
      setError("Erreur de récupération de l'utilisateur.")
    }
  }, [])

  const hasNoReservation = useMemo(
    () => futureReservations.length === 0 && pastReservations.length === 0,
    [futureReservations, pastReservations]
  )

  const handleGoToGardens = () => {
    window.location.href = "/jardins"
  }

  const handleOpenGarden = (idJardin) => {
    if (!idJardin) return
    window.location.href = `/reservation_jardin/${idJardin}`
  }

  const formatDate = (value) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ReservationCard = ({ resa, isPast = false }) => {
    // si plus tard l’API renvoie une url de photo (ex: resa.photo_url), tu pourras la plugger ici
    const photoUrl =
      resa.photoUrl ||
      "/images/jardin-placeholder.jpg" // mets un vrai fichier si tu veux

    return (
      <article
        onClick={() => handleOpenGarden(resa.idJardin)}
        className={`group cursor-pointer rounded-2xl bg-white border ${
          isPast ? "border-gray-200" : "border-green-200"
        } shadow-sm p-4 flex flex-col justify-between min-h-[140px] transition-transform hover:-translate-y-1 hover:shadow-md`}
      >
        {/* Image + titre */}
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={photoUrl}
              alt={resa.titre}
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback si l'image n'existe pas
                e.target.style.display = "none"
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2">
              {resa.titre}
            </h3>
            <p className="text-sm text-gray-600">
              {resa.lieu || "Adresse communiquée après confirmation"}
            </p>
          </div>
        </div>

        {/* Date + statut */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <p className={`text-gray-700 ${isPast ? "line-through" : ""}`}>
            {formatDate(resa.start)} → {formatDate(resa.end)}
          </p>
          {resa.statut && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isPast
                  ? "bg-gray-100 text-gray-600"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isPast ? "Passée" : resa.statut}
            </span>
          )}
        </div>
      </article>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-10 pt-24 md:pt-32">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
          Mes réservations
        </h1>

        {/* Pas connecté */}
        {!hasUser && !loading && (
          <div className="mb-10 rounded-2xl border border-gray-300 bg-white px-4 py-5 md:px-8 md:py-6 shadow-sm text-center">
            <p className="text-gray-800 mb-3">
              Connecte-toi pour voir tes réservations.
            </p>
            <button
              type="button"
              onClick={() => (window.location.href = "/connexion")}
              className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              Me connecter
            </button>
          </div>
        )}

        {loading && (
          <p className="text-sm text-gray-500 mb-6">
            Chargement…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 mb-6">
            {error}
          </p>
        )}

        {/* Aucune réservation */}
        {hasUser && !loading && !error && hasNoReservation && (
          <div className="mb-10 rounded-2xl border border-gray-300 bg-white px-4 py-5 md:px-8 md:py-6 shadow-sm flex flex-col items-center text-center">
            <p className="text-gray-800 mb-3">
              Pas de réservation pour le moment, découvre les jardins
              disponibles 🌿
            </p>
            <button
              type="button"
              onClick={handleGoToGardens}
              className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              Voir les jardins
            </button>
          </div>
        )}

        {/* 🔹 Réservations à venir */}
        {hasUser && (
          <section className="mb-10">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Réservations à venir
            </h2>

            {futureReservations.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune réservation à venir pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {futureReservations.map((resa) => (
                  <ReservationCard key={resa.id} resa={resa} isPast={false} />
                ))}
              </div>
            )}
          </section>
        )}

        <hr className="border-gray-300 mb-8" />

        {/* 🔹 Réservations passées */}
        {hasUser && (
          <section className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Réservations passées
            </h2>

            {pastReservations.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune réservation passée pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pastReservations.map((resa) => (
                  <ReservationCard key={resa.id} resa={resa} isPast={true} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
