'use client'
import { useEffect, useMemo, useState } from 'react'

const FALLBACK_SKILLS = [
  'Tonte','Taille','Désherbage','Plantation',
  'Arrosage','Compost','Permaculture','Création potager',
]

export default function SkillsEditor({ allSkills, value, onChange, onSave }) {
  const options = useMemo(
    () => (allSkills && allSkills.length ? allSkills : FALLBACK_SKILLS),
    [allSkills]
  )

  const [skills, setSkills] = useState(value ?? [])
  const [savedMsg, setSavedMsg] = useState('')
  const [q, setQ] = useState('')

  // Hydrate depuis localStorage si pas de value fournie
  useEffect(() => {
    if (value) return
    try {
      const raw = localStorage.getItem('user_skills')
      if (raw) setSkills(JSON.parse(raw))
    } catch {}
  }, [value])

  // Remontée au parent si onChange fourni
  useEffect(() => {
    if (onChange) onChange(skills)
  }, [skills, onChange])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? options.filter(label => label.toLowerCase().includes(s)) : options
  }, [q, options])

  const toggle = (label) => {
    setSkills(prev => (prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]))
  }

  const selectAll = () => setSkills([...new Set([...skills, ...filtered])])
  const clearAll = () => setSkills([])

  const save = async () => {
    try {
      if (onSave) {
        await onSave(skills)         // branchement API (optionnel)
      } else {
        localStorage.setItem('user_skills', JSON.stringify(skills)) // fallback offline
      }
      setSavedMsg('Compétences enregistrées ✅')
      setTimeout(() => setSavedMsg(''), 2500)
    } catch {
      setSavedMsg("Erreur d’enregistrement ❌")
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-6 text-gray-800 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mes compétences</h2>
          <p className="text-xs text-gray-500">Sélectionne ce que tu proposes. Tu peux chercher et cocher/décocher.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border px-4 py-2 text-sm transition hover:bg-gray-50"
            aria-label="Tout désélectionner"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-[#e3107d] hover:opacity-90 text-white px-4 py-2 text-sm transition shadow"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Barre outils */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une compétence…"
            className="w-full rounded-xl border px-3 py-2 pr-9 text-sm outline-none transition focus:ring-2 focus:ring-[#e3107d]"
          />
          <span className="pointer-events-none absolute right-3 top-2.5 text-gray-400">⌕</span>
        </div>

        <div className="text-xs text-gray-500">
          {skills.length} sélectionnée(s){q ? ` • ${filtered.length} résultat(s)` : ''}
        </div>
      </div>

      {/* Message sauvegarde */}
      {savedMsg && (
        <div className={`rounded-md border px-4 py-2 text-sm ${savedMsg.includes('✅')
          ? 'border-green-600 bg-green-50 text-green-700'
          : 'border-red-600 bg-red-50 text-red-700'
        }`}>
          {savedMsg}
        </div>
      )}

      {/* Grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((label) => {
          const checked = skills.includes(label)
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              aria-pressed={checked}
              className={[
                "group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-[#e3107d]",
                checked
                  ? "border-[#e3107d] bg-pink-50 text-[#e3107d] shadow-sm"
                  : "hover:border-[#e3107d]/40 hover:bg-pink-50"
              ].join(' ')}
            >
              <span className="truncate">{label}</span>
              <span
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition",
                  checked
                    ? "border-[#e3107d] bg-[#e3107d] text-white"
                    : "border-gray-300 bg-white text-gray-400 group-hover:border-[#e3107d]/50"
                ].join(' ')}
                aria-hidden
              >
                {checked ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Actions rapides */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-full border px-3 py-1.5 text-xs transition hover:bg-gray-50"
        >
          Tout sélectionner (filtré)
        </button>
        {q && <span className="text-xs text-gray-400">Filtre actif : “{q}”</span>}
      </div>
    </section>
  )
}
