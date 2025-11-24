'use client'
import React from 'react'

/**
 * value: { q, type, ville, code_postal, statut, minSup, maxSup }
 * onChange: (next) => void
 * options: { types: string[], villes: string[], statuts: string[] }
 */
export default function FiltersBar({ value, onChange, options }) {
  const v = value || {}
  const opt = options || { types: [], villes: [], statuts: [] }

  const U = {
    wrap: { display:'grid', gap:10, gridTemplateColumns:'repeat(6,minmax(0,1fr))', alignItems:'center' },
    input: { height:40, padding:'8px 10px', border:'2px solid #6ec173', borderRadius:8 },
    select:{ height:40, padding:'8px 10px', border:'2px solid #6ec173', borderRadius:8 },
    btn:   { height:40, padding:'0 16px', borderRadius:8, border:'none', background:'#e3107d', color:'#fff', fontWeight:600, cursor:'pointer' }
  }

  const set = (k,val)=> onChange?.({ ...v, [k]: val })

  return (
    <section style={{border:'2px solid #6ec173', borderRadius:12, padding:14, background:'#fff', marginBottom:16}}>
      <div style={U.wrap}>
        <input style={U.input} placeholder="Recherche (titre/description)" value={v.q||''} onChange={e=>set('q',e.target.value)} />
        <select style={U.select} value={v.type||''} onChange={e=>set('type',e.target.value)}>
          <option value="">Type</option>
          {opt.types.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={U.select} value={v.ville||''} onChange={e=>set('ville',e.target.value)}>
          <option value="">Ville</option>
          {opt.villes.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={U.input} placeholder="Code postal" value={v.code_postal||''} onChange={e=>set('code_postal',e.target.value)} />
        <select style={U.select} value={v.statut||''} onChange={e=>set('statut',e.target.value)}>
          <option value="">Statut</option>
          {opt.statuts.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{display:'flex', gap:8}}>
          <input style={{...U.input, width:'50%'}} type="number" placeholder="Min m²" value={v.minSup||''} onChange={e=>set('minSup',e.target.value)} />
          <input style={{...U.input, width:'50%'}} type="number" placeholder="Max m²" value={v.maxSup||''} onChange={e=>set('maxSup',e.target.value)} />
        </div>
      </div>
      <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:12}}>
        <button type="button" style={{...U.btn, background:'#fff', color:'#021904', border:'2px solid #6ec173'}} onClick={()=>onChange?.({})}>Réinitialiser</button>
        <button type="button" style={U.btn} onClick={()=>onChange?.({...v})}>Rechercher</button>
      </div>
    </section>
  )
}
