'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import ReservationEditor from '../../components/confirmation_reservation_jardiniers/ReservationEditor'
import AuthButtons from '../../components/confirmation_reservation_jardiniers/AuthButtons'
import GardenerInfoCard from '../../components/confirmation_reservation_jardiniers/GardenerInfoCard'

export default function ReservationPage() {
  const [start, setStart] = useState({ date: '', time: '' })
  const [end, setEnd] = useState({ date: '', time: '' })
  const [isAuth, setIsAuth] = useState(false)
  const [gardener, setGardener] = useState(null)
  const [commentaire, setCommentaire] = useState('')

  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const sd = params.get('startDate')
    const st = params.get('startTime')
    const ed = params.get('endDate')
    const et = params.get('endTime')

    if (sd && st && ed && et) {
      setStart({ date: sd, time: st })
      setEnd({ date: ed, time: et })
    } else {
      const today = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const d = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      const t1 = `${pad(Math.max(8, today.getHours()))}:00`
      const t2 = `${pad(Math.max(9, today.getHours() + 1))}:00`
      setStart({ date: d, time: t1 })
      setEnd({ date: d, time: t2 })
    }

    setIsAuth(
      localStorage.getItem('user_auth') === 'true' ||
      !!localStorage.getItem('token') ||
      !!localStorage.getItem('utilisateur') ||
      !!localStorage.getItem('user')
    )

    const gid = params.get('jardinierId')
    if (gid) {
      fetch(`http://localhost:5001/api/reservation_jardiniers/${gid}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setGardener(data))
        .catch(() => {})
    }
  }, [params])

  const handleEditorChange = ({ start: s = start, end: e = end }) => {
    setStart(s); setEnd(e)
  }

  const handleReserve = async () => {
    if (!isAuth) {
      router.push('/connexion')
      return
    }

    const gid = params.get('jardinierId') || ''
    const storedUser = localStorage.getItem('user') || localStorage.getItem('utilisateur')
    if (!storedUser) {
      alert('Utilisateur non identifié.')
      return
    }

    const userObj = JSON.parse(storedUser)
    const proprietaireId = userObj.id_utilisateur || userObj.id

    try {
      const response = await fetch('http://localhost:5001/api/confirmation_reservation_jardiniers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proprietaireId,
          jardinierId: gid,
          startDate: start.date,
          startTime: start.time,
          commentaires: commentaire
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        // Récupère l'ID de réservation renvoyé par l'API
        const reservationId = data?.reservation?.id_reservation

        // Construit l’URL de validation avec reservationId (important pour l’annulation ensuite)
        const url =
          `/validation_reservation_jardiniers?jardinierId=${encodeURIComponent(gid)}` +
          `&reservationId=${encodeURIComponent(reservationId ?? '')}` +
          `&startDate=${encodeURIComponent(start.date)}` +
          `&startTime=${encodeURIComponent(start.time)}` +
          `&endDate=${encodeURIComponent(end.date)}` +
          `&endTime=${encodeURIComponent(end.time)}` +
          `&commentaire=${encodeURIComponent(commentaire)}`

        console.log('🔎 Redirection vers :', url)
        router.push(url)
      } else {
        alert(data.error || 'Erreur lors de la réservation')
      }
    } catch (err) {
      console.error('Erreur réseau :', err)
      alert('Impossible de réserver, problème serveur.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 px-[10%] pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* GAUCHE 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <ReservationEditor start={start} end={end} onChange={handleEditorChange} />

            <div>
              <label className="block text-sm font-medium mb-2">
                Voulez-vous laisser un message au jardinier ?
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border px-3 py-2"
                placeholder="Ex: J’ai un grand potager, pensez à amener vos outils..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>

            {!isAuth && (
              <AuthButtons loginHref="/connexion" registerHref="/inscription" />
            )}
          </div>

          {/* DROITE 1/3 */}
          <div>
            <GardenerInfoCard gardener={gardener} onReserve={handleReserve} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
