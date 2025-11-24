// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = Number(process.env.PORT) || 5001;

/* ====== Trust proxy ====== */
app.set('trust proxy', 1);

/* ====== CORS (credentials) ====== */
const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));

/* ====== Body & Cookies ====== */
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

/* ====== Logger simple ====== */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* ====== Imports routes ====== */
const connexionRoutes                     = require('./routes/connexion');
const inscriptionRoutes                    = require('./routes/inscription');
const jardiniersRoutes                     = require('./routes/jardiniers');
const reservationJardinierRoutes           = require('./routes/reservation_jardiniers');
const favorisRoutes                        = require('./routes/favoris');
const confirmationReservationRoutes        = require('./routes/confirmation_reservation_jardins');
const validationReservationJardinierRoutes = require('./routes/validation_reservation_jardiniers');
const annulationReservationRoutes          = require('./routes/annulation_reservation_jardinier');
const ajoutJardinsRoutes                   = require('./routes/ajout_jardins'); // ✅ une seule fois
const competencesRoutes                    = require('./routes/competences');
const jardinsRoutes                        = require('./routes/jardins');
const reservationJardinRoutes              = require('./routes/reservation_jardins');
const ajoutJardinierRoutes = require("./routes/ajout_jardinier");
const messagerieRoutes = require("./routes/messagerie");
const reservationsRoutes = require("./routes/reservations");


/* ====== Pings/Diagnostics ====== */
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/jardins/__server_ping', (_req, res) => {
  res.json({ ok: true, from: 'server.js', route: '/api/jardins' });
});

/* ====== Mount routes ====== */
app.use('/api/connexion', connexionRoutes);
app.use('/api/inscription', inscriptionRoutes);
app.use('/api/jardiniers', jardiniersRoutes);
app.use('/api/reservation_jardiniers', reservationJardinierRoutes);
app.use('/api/favoris', favorisRoutes);
app.use('/api/confirmation_reservation_jardins', confirmationReservationRoutes);
app.use('/api/validation_reservation_jardiniers', validationReservationJardinierRoutes);
app.use('/api/annulation_reservation_jardinier', annulationReservationRoutes);
app.use('/api/ajout_jardins', ajoutJardinsRoutes); // ✅ monté une seule fois
app.use('/api/competences', competencesRoutes);
app.use('/api/jardins', jardinsRoutes);
app.use('/api/reservation_jardins', reservationJardinRoutes);
app.use("/api/jardiniers", ajoutJardinierRoutes);
app.use("/messagerie", /* ton middleware d'auth si tu en as un */ messagerieRoutes);
app.use("/api/reservations", reservationsRoutes);

/* ====== 404 ====== */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

/* ====== Error handler global ====== */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error', message: err?.message });
});

/* ====== Start ====== */
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});

module.exports = app;
