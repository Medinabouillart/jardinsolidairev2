const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.utilisateur.createMany({
    data: [
      {
        nom: 'Dupont',
        prenom: 'Alice',
        email: 'alice@example.com',
        mot_de_passe: 'password123',
        role: 'ami_du_vert',
        photo_profil: 'https://img.freepik.com/vecteurs-premium/icones-visages-jolies-filles-cheveux-colores-filles-gaies-cheveux-colores-illustration-vectorielle-isolee-fond-blanc_528104-490.jpg?w=826',
        biographie: "Herboriste passionnée, je cultive des plantes médicinales et prépare des tisanes pour toute la famille.",
        date_inscription: new Date(),
        telephone: '0601010101',
        adresse: '10 rue des Lilas, Paris',
        note_moyenne: 4.7,
      },
      {
        nom: 'Martin',
        prenom: 'Lucas',
        email: 'lucas@example.com',
        mot_de_passe: 'securepass',
        role: 'proprietaire',
        photo_profil: 'https://img.freepik.com/vecteurs-libre/photo-compte-profil-homme_24908-81754.jpg',
        biographie: "J’ai transformé mon terrain urbain en havre de biodiversité. J’accueille avec plaisir ceux qui veulent jardiner.",
        date_inscription: new Date(),
        telephone: '0602020202',
        adresse: '25 avenue des Champs, Lyon',
        note_moyenne: 4.9,
      },
      {
        nom: 'Durand',
        prenom: 'Emma',
        email: 'emma@example.com',
        mot_de_passe: 'mypassword',
        role: 'ami_du_vert',
        photo_profil: 'https://img.freepik.com/vecteurs-libre/femme-portant-lunettes_24908-81919.jpg',
        biographie: "Débutante enthousiaste, j’ai soif d’apprendre les bases du jardinage naturel et de la permaculture.",
        date_inscription: new Date(),
        telephone: '0603030303',
        adresse: '3 rue Verte, Marseille',
        note_moyenne: 4.5,
      },
      {
        nom: 'Bernard',
        prenom: 'Hugo',
        email: 'hugo@example.com',
        mot_de_passe: 'pass1234',
        role: 'proprietaire',
        photo_profil: 'https://img.freepik.com/vecteurs-libre/homme-blond-lunettes_24908-81528.jpg',
        biographie: "Mon jardin, c’est mon refuge. J’y cultive légumes, fleurs et idées. Toujours heureux de partager cet espace.",
        date_inscription: new Date(),
        telephone: '0604040404',
        adresse: '18 rue de l’Admin, Lille',
        note_moyenne: 4.8,
      },
      {
        nom: 'Lemoine',
        prenom: 'Chloé',
        email: 'chloe@example.com',
        mot_de_passe: 'abc123',
        role: 'ami_du_vert',
        photo_profil: 'https://img.freepik.com/vecteurs-libre/photo-compte-profil-femme_24908-81036.jpg',
        biographie: "Fascinée par les fleurs comestibles et les plantes grimpantes, je cherche à en apprendre davantage chaque jour.",
        date_inscription: new Date(),
        telephone: '0605050505',
        adresse: '5 allée des Roses, Toulouse',
        note_moyenne: 4.6,
      }
    ],
  });

  console.log('✅ Utilisateurs insérés.');

  // 🔁 Étape 2 – Attribution des compétences aux amis_du_vert
  const amisDuVert = await prisma.utilisateur.findMany({
    where: { role: 'ami_du_vert' }
  });

  const competences = await prisma.competence.findMany();

  function getRandomCompetences(array, n) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  for (const utilisateur of amisDuVert) {
    const selection = getRandomCompetences(competences, 3); // ou 2
    for (const comp of selection) {
      await prisma.utilisateurCompetence.create({
        data: {
          id_utilisateur: utilisateur.id_utilisateur,
          id_competence: comp.id_competence
        }
      });
    }
    console.log(`🔗 Compétences liées à ${utilisateur.prenom} ${utilisateur.nom}`);
  }
}

// 🔚 Ne pas mettre dans la fonction main
main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
