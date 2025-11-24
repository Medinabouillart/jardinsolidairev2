// routes/confirmation_reservation_jardins.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// SSL (Render/OVH/etc.)
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) =>
  console.error('[PG POOL][confirmation_reservation_jardins]', err.message)
);

/* ========= ping DB ========= */
router.get('/__dbcheck', async (_req, res) => {
  try {
    const r = await pool.query('SELECT now() as now, current_database() as db, current_user as usr');
    res.json({ ok: true, ...r.rows[0], ssl: !!useSsl });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ========= Auth minimale (élargie) ========= */
function requireAuth(req, res, next) {
  const u = req.user || (req.session && (req.session.user || req.session)) || null;

  let id =
    (u && (u.id_utilisateur || u.id)) ||
    Number(req.cookies.user_id) ||
    Number(req.cookies.userId) ||
    Number(req.cookies.uid) ||
    Number(req.cookies.id_utilisateur) ||
    Number(req.headers['x-user-id']) ||
    null;

  if (!id && req.headers.authorization) {
    const m = req.headers.authorization.match(/^Bearer\s+(\d+)$/i);
    if (m) id = Number(m[1]);
  }

  if (!id) {
    console.warn('[BOOK][AUTH] 401 Non authentifié (aucun id trouvé)');
    return res.status(401).json({ error: 'Non authentifié' });
  }

  req.authUserId = id;
  next();
}

/* ========= GET /:id → infos jardin ========= */
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!Number.isInteger(id) || id <= 0) {
    console.warn('[GET][jardins] 400 id invalide =', req.params.id);
    return res.status(400).json({ error: 'id invalide' });
  }

  try {
    const sql = `
      SELECT
        id_jardin,
        id_proprietaire,
        titre,
        description,
        adresse,
        ville,
        code_postal,
        photos,
        superficie,
        type,
        besoins,
        note_moyenne,
        statut,
        visibility
      FROM public.jardin
      WHERE id_jardin = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (!rows[0]) {
      console.warn('[GET][jardins] 404 Jardin introuvable id =', id);
      return res.status(404).json({ error: 'Jardin introuvable' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('[GET /confirmation_reservation_jardins/:id] 500', {
      code: e.code, detail: e.detail, message: e.message,
    });
    res.status(500).json({ error: e.message });
  }
});

/* ========= POST /book → créer la réservation ========= */
router.post('/book', requireAuth, async (req, res) => {
  console.log('[BOOK][jardins] body =', req.body, 'authUserId =', req.authUserId);

  try {
    const { id_jardin, start, end, commentaire } = req.body || {};
    const idClient = req.authUserId;

    // validations
    if (!Number.isInteger(Number(id_jardin))) {
      console.warn('[BOOK] 400 id_jardin invalide:', id_jardin);
      return res.status(400).json({ error: 'id_jardin invalide' });
    }
    const s = new Date(start), e = new Date(end);
    if (!start || !end || isNaN(+s) || isNaN(+e) || e <= s) {
      console.warn('[BOOK] 400 fenêtre horaire invalide:', { start, end });
      return res.status(400).json({ error: 'Fenêtre horaire invalide' });
    }

    // propriétaire + auto réservation
    const rOwner = await pool.query(
      'SELECT id_proprietaire FROM public.jardin WHERE id_jardin = $1 LIMIT 1',
      [Number(id_jardin)]
    );
    if (!rOwner.rows[0]) {
      console.warn('[BOOK] 404 Jardin introuvable:', id_jardin);
      return res.status(404).json({ error: 'Jardin introuvable' });
    }
    const idProprio = Number(rOwner.rows[0].id_proprietaire);
    if (idProprio === Number(idClient)) {
      console.warn('[BOOK] 400 auto-réservation refusée (proprio = client)');
      return res.status(400).json({ error: 'Impossible de réserver votre propre jardin' });
    }

    // ✅ chevauchement (placeholders corrigés, "start"/"end" quotés)
    const qOverlap = `
      SELECT 1
      FROM public.reservation_jardin
      WHERE id_jardin = $1
        AND statut <> 'cancelled'
        AND NOT ($2::timestamptz >= "end" OR $3::timestamptz <= "start")
      LIMIT 1;
    `;
    const hasConflict =
      (await pool.query(qOverlap, [Number(id_jardin), s.toISOString(), e.toISOString()]))
        .rowCount > 0;
    if (hasConflict) {
      console.warn('[BOOK] 409 Conflit de créneau');
      return res.status(409).json({ error: 'Créneau déjà réservé' });
    }

    // ✅ insertion ("start" et "end" quotés)
    const qIns = `
      INSERT INTO public.reservation_jardin
        (id_jardin, id_client, "start", "end", statut, commentaires, created_at)
      VALUES ($1, $2, $3::timestamptz, $4::timestamptz, 'pending', $5, now())
      RETURNING id_reservation, id_jardin, id_client, "start", "end", statut, commentaires;
    `;
    const rIns = await pool.query(qIns, [
      Number(id_jardin),
      Number(idClient),
      s.toISOString(),
      e.toISOString(),
      commentaire || null,
    ]);

    console.log('[BOOK] 201 OK id_reservation =', rIns.rows[0]?.id_reservation);
    return res.status(201).json({ ok: true, reservation: rIns.rows[0] });
  } catch (e) {
    console.error('[BOOK] 500', {
      code: e.code, detail: e.detail, message: e.message, stack: e.stack,
    });
    res.status(500).json({ error: e.detail || e.message || 'Erreur serveur', code: e.code });
  }
});

module.exports = router;
