// server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 5001

// Middlewares
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Routes (vérifie bien les noms exacts des fichiers dans /routes)
const connexionRoutes                     = require('./routes/connexion')
const inscriptionRoutes                    = require('./routes/inscription')
const jardiniersRoutes                     = require('./routes/jardiniers')
const reservationJardinierRoutes           = require('./routes/reservation_jardiniers')
const favorisRoutes                        = require('./routes/favoris')
const confirmationReservationRoutes        = require('./routes/confirmation_reservation_jardiniers')
const validationReservationJardinierRoutes = require('./routes/validation_reservation_jardiniers')
const annulationReservationRoutes = require('./routes/annulation_reservation_jardinier')

// Mount
app.use('/api/connexion', connexionRoutes)
app.use('/api/inscription', inscriptionRoutes)
app.use('/api/jardiniers', jardiniersRoutes)
app.use('/api/reservation_jardiniers', reservationJardinierRoutes)
app.use('/api/favoris', favorisRoutes)
app.use('/api/confirmation_reservation_jardiniers', confirmationReservationRoutes)
app.use('/api/validation_reservation_jardiniers', validationReservationJardinierRoutes)
app.use('/api/annulation_reservation_jardinier', annulationReservationRoutes)

// Healthcheck
app.get('/health', (_, res) => res.json({ ok: true }))

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`)
})

module.exports = app
