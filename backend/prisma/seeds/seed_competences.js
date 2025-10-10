const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const competences = [
  "Jardin potager 🍅",
  "Création florale 🌸",
  "Permaculture douce 🌿",
  "Transmission & apprentissage 📚",
  "Tonte & soin des pelouses ✂️"
];

  for (const nom of competences) {
    await prisma.competence.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
  }

  console.log("✅ Compétences insérées !");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
