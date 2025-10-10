// backend/routes/annulation_reservation_jardinier.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// -------- POST /api/annulation_reservation_jardinier --------
// Annule une réservation et libère le créneau
router.post('/', async (req, res) => {
  const { reservationId, jardinierId } = req.body || {};

  if (!reservationId || !jardinierId) {
    return res.status(400).json({ success: false, error: 'Champs manquants' });
  }

  try {
    // Vérifier que la réservation existe
    const { rows: existing } = await pool.query(
      `SELECT id_reservation, statut 
       FROM public.reservation 
       WHERE id_reservation = $1 AND id_jardinier = $2`,
      [reservationId, jardinierId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Réservation introuvable' });
    }

    // Si déjà annulée
    if (existing[0].statut === 'annulee') {
      return res.json({ success: true, message: 'Déjà annulée', reservation: existing[0] });
    }

    // Annuler la réservation
    const sqlUpdate = `
      UPDATE public.reservation
      SET statut = 'annulee'
      WHERE id_reservation = $1
      RETURNING id_reservation, id_jardinier, date_reservation, statut;
    `;
    const { rows } = await pool.query(sqlUpdate, [reservationId]);

    return res.json({ 
      success: true, 
      message: 'Réservation annulée', 
      reservation: rows[0] 
    });
  } catch (e) {
    console.error('Erreur POST annulation_reservation_jardinier', e);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
