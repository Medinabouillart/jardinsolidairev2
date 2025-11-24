// routes/jardiniers.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Mappe le nom de compétence (en base) vers le "type" utilisé dans le front
 * ex : "Jardin potager 🍅" → "potager"
 */
const mapNomToType = (nom) => {
  if (!nom) return null;
  const n = nom.toLowerCase();

  if (n.includes('potager')) return 'potager';
  if (n.includes('fleur')) return 'fleurs';
  if (n.includes('permaculture')) return 'permaculture';
  if (n.includes('tonte') || n.includes('pelouse')) return 'tondre';
  if (n.includes('apprentissage') || n.includes('transmission')) return 'jardinage';

  return null;
};

// Construit WHERE dynamique (CP strict si fourni)
function buildWhere({ search, note, cp }) {
  const clauses = [
    `u.role = 'ami_du_vert'`,
    `u.is_posted = TRUE`,
    `u.visibility = 'public'`,
    `NOT (lower(u.prenom) = 'mahalia' AND lower(u.nom) = 'bouillart')`
  ];
  const values = [];
  let i = 1;

  if (search) {
    clauses.push(
      `(u.prenom ILIKE $${i} OR u.nom ILIKE $${i} OR u.biographie ILIKE $${i} OR u.adresse ILIKE $${i} OR u.ville ILIKE $${i})`
    );
    values.push(`%${search}%`); i++;
  }
  if (note) {
    clauses.push(`u.note_moyenne >= $${i}`);
    values.push(parseFloat(note)); i++;
  }
  if (cp) {
    clauses.push(`u.code_postal = $${i}`);
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
    const { whereSql, values } = buildWhere({ search, note, cp });

    const sql = `
      SELECT
        u.id_utilisateur::text AS id_utilisateur,
        u.prenom, u.nom, u.biographie, u.telephone,
        u.adresse, u.ville, u.code_postal,
        u.latitude, u.longitude,
        u.note_moyenne, u.photo_profil,
        u.visibility, u.is_posted,
        CASE
          WHEN u.date_naissance IS NOT NULL
          THEN EXTRACT(year FROM age(CURRENT_DATE, u.date_naissance))::int
          ELSE NULL
        END AS age,
        COALESCE(
          array_agg(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL),
          '{}'::text[]
        ) AS competences
      FROM public.utilisateur u
      LEFT JOIN "utilisateurCompetence" uc
        ON uc.id_utilisateur = u.id_utilisateur
      LEFT JOIN competence c
        ON c.id_competence = uc.id_competence
      WHERE ${whereSql}
      GROUP BY u.id_utilisateur
      ORDER BY u.note_moyenne DESC NULLS LAST, u.nom ASC, u.prenom ASC;
    `;

    const { rows } = await pool.query(sql, values);

    // Adapter la forme au front
    let payload = rows.map(r => ({
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
      competences: r.competences || [],
      distance_km: null
    }));

    // 🔹 Filtre "type" basé sur les compétences stockées
    if (type) {
      const wanted = String(type).toLowerCase();
      payload = payload.filter(j => {
        if (!Array.isArray(j.competences)) return false;
        const types = j.competences
          .map(mapNomToType)   // "Jardin potager 🍅" → "potager"
          .filter(Boolean);
        return types.includes(wanted);
      });
    }

    res.json(payload);
  } catch (err) {
    console.error('Erreur /api/jardiniers:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/jardiniers/:id/disponibilites
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
