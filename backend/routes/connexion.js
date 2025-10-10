const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Champs manquants' });
    }

    const user = await prisma.utilisateur.findFirst({
      where: { email },
      select: {
        id_utilisateur: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        mot_de_passe: true,
      },
    });

    if (!user || user.mot_de_passe !== mot_de_passe) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
    }

    const { mot_de_passe: _ignore, ...safe } = user;
    safe.id_utilisateur = Number(safe.id_utilisateur); // fix BigInt

    return res.json({ ok: true, message: 'Connexion réussie', user: safe });
  } catch (err) {
    console.error('ERREUR CONNEXION :', err);
    return res.status(500).json({ ok: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
