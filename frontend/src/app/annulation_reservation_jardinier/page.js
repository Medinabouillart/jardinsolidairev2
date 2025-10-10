'use client'
import Link from 'next/link'
import Header from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'

export default function AnnulationReservationJardinierPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 px-[10%] pt-24 pb-16 space-y-8">
        {/* Message principal */}
        <div className="rounded-2xl border bg-white p-6 text-gray-800">
          <p className="text-lg font-semibold mb-2">
            Votre réservation a bien été annulée ❌
          </p>
          <p className="leading-relaxed">
            Vous pouvez consulter à nouveau la liste des jardiniers disponibles.
          </p>
        </div>

        {/* Bouton action */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/jardiniers"
            className="rounded-full bg-[#e3107d] hover:bg-pink-800 text-white font-medium px-5 py-2 transition inline-flex items-center"
          >
            Voir les jardiniers
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
