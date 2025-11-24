'use client'
import React from 'react'

export default function LoadingSkeleton({ cards = 8 }) {
  const Sk = () => (
    <div style={{background:'#fff', border:'2px solid #6ec173', borderRadius:12, overflow:'hidden'}}>
      <div style={{height:160, background:'#e7f6ea'}}/>
      <div style={{padding:14}}>
        <div style={{height:16, background:'#e7f6ea', borderRadius:6, width:'60%', marginBottom:10}}/>
        <div style={{height:12, background:'#e7f6ea', borderRadius:6, width:'90%', marginBottom:6}}/>
        <div style={{height:12, background:'#e7f6ea', borderRadius:6, width:'80%'}}/>
      </div>
    </div>
  )
  return (
    <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
      {Array.from({length: cards}).map((_,i)=><Sk key={i}/>)}
    </div>
  )
}
