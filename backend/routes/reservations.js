// backend/routes/reservations.js
const express = require("express")
const { Pool } = require("pg")

const router = express.Router()

/* ====== PG Pool (SSL toggle) ====== */
const useSsl = String(process.env.DB_SSL || "false").toLowerCase() === "true"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

pool.on("error", (err) => {
  console.error("[PG POOL ERROR reservations]", err.message)
})

/**
 * GET /api/reservations?userId=1
 * → renvoie les réservations (jardin) de l’utilisateur (id_client)
 */
router.get("/", async (req, res) => {
  const userId = parseInt(req.query.userId, 10)

  console.log("[GET /api/reservations] query =", req.query)

  if (!userId) {
    return res.status(400).json({ error: "paramètre userId requis" })
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        r.id_reservation,
        r.id_jardin,
        r.start,
        r."end",
        r.statut,
        r.commentaires,
        j.titre,
        j.ville,
        j.adresse,
        j.photos->>0 AS photo_url   -- ✅ première photo du jardin
      FROM public.reservation_jardin r   -- ✅ bonne table (sans s)
      JOIN public.jardin j ON j.id_jardin = r.id_jardin
      WHERE r.id_client = $1
      ORDER BY r.start DESC
      `,
      [userId]
    )

    const now = new Date()

    const formatResa = (row) => ({
      id: row.id_reservation,
      idJardin: row.id_jardin,
      titre: row.titre || `Jardin #${row.id_jardin}`,
      lieu: row.ville || row.adresse || null,
      start: row.start,
      end: row.end,
      statut: row.statut,
      commentaires: row.commentaires,
      photoUrl: row.photo_url || null, // ✅ envoyé au front
    })

    const future = []
    const past = []

    for (const row of rows) {
      const resa = formatResa(row)
      if (new Date(row.end) >= now) {
        future.push(resa)
      } else {
        past.push(resa)
      }
    }

    return res.json({ future, past })
  } catch (err) {
    console.error("[GET /api/reservations] error", err)
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des réservations" })
  }
})

module.exports = router
