export default function GardenerInfoCard({ gardener }) {
  if (!gardener) {
    return (
      <aside className="rounded-2xl border p-4 bg-white text-gray-800">
        <p className="text-sm text-gray-600">Chargement du jardinier...</p>
      </aside>
    )
  }

  const displayName = [gardener.prenom, gardener.nom].filter(Boolean).join(' ') || '—'
  const location =
    gardener.ville ||
    gardener.adresse ||
    (gardener.code_postal ? `CP ${gardener.code_postal}` : '') ||
    'Localisation non renseignée'
  const bio = gardener.biographie || 'Pas encore de description.'
  const photo = gardener.photo_profil || null

  return (
    <aside className="rounded-2xl border p-4 bg-white text-gray-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden border">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
              photo
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="text-sm text-gray-600">{location}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700">{bio}</p>
    </aside>
  )
}
