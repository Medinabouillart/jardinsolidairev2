// backend/routes/confirmation_reservation_jardiniers.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper → construit une Date depuis date + time
function toDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// -------- POST /api/confirmation_reservation_jardiniers --------
// Confirme une réservation
router.post('/', async (req, res) => {
  const { proprietaireId, jardinierId, startDate, startTime, commentaires } = req.body || {};

  if (!proprietaireId || !jardinierId || !startDate || !startTime) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const startAt = toDate(startDate, startTime);

  try {
    // 1. Vérifier que le jardinier existe et est actif
    const sqlGard = `
      SELECT id_utilisateur
      FROM public.utilisateur
      WHERE id_utilisateur = $1
        AND role = 'ami_du_vert'
        AND is_posted = TRUE
      LIMIT 1;
    `;
    const { rows: gard } = await pool.query(sqlGard, [jardinierId]);
    if (gard.length === 0) {
      return res.status(404).json({ error: 'Jardinier introuvable' });
    }

    // 2. Vérifier que le créneau fait partie de ses disponibilités
    const sqlDispo = `
      SELECT 1
      FROM public.disponibilite_jardinier
      WHERE id_utilisateur = $1
        AND jour_semaine = extract(isodow from $2::timestamp)::int
        AND heure_debut <= (($2::timestamp)::time)
        AND heure_fin   >  (($2::timestamp)::time)
        AND actif = TRUE
      LIMIT 1;
    `;
    const { rows: dispo } = await pool.query(sqlDispo, [jardinierId, startAt]);
    if (dispo.length === 0) {
      return res.status(400).json({ error: 'Créneau non disponible' });
    }

    // 3. Vérifier que le créneau n’est pas déjà réservé (uniquement pending ou confirmée)
    const sqlCheck = `
      SELECT 1
      FROM public.reservation
      WHERE id_jardinier = $1
        AND date_reservation = $2::timestamp
        AND statut IN ('pending','confirmee')
      LIMIT 1;
    `;
    const { rows: exists } = await pool.query(sqlCheck, [jardinierId, startAt]);
    if (exists.length > 0) {
      return res.status(409).json({ error: 'Créneau déjà réservé' });
    }

    // 4. Insérer la réservation avec statut "confirmee"
    const sqlInsert = `
      INSERT INTO public.reservation
        (id_utilisateur, id_jardinier, date_reservation, statut, commentaires)
      VALUES ($1, $2, $3::timestamp, 'confirmee', $4)
      RETURNING id_reservation, id_utilisateur, id_jardinier, date_reservation, statut, commentaires;
    `;
    const { rows } = await pool.query(sqlInsert, [
      proprietaireId,
      jardinierId,
      startAt,
      commentaires || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Réservation confirmée',
      reservation: rows[0],
    });
  } catch (e) {
    console.error('Erreur POST confirmation_reservation_jardiniers', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
