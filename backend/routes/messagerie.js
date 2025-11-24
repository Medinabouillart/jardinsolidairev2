// routes/messagerie.js
const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

/* ====== PG Pool (SSL toggle) ====== */
const useSsl = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("[PG POOL ERROR - MESSAGERIE]", err.message);
});

/* ====== Helper pour récupérer l'id utilisateur courant ====== */
function getCurrentUserId(req) {
  // 1) PRIORITÉ : query string ?userId=...
  const q = req.query || {};
  console.log("[MESSAGERIE] req.query =", q);

  if (q.userId) {
    const parsed = parseInt(q.userId, 10);
    if (!Number.isNaN(parsed)) {
      console.log("[MESSAGERIE] userId pris depuis req.query.userId =", parsed);
      return parsed;
    }
  }

  if (q.id_utilisateur) {
    const parsed = parseInt(q.id_utilisateur, 10);
    if (!Number.isNaN(parsed)) {
      console.log(
        "[MESSAGERIE] userId pris depuis req.query.id_utilisateur =",
        parsed
      );
      return parsed;
    }
  }

  // 2) Fallback : middleware d'auth (si un jour tu en mets un)
  if (req.user && req.user.id_utilisateur) return req.user.id_utilisateur;
  if (req.user && req.user.id) return req.user.id;
  if (req.utilisateur && req.utilisateur.id_utilisateur)
    return req.utilisateur.id_utilisateur;

  console.log("[MESSAGERIE] AUCUN USER TROUVÉ, req.user =", req.user);
  console.log("[MESSAGERIE] req.utilisateur =", req.utilisateur);
  return null;
}

/* ====== GET /messagerie/conversations ====== */
router.get("/conversations", async (req, res) => {
  const me = getCurrentUserId(req);
  if (!me) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    const query = `
      WITH conv AS (
        SELECT
          CASE
            WHEN id_envoyeur = $1 THEN id_destinataire
            ELSE id_envoyeur
          END AS other_id,
          id_message,
          id_envoyeur,
          id_destinataire,
          contenu,
          date_envoi,
          lu
        FROM public.messagerie
        WHERE id_envoyeur = $1 OR id_destinataire = $1
      ),
      last_msg AS (
        SELECT DISTINCT ON (other_id)
          other_id,
          id_message,
          contenu,
          date_envoi
        FROM conv
        ORDER BY other_id, date_envoi DESC
      ),
      unread AS (
        SELECT
          other_id,
          COUNT(*) AS unread_count
        FROM conv
        WHERE id_destinataire = $1
          AND lu = false
        GROUP BY other_id
      )
      SELECT
        u.id_utilisateur,
        u.prenom,
        u.nom,
        u.ville,
        u.photo_profil,
        l.contenu AS last_message,
        l.date_envoi AS last_date,
        COALESCE(un.unread_count, 0) AS unread_count
      FROM last_msg l
      JOIN public.utilisateur u ON u.id_utilisateur = l.other_id
      LEFT JOIN unread un ON un.other_id = l.other_id
      ORDER BY l.date_envoi DESC;
    `;

    const { rows } = await pool.query(query, [me]);
    return res.json(rows);
  } catch (err) {
    console.error("[MESSAGERIE] Erreur conversations:", err);
    return res
      .status(500)
      .json({ error: "Erreur lors du chargement des conversations." });
  }
});

/* ====== GET /messagerie/conversation/:id ====== */
router.get("/conversation/:id", async (req, res) => {
  const me = getCurrentUserId(req);
  if (!me) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const otherId = parseInt(req.params.id, 10);
  if (!otherId || Number.isNaN(otherId)) {
    return res
      .status(400)
      .json({ error: "Identifiant de destinataire invalide." });
  }
  if (otherId === me) {
    return res
      .status(400)
      .json({ error: "Vous ne pouvez pas ouvrir une conversation avec vous-même." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE public.messagerie
      SET lu = true
      WHERE id_envoyeur = $2
        AND id_destinataire = $1
        AND lu = false;
    `,
      [me, otherId]
    );

    const { rows } = await client.query(
      `
      SELECT
        m.id_message,
        m.id_envoyeur,
        m.id_destinataire,
        m.contenu,
        m.date_envoi,
        m.lu,
        (m.id_envoyeur = $1) AS is_mine
      FROM public.messagerie m
      WHERE (m.id_envoyeur = $1 AND m.id_destinataire = $2)
         OR (m.id_envoyeur = $2 AND m.id_destinataire = $1)
      ORDER BY m.date_envoi ASC;
    `,
      [me, otherId]
    );

    await client.query("COMMIT");
    return res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[MESSAGERIE] Erreur conversation:", err);
    return res
      .status(500)
      .json({ error: "Erreur lors du chargement de la conversation." });
  } finally {
    client.release();
  }
});

/* ====== POST /messagerie/conversation/:id ====== */
router.post("/conversation/:id", async (req, res) => {
  const me = getCurrentUserId(req);
  if (!me) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const otherId = parseInt(req.params.id, 10);
  if (!otherId || Number.isNaN(otherId)) {
    return res
      .status(400)
      .json({ error: "Identifiant de destinataire invalide." });
  }
  if (otherId === me) {
    return res
      .status(400)
      .json({ error: "Vous ne pouvez pas vous envoyer un message à vous-même." });
  }

  const { contenu } = req.body || {};
  if (!contenu || !String(contenu).trim()) {
    return res
      .status(400)
      .json({ error: "Le contenu du message est obligatoire." });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO public.messagerie (id_envoyeur, id_destinataire, contenu)
      VALUES ($1, $2, $3)
      RETURNING
        id_message,
        id_envoyeur,
        id_destinataire,
        contenu,
        date_envoi,
        lu,
        (id_envoyeur = $1) AS is_mine;
    `,
      [me, otherId, String(contenu).trim()]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[MESSAGERIE] Erreur envoi message:", err);
    return res
      .status(500)
      .json({ error: "Erreur lors de l’envoi du message." });
  }
});

module.exports = router;
