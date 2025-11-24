export default function GardenInfoCard({ garden, onReserve }) {
  const loading = !garden
  const name =
    (garden && (garden.nom || garden.titre || garden.name)) || '—'
  const location =
    (garden?.ville && garden?.code_postal
      ? `${garden.ville} ${garden.code_postal}`
      : garden?.ville) ||
    garden?.adresse ||
    'Localisation non renseignée'
  const desc = garden?.description || 'Pas encore de description.'
  const photo = garden?.photo_couverture || garden?.photo || null

  return (
    <aside className="rounded-2xl border p-4 bg-white dark:bg-zinc-800 dark:text-zinc-100 text-gray-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden border">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
              photo
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{loading ? 'Chargement…' : name}</p>
          <p className="text-sm text-gray-600 dark:text-zinc-300">
            {loading ? '—' : location}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-zinc-200 mb-4">
        {loading ? 'Chargement…' : desc}
      </p>

      <button
        type="button"
        onClick={onReserve}
        disabled={loading}
        className="w-full rounded-full px-5 py-3 bg-[#e3107d] text-white font-semibold hover:bg-pink-700 transition disabled:opacity-60"
      >
        Confirmer la réservation
      </button>
    </aside>
  )
}
