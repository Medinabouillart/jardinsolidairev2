// e2e/parcours-reservation.spec.js
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// Créneau fictif pour le calendrier (aujourd'hui 10h-11h)
function buildFakeDispos() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    10,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    11,
    0,
    0
  );

  return [
    {
      id_dispo: 1,
      start: start.toISOString(),
      end: end.toISOString(),
    },
  ];
}

// Jardinier fictif utilisé partout
const FAKE_GARDENER = {
  id_utilisateur: 1,
  prenom: 'Jean',
  nom: 'Test',
  ville: 'Paris',
  biographie: 'Jardinier de test (mock E2E).',
  competences: ['Taille des haies', 'Désherbage'],
};

test.describe('Parcours complet : inscription → connexion → réservation → validation', () => {
  test.beforeEach(async ({ page }) => {
    // On neutralise les alert() / confirm() pour ne pas bloquer le test
    await page.addInitScript(() => {
      window.alert = () => {};
      window.confirm = () => true;
      window.prompt = () => null;
    });

    // 1) Mock API inscription : POST /api/inscription/register
    await page.route('**/api/inscription/register', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      const body = route.request().postDataJSON() || {};
      const user = {
        id_utilisateur: 1,
        role: body.role || 'proprietaire',
        prenom: body.prenom || 'Medina',
        nom: body.nom || 'Test',
        email: body.email || 'test@example.com',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user }),
      });
    });

    // 2) Mock API connexion : POST /api/connexion
    await page.route('**/api/connexion', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      const user = {
        id_utilisateur: 1,
        role: 'proprietaire',
        prenom: 'Medina',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user, token: 'fake-token' }),
      });
    });

    // 3) Mock liste des jardiniers : GET /api/jardiniers?...
    await page.route('**/api/jardiniers**', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([FAKE_GARDENER]),
      });
    });

    // 4) Mock dispos calendrier : GET /api/reservation_jardiniers/:id/disponibilites
    await page.route(
      '**/api/reservation_jardiniers/**/disponibilites**',
      async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(buildFakeDispos()),
        });
      }
    );

    // 5) Mock validation réservation : POST /api/confirmation_reservation_jardiniers
    await page.route(
      '**/api/confirmation_reservation_jardiniers',
      async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            reservation: { id_reservation: 123 },
          }),
        });
      }
    );
  });

  test('Création de compte → connexion → réservation jardinier → page de validation', async ({ page }) => {
    const email = `proprio+${Date.now()}@test.com`;
    const password = 'Test1234!';

    // 1) INSCRIPTION EN TANT QUE PROPRIÉTAIRE
    await page.goto(`${BASE_URL}/inscription`);

    await page.getByPlaceholder('Votre prénom').fill('Medina');
    await page.getByPlaceholder('Votre nom').fill('Bouillart');
    await page.getByPlaceholder('Votre adresse e-mail').fill(email);
    await page.locator('input[name="date_naissance"]').fill('1998-01-01');
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('select[name="role"]').selectOption('proprietaire');

    await page.getByRole('button', { name: /s'inscrire|s’inscrire/i }).click();

    // Après mock inscription → redirection vers /jardiniers
    await page.waitForURL('**/jardiniers');

    // 2) CONNEXION (comme tu voulais : on passe par /connexion)
    await page.goto(`${BASE_URL}/connexion`);
    await page.getByPlaceholder('Adresse e-mail').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Après mock connexion → /jardiniers
    await page.waitForURL('**/jardiniers');

    // 3) LISTE JARDINIERS → clic sur "En savoir plus"
    const lienJardinier = page
      .getByRole('link', { name: /en savoir plus/i })
      .first();

    await lienJardinier.click();

    // On est sur /reservation_jardiniers/[id] avec le calendrier
    await expect(page.getByText(/créneaux disponibles/i)).toBeVisible();

    // 4) Sélection d’un créneau 10:00 - 11:00 (mocké)
    const event = page.getByText('10:00 - 11:00');
    await event.click();

    const btnReserver = page.getByRole('button', { name: /réserver/i });
    await expect(btnReserver).toBeEnabled();

    await btnReserver.click();

    // 5) On arrive sur /confirmation_reservation_jardiniers?... (URL avec les paramètres)
    await page.waitForURL('**/confirmation_reservation_jardiniers**');

    // 6) On confirme la réservation sur la page de confirmation
    const btnConfirmer = page.getByRole('button', {
      name: /confirmer la réservation/i,
    });
    await btnConfirmer.click();

    // Le mock API renvoie un id_reservation, le front redirige vers /validation_reservation_jardiniers...
    await page.waitForURL('**/validation_reservation_jardiniers**');

    // 7) On vérifie que la page de validation affiche bien le message de succès
    await expect(
      page.getByText(/votre réservation a bien été validée/i)
    ).toBeVisible();
  });
});
