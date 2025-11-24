'use client'
import React from 'react'

export default function ResultsCount({ count=0, onReset }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'8px 0 16px'}}>
      <strong aria-live="polite">{count} jardin{count>1?'s':''} trouvé{count>1?'s':''}</strong>
      <button type="button" onClick={onReset}
        style={{background:'#fff', color:'#021904', border:'2px solid #6ec173', borderRadius:8, padding:'6px 10px', cursor:'pointer'}}>
        Réinitialiser
      </button>
    </div>
  )
}
