// routes/reservation_jardiniers.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// SSL toggle (utile sur Render/OVH/etc.)
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) =>
  console.error('[PG POOL ERROR][reservation_jardiniers]', err.message)
);

/* =========================
   Ping DB / diag montage
   ========================= */
router.get('/__dbcheck', async (_req, res) => {
  try {
    const r = await pool.query(
      'select now() as now, current_database() as db, current_user as usr'
    );
    res.json({ ok: true, ...r.rows[0], ssl: !!useSsl });
  } catch (e) {
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

/* =========================
   Middleware Auth minimal
   ========================= */
function requireAuth(req, res, next) {
  const user = req.user || (req.session && (req.session.user || req.session));
  const id =
    (user && (user.id_utilisateur || user.id)) ||
    (req.cookies && (Number(req.cookies.user_id) || Number(req.cookies.userId))) ||
    null;

  if (!id) return res.status(401).json({ error: 'Non authentifié' });
  req.authUserId = Number(id);
  return next();
}

/* =========================
   Utils
   ========================= */
async function fetchGardener(id) {
  const sql = `
    SELECT id_utilisateur, prenom, nom, biographie, telephone, adresse,
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

/* =========================================================
   ✅ GET /:id  → profil du jardinier (PUBLIC)
   ========================================================= */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id invalide' });
    }

    const gard = await fetchGardener(id);
    if (!gard) return res.status(404).json({ error: 'Profil introuvable' });

    return res.json({
      id: gard.id_utilisateur,
      prenom: gard.prenom,
      nom: gard.nom,
      ville: gard.ville,
      code_postal: gard.code_postal,
      age: gard.age,
      biographie: gard.biographie,
      note_moyenne: gard.note_moyenne,
      photo_profil: gard.photo_profil,
      competences: gard.competences || null,
    });
  } catch (e) {
    console.error('[GET /reservation_jardiniers/:id]', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* =========================================================
   GET /:id/disponibilites → créneaux JARDINIER (PUBLIC)
   ========================================================= */
router.get('/:id/disponibilites', async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!Number.isInteger(id) || id <= 0) return res.json([]);

    const from = req.query.from && String(req.query.from);
    const to   = req.query.to && String(req.query.to);

    // ----- MODE EXPANSION (calendrier) -----
    if (from && to) {
      const q = `
        WITH params AS (
          SELECT $1::date AS d0, $2::date AS d1
        ),
        days AS (
          SELECT g::date AS d
          FROM params, generate_series((SELECT d0 FROM params), (SELECT d1 FROM params), interval '1 day') g
        ),
        src AS (
          SELECT dj.id_dispo, dj.id_utilisateur, dj.jour_semaine, dj.heure_debut, dj.heure_fin
          FROM public.disponibilite_jardinier dj
          WHERE dj.actif = TRUE
            AND dj.id_utilisateur = $3::int
        )
        SELECT
          s.id_dispo AS id_dispo,
          s.id_utilisateur AS id_utilisateur,
          (d.d + s.heure_debut)::timestamptz AS start,
          (d.d + s.heure_fin)::timestamptz   AS "end"
        FROM days d
        JOIN src s ON extract(isodow FROM d.d) = s.jour_semaine
        WHERE (d.d + s.heure_fin) > (SELECT d0 FROM params)
          AND (d.d + s.heure_debut) < ((SELECT d1 FROM params) + 1)
        ORDER BY start;
      `;
      const { rows } = await pool.query(q, [from, to, id]);

      const events = rows.map(r => ({
        id_dispo: r.id_dispo,
        start: new Date(r.start).toISOString(),
        end: new Date(r.end).toISOString(),
        resourceId: r.id_utilisateur,
        type: 'jardinier',
        allDay: false,
      }));
      return res.json(events);
    }

    // ----- MODE BRUT (liste modèle hebdo) -----
    const q = `
      SELECT id_dispo, jour_semaine, heure_debut, heure_fin, actif, statut
      FROM public.disponibilite_jardinier
      WHERE id_utilisateur = $1
      ORDER BY jour_semaine, heure_debut;
    `;
    const { rows } = await pool.query(q, [id]);
    const out = rows.map(r => ({
      id_dispo: r.id_dispo,
      jour_semaine: Number(r.jour_semaine),
      heure_debut: r.heure_debut,
      heure_fin: r.heure_fin,
      actif: !!r.actif,
      statut: r.statut || null,
    }));
    return res.json(out);
  } catch (e) {
    console.error('[GET /reservation_jardiniers/:id/disponibilites]', e.code, e.message);
    return res.json([]);
  }
});

/* =========================================================
   (Global) GET /dispos  → expansion pour TOUS les jardiniers (PUBLIC)
   ========================================================= */
router.get('/dispos', async (req, res) => {
  try {
    const from = req.query.from && String(req.query.from);
    const to   = req.query.to && String(req.query.to);
    if (!from || !to) {
      return res.status(400).json({ error: 'from & to requis (YYYY-MM-DD)' });
    }

    const q = `
      WITH params AS (
        SELECT $1::date AS d0, $2::date AS d1
      ),
      days AS (
        SELECT g::date AS d
        FROM params, generate_series((SELECT d0 FROM params), (SELECT d1 FROM params), interval '1 day') g
      ),
      src AS (
        SELECT dj.id_dispo, dj.id_utilisateur, dj.jour_semaine, dj.heure_debut, dj.heure_fin
        FROM public.disponibilite_jardinier dj
        WHERE dj.actif = TRUE
      )
      SELECT
        s.id_dispo AS id_dispo,
        s.id_utilisateur AS id_utilisateur,
        (d.d + s.heure_debut)::timestamptz AS start,
        (d.d + s.heure_fin)::timestamptz   AS "end"
      FROM days d
      JOIN src s ON extract(isodow FROM d.d) = s.jour_semaine
      WHERE (d.d + s.heure_fin) > (SELECT d0 FROM params)
        AND (d.d + s.heure_debut) < ((SELECT d1 FROM params) + 1)
      ORDER BY s.id_utilisateur, start;
    `;
    const { rows } = await pool.query(q, [from, to]);

    const events = rows.map(r => ({
      id: `jard-${r.id_dispo}-${new Date(r.start).toISOString()}`,
      title: 'Créneau jardinier',
      start: new Date(r.start).toISOString(),
      end: new Date(r.end).toISOString(),
      resourceId: r.id_utilisateur,
      type: 'jardinier',
      allDay: false,
    }));

    return res.json({ ok: true, events });
  } catch (e) {
    console.error('[GET /reservation_jardiniers/dispos]', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* ==================================================================
   ✅ GET /:id/commentaires  → avis / commentaires (PUBLIC)
   (DB: public.reservation, filtre par id_jardinier)
   ================================================================== */
router.get('/:id/commentaires', async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 30));
    if (!Number.isInteger(id) || id <= 0) return res.json([]);

    const q = `
      SELECT
        id_reservation,
        date_reservation,
        commentaires
      FROM public.reservation
      WHERE id_jardinier = $1
        AND commentaires IS NOT NULL
      ORDER BY date_reservation DESC
      LIMIT $2;
    `;
    const { rows } = await pool.query(q, [id, limit]);

    const out = rows.map(r => ({
      id_reservation: r.id_reservation,
      date_reservation: r.date_reservation,
      commentaires: r.commentaires,
      note: null, // pas de colonne note → on renvoie null
    }));

    res.json(out);
  } catch (e) {
    console.error('[GET /reservation_jardiniers/:id/commentaires]', e.code, e.message);
    res.json([]);
  }
});

/* =========================================================
   POST /:id/messages  → envoyer un message (AUTH)
   ========================================================= */
router.post('/:id/messages', requireAuth, async (req, res) => {
  const idJardinier = Number(req.params.id || 0);
  const contenu = (req.body && String(req.body.contenu || '').trim()) || '';

  if (!Number.isInteger(idJardinier) || idJardinier <= 0) {
    return res.status(400).json({ error: 'id invalide' });
  }
  if (!contenu || contenu.length < 2) {
    return res.status(400).json({ error: 'Message trop court' });
  }

  try {
    const gard = await fetchGardener(idJardinier);
    if (!gard) return res.status(404).json({ error: 'Profil introuvable' });

    if (req.authUserId === idJardinier) {
      return res.status(400).json({ error: 'Action non autorisée' });
    }

    const sql = `
      INSERT INTO public.messagerie (id_envoyeur, id_destinataire, contenu, date_envoi)
      VALUES ($1, $2, $3, now())
      RETURNING id_message, id_envoyeur, id_destinataire, contenu, date_envoi;
    `;
    const { rows } = await pool.query(sql, [req.authUserId, idJardinier, contenu]);

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /:id/messages', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* ==================================================================
   GET /:id/messages  → derniers messages (AUTH)
   ================================================================== */
router.get('/:id/messages', requireAuth, async (req, res) => {
  const idJardinier = Number(req.params.id || 0);
  const limit = Math.min(Number(req.query.limit || 30), 100);

  if (!Number.isInteger(idJardinier) || idJardinier <= 0) {
    return res.status(400).json({ error: 'id invalide' });
  }

  try {
    const gard = await fetchGardener(idJardinier);
    if (!gard) return res.status(404).json({ error: 'Profil introuvable' });

    const sql = `
      SELECT m.id_message, m.id_envoyeur, m.id_destinataire, m.contenu, m.date_envoi,
             u.prenom, u.nom
      FROM public.messagerie m
      JOIN public.utilisateur u
        ON u.id_utilisateur = m.id_envoyeur
      WHERE (m.id_envoyeur = $1 AND m.id_destinataire = $2)
         OR (m.id_envoyeur = $2 AND m.id_destinataire = $1)
      ORDER BY m.date_envoi DESC
      LIMIT $3;
    `;
    const { rows } = await pool.query(sql, [req.authUserId, idJardinier, limit]);
    return res.json(rows);
  } catch (e) {
    console.error('Erreur GET /:id/messages', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* 404 routeur */
router.use((req, res) =>
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
);

module.exports = router;
