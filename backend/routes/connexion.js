// backend/routes/connexion.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

/* ====== PG Pool ====== */
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});
pool.on('error', (err) => console.error('[PG POOL ERROR][connexion]', err.message));

/* ====== POST /api/connexion ====== */
router.post('/', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body || {};
    if (!email || !mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Champs manquants' });
    }

    const sql = `
      SELECT id_utilisateur, prenom, nom, email, role, mot_de_passe
      FROM public.utilisateur
      WHERE email = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [email]);
    const user = rows[0];

    if (!user || user.mot_de_passe !== mot_de_passe) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
    }

    const safe = {
      id_utilisateur: Number(user.id_utilisateur),
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
    };

    // pose un cookie simple lisible par le front
    res.cookie('user_id', safe.id_utilisateur, {
      httpOnly: false,
      sameSite: 'Lax',
    });

    return res.json({ ok: true, message: 'Connexion réussie', user: safe });
  } catch (err) {
    console.error('[connexion] ERROR:', err);
    return res.status(500).json({ ok: false, message: 'Erreur serveur' });
  }
});

/* ====== GET /api/connexion/me ====== */
router.get('/me', (req, res) => {
  const id = req.cookies?.user_id;
  return res.json({
    loggedIn: Boolean(id),
    userId: id ? Number(id) : null,
  });
});

module.exports = router;
