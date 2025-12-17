import { Suspense } from 'react'
import ConfirmationReservationJardinsClient from './ConfirmationReservationJardinsClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <ConfirmationReservationJardinsClient />
    </Suspense>
  )
}
