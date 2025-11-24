'use client'
export default function DescriptionBloc({ titre = 'À propos', description = '' }) {
  const txt = (description || '').trim()
  return (
    <section className="p-5 rounded-2xl shadow bg-white text-gray-800">
      <h2 className="text-xl font-semibold mb-3">{titre}</h2>
      <p className="leading-relaxed whitespace-pre-line">
        {txt !== '' ? txt : 'Pas encore de description.'}
      </p>
    </section>
  )
}
