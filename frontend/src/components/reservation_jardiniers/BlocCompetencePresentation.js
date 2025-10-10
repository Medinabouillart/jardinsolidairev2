'use client'
import React, { useEffect, useState } from 'react'

export default function BlocCompetencePresentation({ jardinier, jardinierId }) {
  const [data, setData] = useState(jardinier ?? null)
  const [loading, setLoading] = useState(!jardinier && !!jardinierId)
  const [error, setError] = useState('')

  useEffect(() => {
    // Si la page nous passe déjà le jardinier, on l'utilise directement
    if (jardinier) {
      setData(jardinier)
      setLoading(false)
      setError('')
      return
    }
    // Sinon, on peut charger via l'id
    if (!jardinierId) return

    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`http://localhost:5001/api/jardiniers/${jardinierId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (alive) setData(json)
      } catch (e) {
        if (alive) setError('Erreur chargement jardinier.')
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [jardinier, jardinierId])

  if (loading) return <div className="p-4 rounded-lg bg-white border">Chargement…</div>
  if (error) return <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>
  if (!data) return null

  const skills = Array.isArray(data.competences) ? data.competences : []

  return (
    <div className="bg-green-50 p-4 rounded-lg shadow-sm w-full">
      <h2 className="text-xl font-semibold text-green-900 mb-2">Liste des compétences</h2>
      <ul className="list-disc list-inside text-green-800 mb-4">
        {skills.length > 0 ? (
          skills.map((comp, i) => (
            <li key={i}>{typeof comp === 'string' ? comp : comp?.nom}</li>
          ))
        ) : (
          <li>Aucune compétence renseignée.</li>
        )}
      </ul>

      <h2 className="text-xl font-semibold text-green-900 mb-2">Informations du jardinier</h2>
      <p className="text-green-800 whitespace-pre-line">
        {data.biographie || 'Non renseigné.'}
      </p>
    </div>
  )
}
