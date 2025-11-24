// backend/routes/reservation_jardins.js
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

/* ===== PG Pool (SSL toggle) ===== */
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err.message);
});

/* ===== Utils ===== */
function getUserId(req) {
  const s = req.session || {};
  const cookieId = (req.cookies && (req.cookies.user_id || req.cookies.userId)) || null;
  const headerId = req.headers && req.headers['x-user-id'];
  const raw =
    cookieId ||
    headerId ||
    s.user_id ||
    s.userId ||
    s.id_utilisateur ||
    (s.user && (s.user.id_utilisateur || s.user.id)) ||
    (req.user && (req.user.id_utilisateur || req.user.id)) ||
    null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
const asISO = (d) => (d instanceof Date ? d.toISOString() : d);

/* ===== Mini ping du routeur ===== */
router.get('/__dbcheck', async (_req, res) => {
  try {
    const r = await pool.query('select now() as now, current_database() as db, current_user as usr');
    res.json({ ok: true, ssl: !!useSsl, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ============================================================
   IMPORTANT: routes fixes (sans param) AVANT /:id/...
============================================================ */

/* Occupied slots → pour masquer les créneaux déjà pris au front */
router.get('/occupied', async (req, res) => {
  try {
    const id = Number(req.query.jardinId || 0);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id invalide' });
    }

    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to   = req.query.to   ? new Date(String(req.query.to))   : null;

    const params = [id];
    let whereDate = '';
    if (from && to && !isNaN(+from) && !isNaN(+to)) {
      params.push(from.toISOString(), to.toISOString());
      whereDate = `AND NOT ($2::timestamptz >= "end" OR $3::timestamptz <= "start")`;
    }

    const q = `
      SELECT "start", "end"
      FROM public.reservation_jardin
      WHERE id_jardin = $1
        AND statut IN ('pending','accepted','confirmed')
        ${whereDate}
      ORDER BY "start" ASC
    `;
    const { rows } = await pool.query(q, params);
    res.json(rows.map(r => ({ start: asISO(r.start), end: asISO(r.end) })));
  } catch (e) {
    console.error('[GET /reservation_jardins/occupied]', e.code, e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   GET /api/reservation_jardins/:id/disponibilites
============================================================ */
router.get('/:id/disponibilites', async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id invalide' });
    }

    const q = `
      SELECT id_dispo, id_jardin, "start", "end"
      FROM public.disponibilite_jardin
      WHERE id_jardin = $1
        AND "end" > now()
      ORDER BY "start" ASC
      LIMIT 1000
    `;
    const { rows } = await pool.query(q, [id]);

    res.json(rows.map(r => ({
      id_dispo: r.id_dispo,
      start: asISO(r.start),
      end: asISO(r.end),
    })));
  } catch (e) {
    console.error('[GET /reservation_jardins/:id/disponibilites]', e.code, e.message);
    const code = e.code === '42501' ? 403 : 500;
    res.status(code).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ============================================================
   GET /api/reservation_jardins/:id/commentaires
============================================================ */
router.get('/:id/commentaires', async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'id invalide' });
    }

    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 30));
    const q = `
      SELECT
        id_reservation,
        COALESCE(created_at, "start") AS date_reservation,
        commentaires,
        note
      FROM public.reservation_jardin
      WHERE id_jardin = $1
        AND (commentaires IS NOT NULL OR note IS NOT NULL)
      ORDER BY COALESCE(created_at, "start") DESC
      LIMIT $2
    `;
    const { rows } = await pool.query(q, [id, limit]);

    res.json(rows.map(r => ({
      id_reservation: r.id_reservation,
      date_reservation: asISO(r.date_reservation),
      commentaires: r.commentaires,
      note: r.note === null ? null : Number(r.note),
    })));
  } catch (e) {
    console.error('[GET /reservation_jardins/:id/commentaires]', e.code, e.message);
    const code = e.code === '42501' ? 403 : 500;
    res.status(code).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ============================================================
   POST /api/reservation_jardins/:id/reserver
============================================================ */
router.post('/:id/reserver', async (req, res) => {
  try {
    const idJardin = Number(req.params.id || 0);
    if (!Number.isInteger(idJardin) || idJardin <= 0) {
      return res.status(400).json({ ok: false, error: 'id invalide' });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(403).json({ ok: false, error: 'Non connecté' });

    const { start, end } = req.body || {};
    const dStart = new Date(start);
    const dEnd   = new Date(end);
    if (!start || !end || !Number.isFinite(dStart.getTime()) || !Number.isFinite(dEnd.getTime()) || dEnd <= dStart) {
      return res.status(400).json({ ok: false, error: 'Dates invalides' });
    }

    // inclus dans une dispo ?
    const qDispo = `
      SELECT 1
      FROM public.disponibilite_jardin
      WHERE id_jardin = $1
        AND "start" <= $2::timestamptz
        AND "end"   >= $3::timestamptz
      LIMIT 1
    `;
    const rDispo = await pool.query(qDispo, [idJardin, dStart.toISOString(), dEnd.toISOString()]);
    if (rDispo.rowCount === 0) {
      return res.status(400).json({ ok: false, error: 'Créneau en dehors des disponibilités' });
    }

    // conflit avec réservation existante ?
    const qOverlap = `
      SELECT 1
      FROM public.reservation_jardin
      WHERE id_jardin = $1
        AND statut IN ('pending','accepted','confirmed')
        AND NOT ($2::timestamptz >= "end" OR $3::timestamptz <= "start")
      LIMIT 1
    `;
    const rOverlap = await pool.query(qOverlap, [idJardin, dStart.toISOString(), dEnd.toISOString()]);
    if (rOverlap.rowCount > 0) {
      return res.status(409).json({ ok: false, error: 'Créneau déjà pris' });
    }

    // insert (pending)
    const qIns = `
      INSERT INTO public.reservation_jardin (id_jardin, id_client, "start", "end", statut, created_at)
      VALUES ($1, $2, $3::timestamptz, $4::timestamptz, 'pending', now())
      RETURNING id_reservation
    `;
    const rIns = await pool.query(qIns, [idJardin, userId, dStart.toISOString(), dEnd.toISOString()]);
    const reservation_id = rIns.rows[0]?.id_reservation;

    res.status(201).json({ ok: true, reservation_id });
  } catch (e) {
    console.error('[POST /reservation_jardins/:id/reserver]', e.code, e.message);
    const code = e.code === '42501' ? 403 : 500;
    res.status(code).json({ ok: false, code: e.code, error: e.message });
  }
});

module.exports = router;
