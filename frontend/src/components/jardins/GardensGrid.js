'use client'
import React from 'react'
import GardenCard from './GardenCard'

export default function GardensGrid({ items=[] }) {
  return (
    <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
      {items.map(it => <GardenCard key={it.id_jardin ?? it.id} item={it} />)}
    </div>
  )
}
