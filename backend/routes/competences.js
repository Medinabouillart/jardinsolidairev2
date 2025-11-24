const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * 🌿 Récupérer toutes les compétences
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.competence ORDER BY nom ASC;');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET /competences :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
