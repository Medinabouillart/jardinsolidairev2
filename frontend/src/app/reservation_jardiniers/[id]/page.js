'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Header from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import ActionBar from '@/components/reservation_jardiniers/ActionBar'
import CalendrierBloc from '@/components/reservation_jardiniers/CalendrierBloc'
import CommentaireBloc from '@/components/reservation_jardiniers/CommentaireBloc'
import BoutonAvecConnexion from '@/components/reservation_jardiniers/BoutonAvecConnexion'

export default function PageJardinier() {
  const params = useParams()
  const id = params?.id?.toString() || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/reservation_jardiniers/${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (mounted) setData(json)
      } catch {
        if (mounted) setError('Impossible de charger ce profil.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) run()
    return () => { mounted = false }
  }, [id])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 px-[10%] pt-24 pb-10 space-y-8">
        {/* En-tête : avatar + nom + actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Image
              src={data?.photo_profil || '/assets/default-avatar.jpg'}
              alt={`${data?.prenom ?? ''} ${data?.nom ?? ''}`}
              width={120}
              height={120}
              unoptimized
              className="rounded-full object-cover border-2 border-[#e3107d]"
            />
            <div>
              <h1 className="text-2xl font-bold">
                {loading ? 'Chargement…' : `${data?.prenom ?? ''} ${data?.nom ?? ''}`}
              </h1>
              <p className="mt-1 text-sm text-gray-700 flex flex-wrap items-center gap-2">
                <span>
                  {loading ? '—' : (data?.ville || data?.adresse || 'Ville n/r')}
                  {data?.code_postal ? ` (${data.code_postal})` : ''}
                </span>
                {data?.note_moyenne != null && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-amber-500" aria-hidden>⭐</span>
                    <span className="text-gray-800">{data.note_moyenne}</span>
                  </span>
                )}
                {data?.age && <span>• Âge {data.age}</span>}
              </p>
            </div>
          </div>
          {id && <ActionBar jardinierId={id} />}
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-3">{error}</div>
        )}

        {/* 2 colonnes : gauche (À propos + compétences + bouton) / droite (calendrier) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Bloc infos → gauche */}
          <div className="lg:col-span-4 order-1 space-y-4">
            <section className="p-5 rounded-2xl shadow bg-white text-gray-800 min-h-[560px]">
              <h2 className="text-xl font-semibold mb-3">À propos</h2>
              <p className="leading-relaxed">
                {data?.biographie || (loading ? 'Chargement…' : 'Pas encore de description.')}
              </p>

              <hr className="my-5" />

              <h3 className="text-lg font-semibold mb-2">Compétences</h3>
              {Array.isArray(data?.competences) && data.competences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.competences.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[12px] text-[#e3107d]"
                    >
                      {c?.nom || c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">{loading ? 'Chargement…' : 'Aucune compétence renseignée.'}</p>
              )}
            </section>

            {id && <BoutonAvecConnexion jardinierId={id} />}
          </div>

          {/* Calendrier → droite */}
          <div className="lg:col-span-8 order-2">
            {id && <CalendrierBloc jardinierId={id} />}
          </div>
        </div>

        {id && <CommentaireBloc jardinierId={id} />}
      </main>

      <Footer />
    </div>
  )
}
