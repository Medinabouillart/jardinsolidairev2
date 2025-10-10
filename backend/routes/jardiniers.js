// routes/jardiniers.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Construit WHERE dynamique (CP strict si fourni)
function buildWhere({ search, note, type, cp }) {
  const clauses = [
    `role = 'ami_du_vert'`,
    `is_posted = TRUE`,
    `visibility = 'public'`,
    `NOT (lower(prenom) = 'mahalia' AND lower(nom) = 'bouillart')`
  ];
  const values = [];
  let i = 1;

  if (search) {
    clauses.push(`(prenom ILIKE $${i} OR nom ILIKE $${i} OR biographie ILIKE $${i} OR adresse ILIKE $${i} OR ville ILIKE $${i})`);
    values.push(`%${search}%`); i++;
  }
  if (note) {
    clauses.push(`note_moyenne >= $${i}`);
    values.push(parseFloat(note)); i++;
  }
  if (type) {
    // en attendant une vraie table de compétences
    clauses.push(`biographie ILIKE $${i}`);
    values.push(`%${type}%`); i++;
  }
  if (cp) {
    clauses.push(`code_postal = $${i}`);
    values.push(cp); i++;
  }

  return { whereSql: clauses.join(' AND '), values };
}

/**
 * GET /api/jardiniers
 * Liste des jardiniers publiés (recherche/filtre)
 */
router.get('/', async (req, res) => {
  try {
    const { search = '', note = '', type = '', cp = '' } = req.query;
    const { whereSql, values } = buildWhere({ search, note, type, cp });

    const sql = `
      SELECT
        id_utilisateur::text AS id_utilisateur,
        prenom, nom, biographie, telephone,
        adresse, ville, code_postal,
        latitude, longitude,
        note_moyenne, photo_profil,
        visibility, is_posted,
        CASE
          WHEN date_naissance IS NOT NULL
          THEN EXTRACT(year FROM age(CURRENT_DATE, date_naissance))::int
          ELSE NULL
        END AS age
      FROM public.utilisateur
      WHERE ${whereSql}
      ORDER BY note_moyenne DESC NULLS LAST, nom ASC, prenom ASC;
    `;
    const { rows } = await pool.query(sql, values);

    // Adapter la forme au front
    const payload = rows.map(r => ({
      id_utilisateur: r.id_utilisateur,
      prenom: r.prenom,
      nom: r.nom,
      biographie: r.biographie,
      telephone: r.telephone,
      adresse: r.adresse,
      ville: r.ville,
      code_postal: r.code_postal,
      latitude: r.latitude,
      longitude: r.longitude,
      note_moyenne: r.note_moyenne,
      photo_profil: r.photo_profil,
      age: r.age,
      visibility: r.visibility,
      is_posted: r.is_posted,
      // champs tolérés par le front
      competences: [],
      distance_km: null
    }));

    res.json(payload);
  } catch (err) {
    console.error('Erreur /api/jardiniers:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/jardiniers/:id/disponibilites
 * Retourne les disponibilités du jardinier avec un flag "disponible"
 * (false si un créneau est déjà réservé dans la table reservation)
 *
 * ⚠️ Hypothèses de schéma :
 * - disponibilite_jardinier(id_utilisateur, date_disponible, heure_debut, heure_fin, jour_semaine, actif)
 * - reservation(id_utilisateur, date_reservation TIMESTAMP, ...)
 */
router.get('/:id/disponibilites', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT
        d.date_disponible,
        d.heure_debut,
        d.heure_fin,
        d.jour_semaine,
        d.actif,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.reservation r
            WHERE r.id_utilisateur = d.id_utilisateur
              AND r.date_reservation::date = d.date_disponible::date
              AND (r.date_reservation::time >= d.heure_debut
                   AND r.date_reservation::time < d.heure_fin)
          )
          THEN FALSE
          ELSE TRUE
        END AS disponible
      FROM public.disponibilite_jardinier d
      WHERE d.id_utilisateur = $1
        AND d.actif = TRUE
      ORDER BY d.date_disponible ASC, d.heure_debut ASC;
    `;

    const { rows } = await pool.query(sql, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Erreur /api/jardiniers/:id/disponibilites:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
