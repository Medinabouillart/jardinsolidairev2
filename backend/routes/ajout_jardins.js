// routes/ajout_jardins.js (CommonJS, upsert + disponibilités + profil)
const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

const useSsl = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

// 🔧 helper pour sync les disponibilités en base
async function syncDisponibilites(idJardin, disponibilitesRaw) {
  const id = Number(idJardin);
  if (!isPositiveInt(id)) return;

  const list = Array.isArray(disponibilitesRaw) ? disponibilitesRaw : [];
  const clean = list
    .map((d) => ({
      start: d.start || d.debut || d.date_debut,
      end: d.end || d.fin || d.date_fin,
    }))
    .filter((d) => d.start && d.end);

  const client = await pool.connect();
  try {
    console.log(
      "[ajout_jardins] syncDisponibilites - id_jardin =",
      id,
      "- créneaux reçus :",
      clean
    );

    await client.query("BEGIN");
    await client.query("DELETE FROM public.disponibilite_jardin WHERE id_jardin = $1", [id]);

    for (const d of clean) {
      await client.query(
        `INSERT INTO public.disponibilite_jardin (id_jardin, start, "end")
         VALUES ($1, $2::timestamptz, $3::timestamptz)`,
        [id, d.start, d.end]
      );
    }

    await client.query("COMMIT");
    console.log(
      "[ajout_jardins] syncDisponibilites - sauvegarde OK pour id_jardin =",
      id,
      "- nb créneaux =",
      clean.length
    );
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[ajout_jardins] syncDisponibilites erreur", e);
  } finally {
    client.release();
  }
}

/* GET /api/ajout_jardins/mon?owner=7 */
router.get("/mon", async (req, res) => {
  const owner = Number(req.query.owner);
  if (!isPositiveInt(owner)) {
    console.error("[GET /ajout_jardins/mon] owner invalide :", req.query.owner);
    return res.status(400).json({ error: "owner obligatoire" });
  }

  try {
    const sql = `
      SELECT
        j.*,
        COALESCE(
          (
            SELECT jsonb_agg(
                     jsonb_build_object(
                       'id_dispo', dj.id_dispo,
                       'start', dj.start,
                       'end',   dj."end"
                     )
                     ORDER BY dj.start
                   )
            FROM public.disponibilite_jardin dj
            WHERE dj.id_jardin = j.id_jardin
          ),
          '[]'::jsonb
        ) AS disponibilites
      FROM public.jardin j
      WHERE j.id_proprietaire = $1
      ORDER BY j.id_jardin DESC
      LIMIT 1
    `;
    const r = await pool.query(sql, [owner]);
    if (!r.rows.length) return res.status(204).end();
    return res.json(r.rows[0]);
  } catch (e) {
    console.error("[GET /ajout_jardins/mon] Erreur SQL :", e);
    return res.status(500).json({ error: e.message });
  }
});

/* POST /api/ajout_jardins  (UPSERT par id_proprietaire) */
router.post("/", async (req, res) => {
  try {
    const {
      id_proprietaire,
      // 🔽 profil envoyé depuis le front
      photo_profil,
      biographie,
      // 🔽 jardin
      titre,
      adresse,
      description,
      photos = [],
      competences_ids = [],
      type,
      ville,
      code_postal,
      superficie,
      is_posted = false,
      disponibilites = [], // 👈
    } = req.body;

    const ownerId = Number(id_proprietaire);
    if (!isPositiveInt(ownerId)) {
      console.error("[POST /ajout_jardins] id_proprietaire invalide :", id_proprietaire);
      return res.status(400).json({ error: "id_proprietaire obligatoire" });
    }

    const sql = `
      INSERT INTO public.jardin (
        id_proprietaire, titre, adresse, description,
        photos, competences_ids, type, ville, code_postal, superficie,
        is_posted, visibility
      ) VALUES (
        $1,$2,$3,$4,
        $5::jsonb, $6::jsonb, $7, $8, $9, $10,
        $11, 'public'
      )
      ON CONFLICT (id_proprietaire) DO UPDATE SET
        titre           = EXCLUDED.titre,
        adresse         = EXCLUDED.adresse,
        description     = EXCLUDED.description,
        photos          = EXCLUDED.photos,
        competences_ids = EXCLUDED.competences_ids,
        type            = EXCLUDED.type,
        ville           = EXCLUDED.ville,
        code_postal     = EXCLUDED.code_postal,
        superficie      = EXCLUDED.superficie,
        is_posted       = EXCLUDED.is_posted,
        visibility      = EXCLUDED.visibility
      RETURNING *;
    `;
    const params = [
      ownerId,
      titre || "",
      adresse || "",
      description || "",
      JSON.stringify(photos || []),
      JSON.stringify(competences_ids || []),
      type || null,
      ville || null,
      code_postal || null,
      (superficie ?? null),
      !!is_posted,
    ];

    const r = await pool.query(sql, params);
    const jardin = r.rows[0];

    console.log("[POST /ajout_jardins] jardin enregistré :", {
      id_jardin: jardin.id_jardin,
      id_proprietaire: jardin.id_proprietaire,
      titre: jardin.titre,
      ville: jardin.ville,
      code_postal: jardin.code_postal,
      is_posted: jardin.is_posted,
    });

    // 🔹 MAJ du profil utilisateur ici (photo + bio)
    try {
      const up = await pool.query(
        `
          UPDATE public.utilisateur
          SET photo_profil = COALESCE($2, photo_profil),
              biographie   = COALESCE($3, biographie)
          WHERE id_utilisateur = $1
          RETURNING id_utilisateur, photo_profil, biographie;
        `,
        [ownerId, photo_profil ?? null, biographie ?? null]
      );
      if (up.rows.length) {
        console.log("[POST /ajout_jardins] profil mis à jour :", up.rows[0]);
      } else {
        console.warn("[POST /ajout_jardins] aucun utilisateur mis à jour pour id =", ownerId);
      }
    } catch (e) {
      console.error("[POST /ajout_jardins] erreur MAJ profil utilisateur :", e);
    }

    // 👉 sync des disponibilités dans la table dédiée
    await syncDisponibilites(jardin.id_jardin, disponibilites);

    return res.status(201).json(jardin);
  } catch (e) {
    console.error("[POST /ajout_jardins] Erreur SQL :", e);
    return res.status(500).json({ error: e.message });
  }
});

/* PUT /api/ajout_jardins/:id */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isPositiveInt(id)) {
    console.error("[PUT /ajout_jardins/:id] id invalide :", req.params.id);
    return res.status(400).json({ error: "id invalide" });
  }

  try {
    const {
      id_proprietaire,
      // 🔽 profil
      photo_profil,
      biographie,
      // 🔽 jardin
      titre,
      adresse,
      description,
      photos,
      competences_ids,
      type,
      ville,
      code_postal,
      superficie,
      is_posted,
      disponibilites = [], // 👈
    } = req.body;

    const sql = `
      UPDATE public.jardin
      SET
        id_proprietaire = COALESCE($1, id_proprietaire),
        titre           = COALESCE($2, titre),
        adresse         = COALESCE($3, adresse),
        description     = COALESCE($4, description),
        photos          = COALESCE($5::jsonb, photos),
        competences_ids = COALESCE($6::jsonb, competences_ids),
        type            = COALESCE($7, type),
        ville           = COALESCE($8, ville),
        code_postal     = COALESCE($9, code_postal),
        superficie      = COALESCE($10, superficie),
        is_posted       = COALESCE($11, is_posted)
      WHERE id_jardin = $12
      RETURNING *;
    `;
    const params = [
      isPositiveInt(Number(id_proprietaire)) ? Number(id_proprietaire) : null,
      titre ?? null,
      adresse ?? null,
      description ?? null,
      Array.isArray(photos) ? JSON.stringify(photos) : null,
      Array.isArray(competences_ids) ? JSON.stringify(competences_ids) : null,
      type ?? null,
      ville ?? null,
      code_postal ?? null,
      (superficie ?? null),
      typeof is_posted === "boolean" ? is_posted : null,
      id,
    ];

    const r = await pool.query(sql, params);
    if (!r.rows.length) {
      console.error("[PUT /ajout_jardins/:id] Jardin introuvable pour id_jardin =", id);
      return res.status(404).json({ error: "Jardin introuvable" });
    }

    const jardin = r.rows[0];

    console.log("[PUT /ajout_jardins/:id] update OK :", {
      id_jardin: jardin.id_jardin,
      id_proprietaire: jardin.id_proprietaire,
      titre: jardin.titre,
      ville: jardin.ville,
      code_postal: jardin.code_postal,
      is_posted: jardin.is_posted,
    });

    // 🔹 MAJ du profil utilisateur ici aussi
    const ownerId = isPositiveInt(Number(id_proprietaire))
      ? Number(id_proprietaire)
      : Number(jardin.id_proprietaire);

    if (isPositiveInt(ownerId)) {
      try {
        const up = await pool.query(
          `
            UPDATE public.utilisateur
            SET photo_profil = COALESCE($2, photo_profil),
                biographie   = COALESCE($3, biographie)
            WHERE id_utilisateur = $1
            RETURNING id_utilisateur, photo_profil, biographie;
          `,
          [ownerId, photo_profil ?? null, biographie ?? null]
        );
        if (up.rows.length) {
          console.log("[PUT /ajout_jardins/:id] profil mis à jour :", up.rows[0]);
        } else {
          console.warn("[PUT /ajout_jardins/:id] aucun utilisateur mis à jour pour id =", ownerId);
        }
      } catch (e) {
        console.error("[PUT /ajout_jardins/:id] erreur MAJ profil utilisateur :", e);
      }
    }

    // 👉 sync des disponibilités
    console.log("[PUT /ajout_jardins/:id] payload disponibilites reçu =", disponibilites);
    await syncDisponibilites(jardin.id_jardin, disponibilites);

    return res.json(jardin);
  } catch (e) {
    console.error("[PUT /ajout_jardins/:id] Erreur SQL :", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
