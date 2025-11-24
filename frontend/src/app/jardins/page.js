import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ListeJardins from "./index";

export default function Jardins() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-12 pb-10">
        <section className="px-3 md:px-4">
          <div className="mx-auto max-w-[1400px] rounded-xl border bg-gradient-to-b from-pink-50/50 to-white p-4 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-[#e3107d]">
                JardinSolidaire
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Explore les jardins disponibles
              </h1>
              <p className="max-w-2xl text-sm text-gray-600">
                Annonces publiques. Recherche par mots-clés, ville et type.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 px-3 md:px-4">
          <div className="mx-auto max-w-[1400px]">
            <ListeJardins />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
