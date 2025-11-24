'use client'
import React from 'react'

export default function EmptyState({ message='Aucun jardin trouvé.' }) {
  return (
    <div style={{textAlign:'center', padding:'20px 10px', color:'#021904', background:'#fff', border:'2px solid #6ec173', borderRadius:12}}>
      {message}
    </div>
  )
}
