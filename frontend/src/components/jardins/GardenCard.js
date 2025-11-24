'use client'
import React from 'react'

export default function GardenCard({ item }) {
  // 🔥 Normalisation de la photo (string OU objet)
  const raw = Array.isArray(item?.photos) && item.photos[0] ? item.photos[0] : null
  const photo =
    raw && typeof raw === 'object'
      ? raw.dataUrl || raw.url || ''
      : raw || ''

  const U = {
    card:{ background:'#fff', border:'2px solid #6ec173', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' },
    img:{ width:'100%', height:160, background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg, #6ec173, #e3107d)' },
    body:{ padding:14, color:'#021904' },
    h3:{ margin:0, marginBottom:8, fontSize:18 },
    badge:{ border:'1px solid #6ec173', padding:'2px 8px', borderRadius:999, fontSize:12 },
    meta:{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8, color:'#064e3b' },
    desc:{ fontSize:14, color:'#333' }
  }

  const desc = (item?.description||'').slice(0,180) + ((item?.description||'').length>180?'…':'')
  
  return (
    <article style={U.card}>
      <div style={U.img}/>
      <div style={U.body}>
        <h3 style={U.h3}>{item?.titre || 'Jardin sans titre'}</h3>
        <div style={U.meta}>
          {item?.ville && <span style={U.badge}>{item.ville}{item.code_postal ? ` (${item.code_postal})` : ''}</span>}
          {item?.type && <span style={U.badge}>{item.type}</span>}
          {item?.superficie && <span style={U.badge}>{item.superficie} m²</span>}
          {item?.statut && <span style={U.badge}>{item.statut}</span>}
        </div>
        <p style={U.desc}>{desc || '—'}</p>
      </div>
    </article>
  )
}
