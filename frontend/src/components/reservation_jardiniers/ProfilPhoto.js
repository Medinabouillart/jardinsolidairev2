'use client'

/**
 * ProfilPhoto
 * - Aucune donnée en dur : tout vient des props
 * - Fallback image si photo manquante
 * - Badge rôle personnalisable, et indicateur "Privé" si visibility === 'dm_only'
 * - Sous-titre optionnel: ville, note, âge (affichés uniquement si fournis)
 */
export default function ProfilPhoto({
  photoUrl,
  prenom,
  nom,
  nomComplet,           // optionnel: si déjà composé côté parent
  roleLabel = 'Jardinier',
  visibility,           // 'public' | 'dm_only' | ...
  ville,
  note,                 // note moyenne
  age,                  // âge en années
}) {
  const src = photoUrl || '/assets/default-avatar.jpg'
  const fullName =
    (nomComplet && nomComplet.trim()) ||
    [prenom, nom].filter(Boolean).join(' ').trim() ||
    'Profil'

  const metaBits = [
    ville ? `📍 ${ville}` : null,
    typeof note === 'number' ? `★ ${note}` : null,
    typeof age === 'number' ? `Âge ${age}` : null,
  ].filter(Boolean)

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <img
          src={src}
          alt={`Photo de ${fullName}`}
          className="w-20 h-20 rounded-full object-cover border-4 border-[#e3107d] shadow"
          loading="lazy"
        />
        {visibility === 'dm_only' && (
          <span className="absolute -bottom-2 -right-2 rounded-full border bg-white text-xs px-2 py-0.5 shadow">
            🔒 Privé
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xl font-semibold text-gray-900 truncate">{fullName}</p>

        {/* Badge rôle */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs bg-pink-50 text-[#e3107d] border border-pink-200 px-2 py-1 rounded-full">
            {roleLabel}
          </span>

          {/* Infos complémentaires si disponibles */}
          {metaBits.length > 0 && (
            <span className="text-sm text-gray-600 truncate">
              {metaBits.join(' • ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
