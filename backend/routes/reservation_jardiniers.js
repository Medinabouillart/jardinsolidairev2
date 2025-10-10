// routes/reservation_jardiniers.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helpers
function toTz(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return new Date(dateStr);
  return new Date(`${dateStr}T${timeStr}:00`);
}
function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

// Vérifie que le jardinier existe et est public/posté
async function fetchGardener(id) {
  const sql = `
    SELECT
      id_utilisateur, prenom, nom, biographie, telephone, adresse,
      note_moyenne, photo_profil, ville, code_postal, latitude, longitude,
      visibility, is_posted,
      date_part('year', age(current_date, date_naissance))::int AS age
    FROM public.utilisateur
    WHERE id_utilisateur = $1
      AND role = 'ami_du_vert'
      AND is_posted = TRUE
      AND (visibility = 'public' OR visibility IS NULL)
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}

// -------- GET /:id -> profil --------
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id invalide' });
  }
  try {
    const profil = await fetchGardener(id);
    if (!profil) return res.status(404).json({ error: 'Profil introuvable' });
    res.json({ ...profil, competences: [] });
  } catch (e) {
    console.error('Erreur /reservation_jardiniers/:id', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------- GET /:id/disponibilites --------
router.get('/:id/disponibilites', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id invalide' });
  }

  const from = req.query.from ? new Date(req.query.from) : new Date();
  const to = req.query.to ? new Date(req.query.to) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const gard = await fetchGardener(id);
    if (!gard) return res.status(404).json({ error: 'Profil introuvable' });

    // Dispos fixes du jardinier
    const sql = `
      SELECT d.id_dispo,
             d.jour_semaine,
             d.heure_debut,
             d.heure_fin,
             d.actif
      FROM public.disponibilite_jardinier d
      WHERE d.id_utilisateur = $1
        AND d.actif = TRUE
      ORDER BY d.jour_semaine, d.heure_debut;
    `;
    const { rows: dispos } = await pool.query(sql, [id]);

    // Réservations actives (seules pending/confirmee bloquent)
    const sqlRes = `
      SELECT date_reservation
      FROM public.reservation
      WHERE id_jardinier = $1
        AND statut IN ('pending','confirmee')
    `;
    const { rows: reservations } = await pool.query(sqlRes, [id]);
    const reservedSet = new Set(reservations.map(r => new Date(r.date_reservation).getTime()));

    const results = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=lundi ... 7=dimanche
      for (const dispo of dispos) {
        if (dispo.jour_semaine === dayOfWeek) {
          const start = new Date(d);
          const end = new Date(d);

          const [sh, sm] = dispo.heure_debut.split(':');
          const [eh, em] = dispo.heure_fin.split(':');
          start.setHours(Number(sh), Number(sm), 0, 0);
          end.setHours(Number(eh), Number(em), 0, 0);

          // Bloque uniquement si réservé (pending/confirmee)
          if (!reservedSet.has(start.getTime())) {
            results.push({
              id_dispo: dispo.id_dispo,
              start: start.toISOString(),
              end: end.toISOString(),
            });
          }
        }
      }
    }

    res.json(results);
  } catch (e) {
    console.error('Erreur GET disponibilites', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// -------- POST /:id/disponibilites --------
router.post('/:id/disponibilites', async (req, res) => {
  const id = Number(req.params.id || 0);
  const { jour_semaine, heure_debut, heure_fin } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id invalide' });
  }
  if (!jour_semaine || !heure_debut || !heure_fin) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    const sql = `
      INSERT INTO public.disponibilite_jardinier
        (id_utilisateur, jour_semaine, heure_debut, heure_fin, actif)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id_dispo, jour_semaine, heure_debut::text, heure_fin::text, actif;
    `;
    const { rows } = await pool.query(sql, [id, jour_semaine, heure_debut, heure_fin]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST disponibilite', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
