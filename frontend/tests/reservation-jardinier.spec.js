// reservation-jardinier.spec.js
import { test, expect } from '@playwright/test';

test.describe('Parcours propriétaire - Jardin Solidaire', () => {
  test('Inscription → Connexion propriétaire → Réservation d’un jardinier', async ({ page }) => {
    const email = `proprio+${Date.now()}@test.com`;
    const password = 'Test1234!';

    // 1) INSCRIPTION PROPRIÉTAIRE
    await page.goto('/inscription'); // adapte si ton URL est différente

    await page.getByLabel(/nom/i).fill('Dupont');
    await page.getByLabel(/prénom/i).fill('Marie');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    // si c'est un select :
    //   <select name="role"> <option value="proprietaire">Propriétaire</option> ...
    await page.getByLabel(/rôle/i).selectOption('proprietaire');

    await page.getByRole('button', { name: /créer mon compte|inscription/i }).click();

    await expect(
      page.getByText(/compte créé|inscription réussie|bienvenue/i)
    ).toBeVisible();

    // 2) CONNEXION AVEC CE COMPTE
    await page.goto('/connexion'); // adapte si besoin

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mot de passe/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // On vérifie qu'on voit bien l'interface propriétaire
    await expect(
      page.getByRole('button', { name: /j’ai un jardin|mon jardin/i })
    ).toBeVisible();

    // 3) ACCÈS À LA PAGE DE RÉSERVATION
    await page.getByRole('button', { name: /j’ai un jardin|mon jardin/i }).click();

    // adapte l’URL selon ton routing (ex: /reservation-jardinier)
    await page.goto('/reservation/jardinier');

    await expect(
      page.getByRole('heading', { name: /réserver un jardinier/i })
    ).toBeVisible();

    // 4) CHOIX D’UN JARDINIER + JARDIN + CRÉNEAU
    // 👉 ici le mieux est d’ajouter des data-testid dans ton code React
    // Ex dans ton select : <select data-testid="select-jardinier">...</select>
    await page.getByTestId('select-jardinier').selectOption({ index: 0 });
    await page.getByTestId('select-jardin').selectOption({ index: 0 });

    // Idem pour un créneau dans ton calendrier :
    // <button data-testid="slot-2025-01-01-10:00">10:00</button>
    await page.getByTestId('slot-2025-01-01-10:00').click();

    // 5) VALIDATION
    await page.getByRole('button', { name: /valider la réservation/i }).click();

    await expect(
      page.getByText(/réservation enregistrée|réservation confirmée/i)
    ).toBeVisible();
  });

  test('Utilisateur NON connecté ne peut pas réserver un jardinier', async ({ page, context }) => {
    // On s’assure qu’il n’y a pas de session
    await context.clearCookies();

    // Accès direct à la page de réservation
    await page.goto('/reservation/jardinier'); // adapte l’URL

    // Cas 1 : redirection vers la connexion
    // (si tu n’as pas ça, commente cette ligne)
    await expect(page).toHaveURL(/connexion|login/);

    // Cas 2 : message d’erreur
    await expect(
      page.getByText(/connecté pour réserver|vous devez être connecté/i)
    ).toBeVisible();

    // Optionnel : on vérifie que le bouton de réservation n’est pas utilisable
    const boutonResa = page.getByRole('button', { name: /valider la réservation/i });
    await expect(boutonResa).toBeDisabled();
  });
});
