const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 🔍 On récupère les bons utilisateurs et jardins
  const utilisateurLucas = await prisma.utilisateur.findUnique({ where: { email: 'lucas@example.com' } });
  const utilisateurHugo  = await prisma.utilisateur.findUnique({ where: { email: 'hugo@example.com' } });

  const jardinLucas = await prisma.jardin.findFirst({ where: { titre: 'Jardin fleuri de Lucas' } });
  const jardinHugo  = await prisma.jardin.findFirst({ where: { titre: 'Potager de Hugo' } });

  if (!utilisateurLucas || !utilisateurHugo || !jardinLucas || !jardinHugo) {
    throw new Error("Certains utilisateurs ou jardins n'ont pas été trouvés. Vérifie les seeds.");
  }

  // 📝 Création des réservations
  await prisma.reservation.createMany({
    data: [
      {
        id_utilisateur: utilisateurHugo.id_utilisateur,
        id_jardin: jardinLucas.id_jardin,
        id_disponibilite: null,
        statut: 'confirmée',
        commentaires: 'Je viendrai avec mes outils 🌿',
      },
      {
        id_utilisateur: utilisateurLucas.id_utilisateur,
        id_jardin: jardinHugo.id_jardin,
        id_disponibilite: null,
        statut: 'en attente',
        commentaires: 'Première expérience de jardinage !',
      },
    ],
  });

  console.log('✅ Réservations insérées avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'insertion des réservations :', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
