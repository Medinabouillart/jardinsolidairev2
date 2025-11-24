// routes/ajout_jardinier.js
const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

// ====== PG Pool (même logique que tes autres routes) ======
const useSsl = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("[PG POOL ERROR - ajout_jardinier]", err.message);
});

// ===== Helpers =====
function computeAgeFromDate(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function dateFromJourAndTime(jour_semaine, timeStr) {
  // jour_semaine 0-6, 0 = dimanche
  const today = new Date();
  const currentDow = today.getDay();
  const delta = (jour_semaine - currentDow + 7) % 7;
  const base = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + delta
  );

  const [h = "00", m = "00", s = "00"] = String(timeStr || "00:00:00").split(":");
  base.setHours(Number(h) || 0, Number(m) || 0, Number(s) || 0, 0);

  return base.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

async function saveGardenerProfile(client, userId, payload) {
  const {
    photo_profil,
    biographie,
    ville,
    cp,
    // age est reçu mais pas stocké tel quel en base
    competences_ids = [],
    is_posted,
    disponibilites = [],
  } = payload;

  const isPostedBool = Boolean(is_posted);
  const statut = isPostedBool ? "active" : "paused"; // en fonction de ta colonne statut_annonce_jardinier

  // 1) Mise à jour du profil dans utilisateur
  await client.query(
    `
    UPDATE utilisateur
    SET photo_profil = $1,
        biographie = $2,
        ville = $3,
        code_postal = $4,
        is_posted = $5,
        statut_annonce_jardinier = $6
    WHERE id_utilisateur = $7
  `,
    [
      photo_profil || null,
      biographie || null,
      ville || null,
      cp || null,
      isPostedBool,
      statut,
      userId,
    ]
  );

  // 2) Compétences → table "utilisateurCompetence"
  await client.query(
    `DELETE FROM "utilisateurCompetence" WHERE id_utilisateur = $1`,
    [userId]
  );

  if (Array.isArray(competences_ids) && competences_ids.length > 0) {
    const cleanIds = competences_ids
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n));

    if (cleanIds.length > 0) {
      const values = cleanIds
        .map((idComp, idx) => `($1, $${idx + 2})`)
        .join(", ");

      await client.query(
        `
        INSERT INTO "utilisateurCompetence" (id_utilisateur, id_competence)
        VALUES ${values}
      `,
        [userId, ...cleanIds]
      );
    }
  }

  // 3) Disponibilités → table disponibilite_jardinier
  await client.query(
    `DELETE FROM disponibilite_jardinier WHERE id_utilisateur = $1`,
    [userId]
  );

  if (Array.isArray(disponibilites) && disponibilites.length > 0) {
    for (const slot of disponibilites) {
      if (!slot || !slot.start || !slot.end) continue;

      const dStart = new Date(slot.start);
      const dEnd = new Date(slot.end);
      if (Number.isNaN(dStart.getTime()) || Number.isNaN(dEnd.getTime())) continue;

      const jour = dStart.getDay(); // 0 = dimanche
      const heure_debut = dStart.toTimeString().slice(0, 8); // HH:MM:SS
      const heure_fin = dEnd.toTimeString().slice(0, 8);

      await client.query(
        `
        INSERT INTO disponibilite_jardinier (
          id_utilisateur, jour_semaine, heure_debut, heure_fin, actif, statut
        ) VALUES ($1, $2, $3::time, $4::time, true, 'en_attente')
      `,
        [userId, jour, heure_debut, heure_fin]
      );
    }
  }

  return { id_utilisateur: userId, is_posted: isPostedBool };
}

// ======================= ROUTES POUR ajout_jardinier =======================

// 🔹 GET /api/jardiniers/mon?user=ID
router.get("/mon", async (req, res) => {
  const userId = Number(req.query.user);
  if (!userId) {
    return res.status(400).json({ error: "Paramètre 'user' manquant ou invalide." });
  }

  const client = await pool.connect();
  try {
    const { rows: userRows } = await client.query(
      `
      SELECT
        id_utilisateur,
        prenom,
        nom,
        photo_profil,
        biographie,
        ville,
        code_postal,
        date_naissance,
        is_posted,
        statut_annonce_jardinier,
        visibility,
        zone_intervention_km
      FROM utilisateur
      WHERE id_utilisateur = $1
    `,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(204).send(); // pas de profil
    }

    const u = userRows[0];

    const { rows: compRows } = await client.query(
      `
      SELECT id_competence
      FROM "utilisateurCompetence"
      WHERE id_utilisateur = $1
    `,
      [userId]
    );

    const { rows: dispoRows } = await client.query(
      `
      SELECT id_dispo, jour_semaine, heure_debut, heure_fin, actif, statut
      FROM disponibilite_jardinier
      WHERE id_utilisateur = $1
      ORDER BY jour_semaine, heure_debut
    `,
      [userId]
    );

    const age = computeAgeFromDate(u.date_naissance);

    const disponibilites = dispoRows
      .filter((d) => d.actif !== false)
      .map((d) => ({
        id_dispo: d.id_dispo,
        start: dateFromJourAndTime(d.jour_semaine, d.heure_debut),
        end: dateFromJourAndTime(d.jour_semaine, d.heure_fin),
        statut: d.statut,
      }));

    const data = {
      id_utilisateur: u.id_utilisateur,
      prenom: u.prenom,
      nom: u.nom,
      photo_profil: u.photo_profil,
      biographie: u.biographie,
      ville: u.ville,
      cp: u.code_postal,
      code_postal: u.code_postal,
      date_naissance: u.date_naissance,
      age,
      is_posted: u.is_posted,
      statut_annonce_jardinier: u.statut_annonce_jardinier,
      visibility: u.visibility,
      zone_intervention_km: u.zone_intervention_km,
      competences_ids: compRows.map((c) => c.id_competence),
      disponibilites,
    };

    res.json(data);
  } catch (err) {
    console.error("[GET /api/jardiniers/mon] error", err);
    res.status(500).json({ error: "Erreur lors de la récupération du profil jardinier." });
  } finally {
    client.release();
  }
});

// 🔹 POST /api/jardiniers  (création / brouillon / publication)
router.post("/", async (req, res) => {
  const payload = req.body || {};
  const userId = Number(payload.id_utilisateur);

  if (!userId) {
    return res
      .status(400)
      .json({ error: "id_utilisateur est obligatoire dans le body." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await saveGardenerProfile(client, userId, payload);

    await client.query("COMMIT");
    res.json(result);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/jardiniers] error", err);
    res
      .status(500)
      .json({ error: "Erreur lors de l’enregistrement du profil jardinier." });
  } finally {
    client.release();
  }
});

// 🔹 PUT /api/jardiniers/:id  (modifs + retirer l’annonce)
router.put("/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ error: "Paramètre :id invalide." });
  }

  const payload = req.body || {};
  if (!payload.id_utilisateur) {
    payload.id_utilisateur = userId;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Cas spécial : seulement is_posted (retrait de l’annonce)
    if (
      Object.keys(payload).length === 1 &&
      Object.prototype.hasOwnProperty.call(payload, "is_posted")
    ) {
      const isPostedBool = Boolean(payload.is_posted);
      const statut = isPostedBool ? "active" : "paused";

      await client.query(
        `
        UPDATE utilisateur
        SET is_posted = $1,
            statut_annonce_jardinier = $2
        WHERE id_utilisateur = $3
      `,
        [isPostedBool, statut, userId]
      );

      await client.query("COMMIT");
      return res.json({ id_utilisateur: userId, is_posted: isPostedBool });
    }

    const result = await saveGardenerProfile(client, userId, payload);

    await client.query("COMMIT");
    res.json(result);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PUT /api/jardiniers/:id] error", err);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du profil jardinier." });
  } finally {
    client.release();
  }
});

module.exports = router;
