/**
 * @jest-environment jsdom
 */

import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import CalendrierBloc from '../src/components/reservation_jardin/CalendrierBloc'

// Mock de date-fns/format pour éviter les erreurs d'import ESM en test
jest.mock('date-fns/format', () => {
  return (date, fmt) => '14:00'
})

// Mock de react-big-calendar (localizer + Calendar)
jest.mock('react-big-calendar', () => ({
  dateFnsLocalizer: () => ({}),
  Calendar: ({ onSelectEvent }) => (
    <button
      onClick={() =>
        onSelectEvent({
          start: new Date('2025-01-10T14:00:00'),
          end: new Date('2025-01-10T16:00:00'),
        })
      }
    >
      fake calendar
    </button>
  ),
}))

beforeEach(() => {
  // On mock fetch pour ne pas faire de vrais appels API
  global.fetch = jest.fn((url) => {
    if (url.includes('/disponibilites')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { start: '2025-01-10T14:00:00', end: '2025-01-10T16:00:00' },
        ],
      })
    }
    if (url.includes('/occupied')) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      })
    }
    return Promise.resolve({ ok: true, json: async () => [] })
  })

  localStorage.clear()
  document.cookie = ''
})

afterEach(() => {
  jest.resetAllMocks()
  cleanup()
})

test('le bouton "Réserver" est désactivé quand l’utilisateur N’EST PAS connecté', async () => {
  render(<CalendrierBloc idJardin={1} />)

  // On simule un clic sur un créneau via le "fake calendar"
  fireEvent.click(screen.getByText(/fake calendar/i))

  // On récupère le bouton "Réserver"
  const button = await screen.findByRole('button', { name: /réserver/i })

  // Il doit être désactivé
  expect(button).toBeDisabled()
})

test('le bouton "Réserver" est activé quand l’utilisateur est connecté', async () => {
  // On simule un utilisateur connecté grâce à un token
  localStorage.setItem('token', 'fake-token')

  render(<CalendrierBloc idJardin={1} />)

  // On simule un clic sur un créneau
  fireEvent.click(screen.getByText(/fake calendar/i))

  const button = await screen.findByRole('button', { name: /réserver/i })

  // Cette fois il doit être cliquable
  expect(button).not.toBeDisabled()
})
