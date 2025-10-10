const { exec } = require('child_process');

const seeds = [
  'seed_competences.js',   // ⚡ d'abord les compétences
  'seed_utilisateur.js',   // ensuite les utilisateurs
  'seed_jardin.js',
  'seed_reservation.js',
];

(async () => {
  for (const seedFile of seeds) {
    console.log(`▶ Exécution de ${seedFile}`);
    await new Promise((resolve, reject) => {
      exec(`node ${__dirname}/${seedFile}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Erreur dans ${seedFile} :`, error);
          reject(error);
          return;
        }
        console.log(stdout);
        resolve();
      });
    });
  }

  console.log('✅ Tous les seeds ont été exécutés avec succès.');
})();
