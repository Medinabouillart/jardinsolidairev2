const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

/* ====== PG Pool (SSL toggle) ====== */
const useSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err.message);
});

/* ====== Utils ====== */
async function pickJardinTable() {
  const { rows } = await pool.query(`
    SELECT COALESCE(
      to_regclass('public.jardin')::text,
      to_regclass('public.jardins')::text
    ) AS t
  `);
  const full = rows?.[0]?.t || null; // ex: 'public.jardin'
  const name = full ? full.replace(/^public\./, '') : null;
  return (name && ['jardin', 'jardins'].includes(name)) ? name : null;
}

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
     ) AS exists`,
    [table, column]
  );
  return !!rows?.[0]?.exists;
}

async function detectCompetenceNameCol() {
  const candidates = ['nom', 'libelle', 'name', 'label', 'title'];
  for (const c of candidates) {
    if (await columnExists('competence', c)) return c;
  }
  return null;
}

/* ====== Pings/diag ====== */
router.get('/__server_ping', (_req, res) => {
  res.json({ ok: true, from: 'routes/jardins.js' });
});

router.get('/__dbcheck', async (_req, res) => {
  try {
    const r = await pool.query('select now() as now, current_database() as db, current_user as usr');
    res.json({ ok: true, ...r.rows[0], ssl: !!useSsl });
  } catch (e) {
    console.error('[__dbcheck]', e.code, e.message);
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ====== GET /api/jardins (liste) ====== */
router.get('/', async (_req, res) => {
  try {
    await pool.query('select 1');
    const table = await pickJardinTable();
    if (!table) return res.json([]);

    if (table !== 'jardin') {
      // tente d'exposer id_proprietaire si présent
      const hasOwner = await columnExists(table, 'id_proprietaire');
      const sql = hasOwner
        ? `SELECT id AS id, id_proprietaire, * FROM public.${table} ORDER BY id DESC`
        : `SELECT id AS id, * FROM public.${table} ORDER BY id DESC`;
      const { rows } = await pool.query(sql);
      return res.json(rows);
    }

    const hasTypeCol = await columnExists('jardin', 'type');

    const baseSql = `
      SELECT
        j.id_jardin AS id,
        j.id_proprietaire,
        j.titre,
        (COALESCE(u.prenom,'') || ' ' || COALESCE(u.nom,''))::text AS proprietaire,
        j.description,
        j.ville,
        j.code_postal,
        ${hasTypeCol ? 'j.type' : 'NULL::text'} AS type,
        j.note_moyenne AS note,
        COALESCE(
          CASE WHEN jsonb_typeof(j.photos)='array' THEN j.photos ELSE '[]'::jsonb END,
          '[]'::jsonb
        ) AS photos
      FROM public.jardin j
      LEFT JOIN public.utilisateur u ON u.id_utilisateur = j.id_proprietaire
      ORDER BY j.id_jardin DESC
    `;
    const { rows: baseRows } = await pool.query(baseSql);

    try {
      const nameCol = await detectCompetenceNameCol();
      if (!nameCol) {
        return res.json(baseRows.map(r => ({ ...r, categories: [] })));
      }
      const catSql = `
        SELECT
          jc.id_jardin,
          json_agg(DISTINCT (c.${nameCol})::text ORDER BY (c.${nameCol})::text) AS cats
        FROM public.jardin_competence jc
        JOIN public.competence c ON c.id_competence = jc.id_competence
        GROUP BY jc.id_jardin
      `;
      const { rows: catRows } = await pool.query(catSql);
      const catsByJ = new Map(catRows.map(r => [String(r.id_jardin), r.cats || []]));
      return res.json(baseRows.map(r => ({ ...r, categories: catsByJ.get(String(r.id)) || [] })));
    } catch (e) {
      if (e?.code === '42501' || e?.code === '42P01') {
        return res.json(baseRows.map(r => ({ ...r, categories: [] })));
      }
      throw e;
    }
  } catch (e) {
    console.error('[GET /api/jardins]', e.code, e.message);
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ====== GET /api/jardins/:id (détail) ====== */
router.get('/:id', async (req, res) => {
  try {
    await pool.query('select 1');
    const { id } = req.params;

    const table = await pickJardinTable();
    if (!table) return res.status(404).json({ ok: false, error: 'Table jardin introuvable' });

    if (table !== 'jardin') {
      const hasOwner = await columnExists(table, 'id_proprietaire');
      const sql = hasOwner
        ? `SELECT id AS id, id_proprietaire, * FROM public.${table} WHERE id = $1 LIMIT 1`
        : `SELECT id AS id, * FROM public.${table} WHERE id = $1 LIMIT 1`;
      const { rows } = await pool.query(sql, [id]);
      if (!rows.length) return res.status(404).json({ ok: false, error: 'Jardin introuvable' });
      return res.json(rows[0]);
    }

    const hasTypeCol = await columnExists('jardin', 'type');

    const baseSql = `
      SELECT
        j.id_jardin AS id,
        j.id_proprietaire,
        j.titre,
        j.description,
        j.ville,
        j.code_postal,
        ${hasTypeCol ? 'j.type' : 'NULL::text'} AS type,
        j.note_moyenne AS note,
        COALESCE(
          CASE WHEN jsonb_typeof(j.photos)='array' THEN j.photos ELSE '[]'::jsonb END,
          '[]'::jsonb
        ) AS photos,
        u.photo_profil AS avatar,
        TRIM(CONCAT(COALESCE(u.prenom,''),' ',COALESCE(u.nom,''))) AS proprietaire
      FROM public.jardin j
      LEFT JOIN public.utilisateur u ON u.id_utilisateur = j.id_proprietaire
      WHERE j.id_jardin = $1
      LIMIT 1
    `;
    const { rows: base } = await pool.query(baseSql, [id]);
    if (!base.length) return res.status(404).json({ ok: false, error: 'Jardin introuvable' });
    const baseObj = base[0];

    try {
      const nameCol = await detectCompetenceNameCol();
      if (!nameCol) return res.json({ ...baseObj, categories: [] });

      const catSql = `
        SELECT
          json_agg(DISTINCT (c.${nameCol})::text ORDER BY (c.${nameCol})::text) AS cats
        FROM public.jardin_competence jc
        JOIN public.competence c ON c.id_competence = jc.id_competence
        WHERE jc.id_jardin = $1
      `;
      const { rows: cat } = await pool.query(catSql, [id]);
      const cats = cat?.[0]?.cats || [];
      return res.json({ ...baseObj, categories: cats });
    } catch (e) {
      if (e?.code === '42501' || e?.code === '42P01') {
        return res.json({ ...baseObj, categories: [] });
      }
      throw e;
    }
  } catch (e) {
    console.error('[GET /api/jardins/:id]', e.code, e.message);
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

/* ====== GET /api/jardins/:id/disponibilites ====== */
router.get('/:id/disponibilites', async (req, res) => {
  try {
    await pool.query('select 1');
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT id_dispo, start, "end"
       FROM public.disponibilite_jardin
       WHERE id_jardin = $1
       ORDER BY start ASC`,
      [id]
    );

    const data = rows.map(r => ({
      id: r.id_dispo,
      start: r.start,
      end: r.end,
    }));

    res.json(data);
  } catch (e) {
    console.error('[GET /api/jardins/:id/disponibilites]', e.code, e.message);
    res.json([]); // renvoie [] en cas d’erreur pour éviter l'erreur rouge côté front
  }
});

module.exports = router;
