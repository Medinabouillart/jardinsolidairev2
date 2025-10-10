const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  const { prenom, nom, email, password, role } = req.body;
  console.log('🔍 Données reçues côté serveur :', req.body);

  if (!prenom || !nom || !email || !password || !role) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet e-mail est déjà utilisé.' });
    }

    const newUser = await prisma.utilisateur.create({
      data: {
        prenom,
        nom,
        email,
        mot_de_passe: password, // 👈 mot de passe en clair (temporaire)
        role,
        photo_profil: null,
        biographie: null,
        telephone: null,
        adresse: null,
        note_moyenne: null,
      },
    });

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        prenom: newUser.prenom,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Erreur serveur :', error);
    res.status(500).json({ error: 'Erreur lors de l’inscription.' });
  }
});

module.exports = router;
