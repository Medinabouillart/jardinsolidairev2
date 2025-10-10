export default function DescriptionBloc({ biographie }) {
  return (
    <section className="p-5 rounded-2xl shadow bg-white text-gray-800">
      <h2 className="text-xl font-semibold mb-3">À propos</h2>
      <p className="leading-relaxed whitespace-pre-line">
        {biographie && biographie.trim() !== '' ? biographie : 'Pas encore de description.'}
      </p>
    </section>
  )
}
