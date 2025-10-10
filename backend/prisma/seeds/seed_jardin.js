const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 🔍 On récupère les bons utilisateurs via leur email
  const lucas = await prisma.utilisateur.findUnique({
    where: { email: 'lucas@example.com' },
  });

  const hugo = await prisma.utilisateur.findUnique({
    where: { email: 'hugo@example.com' },
  });

  // 🔁 Vérification basique
  if (!lucas || !hugo) {
    throw new Error("Lucas ou Hugo n'existe pas. Vérifie leurs emails dans seed_utilisateur.js !");
  }

  // 🪴 Insertion des jardins liés aux bons utilisateurs
  await prisma.jardin.createMany({
    data: [
      {
        id_proprietaire: lucas.id_utilisateur,
        titre: 'Jardin fleuri de Lucas',
        description: 'Un jardin lumineux avec beaucoup de fleurs.',
        adresse: '25 avenue des Champs, Lyon',
        superficie: 40,
        type: 'fleurs',
        besoins: 'arrosage, désherbage',
        photos: JSON.stringify([
          'https://img.freepik.com/photos-gratuite/beau-parc-verdoyant_1417-1447.jpg?t=st=1745587481~exp=1745591081~hmac=f6c641fa958eb9bc7979c1a5e4496a66566577bb138d773bdf1d05dd87b78741&w=1380'
        ]),
        date_publication: new Date(),
        statut: 'disponible',
        note_moyenne: 4.9,
      },
      {
        id_proprietaire: hugo.id_utilisateur,
        titre: 'Potager de Hugo',
        description: 'Grand potager à partager avec un passionné.',
        adresse: '18 rue de l’Admin, Lille',
        superficie: 60,
        type: 'potager',
        besoins: 'plantation, entretien',
        photos: JSON.stringify([
          'https://img.freepik.com/photos-gratuite/sentier-sous-belle-arche-fleurs-plantes_181624-16890.jpg?t=st=1745587455~exp=1745591055~hmac=7a9d020aeee0dc84eb5267df6574f6708ec268ec458dfa8505112fb531e40e96&w=1380'
        ]),
        date_publication: new Date(),
        statut: 'disponible',
        note_moyenne: 4.8,
      },
    ],
  });

  console.log('✅ Jardins insérés avec succès !');
}

main()
  .catch((e) => console.error('❌ Erreur dans la seed jardin :', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
