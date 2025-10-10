// routes/favoris.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// On ne liste que les jardiniers visibles/publics
const VISIBLE_GARDENER_FILTER = `
  u.role = 'ami_du_vert'
  AND u.is_posted = TRUE
  AND (u.visibility = 'public' OR u.visibility IS NULL)
`;

// GET /api/favoris?user_id=123  -> cartes des favoris
router.get('/', async (req, res) => {
  const userId = Number(req.query.user_id || 0);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id invalide' });
  }
  try {
    const sql = `
      SELECT
        u.id_utilisateur, u.prenom, u.nom, u.biographie,
        u.photo_profil, u.ville, u.code_postal, u.adresse,
        u.note_moyenne,
        f.created_at
      FROM public.favori f
      JOIN public.utilisateur u ON u.id_utilisateur = f.jardinier_id
      WHERE f.user_id = $1 AND ${VISIBLE_GARDENER_FILTER}
      ORDER BY f.created_at DESC;
    `;
    const { rows } = await pool.query(sql, [userId]);
    res.json(rows);
  } catch (e) {
    console.error('GET /favoris', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/favoris/ids?user_id=123 -> uniquement les ids favoris
router.get('/ids', async (req, res) => {
  const userId = Number(req.query.user_id || 0);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id invalide' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT jardinier_id FROM public.favori WHERE user_id = $1`,
      [userId]
    );
    res.json(rows.map(r => r.jardinier_id));
  } catch (e) {
    console.error('GET /favoris/ids', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/favoris  { user_id, jardinier_id } -> ajoute (idempotent)
router.post('/', async (req, res) => {
  const { user_id, jardinier_id } = req.body || {};
  const userId = Number(user_id || 0);
  const jardinierId = Number(jardinier_id || 0);
  if (!Number.isInteger(userId) || !Number.isInteger(jardinierId) || userId <= 0 || jardinierId <= 0) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  try {
    const check = await pool.query(
      `SELECT 1 FROM public.utilisateur u WHERE u.id_utilisateur=$1 AND ${VISIBLE_GARDENER_FILTER} LIMIT 1`,
      [jardinierId]
    );
    if (check.rowCount === 0) return res.status(404).json({ error: 'Jardinier introuvable ou non visible' });

    await pool.query(
      `INSERT INTO public.favori(user_id, jardinier_id)
       VALUES($1,$2)
       ON CONFLICT (user_id, jardinier_id) DO NOTHING`,
      [userId, jardinierId]
    );
    res.status(201).json({ ok: true, action: 'added' });
  } catch (e) {
    console.error('POST /favoris', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/favoris  { user_id, jardinier_id } -> retire
router.delete('/', async (req, res) => {
  const { user_id, jardinier_id } = req.body || {};
  const userId = Number(user_id || 0);
  const jardinierId = Number(jardinier_id || 0);
  if (!Number.isInteger(userId) || !Number.isInteger(jardinierId) || userId <= 0 || jardinierId <= 0) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  try {
    await pool.query(
      `DELETE FROM public.favori WHERE user_id = $1 AND jardinier_id = $2`,
      [userId, jardinierId]
    );
    res.json({ ok: true, action: 'removed' });
  } catch (e) {
    console.error('DELETE /favoris', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
