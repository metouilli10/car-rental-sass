import { expect, test, type Page } from "@playwright/test";

const OWNER_EMAIL = "owner@automaroc.ma";
const OWNER_PASSWORD = "password123";

async function resetOwner(page: Page) {
  const response = await page.request.post("/api/dev/reset-owner");
  expect(response.ok()).toBeTruthy();
}

async function loginAsOwner(page: Page) {
  await resetOwner(page);
  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(OWNER_EMAIL);
  await page.getByLabel("Mot de passe").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
}

test.describe("owner user flows", () => {
  test("can sign in from the login page and reach the dashboard", async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.getByText("Réservations actives")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("can navigate the main authenticated sections", async ({ page }) => {
    await loginAsOwner(page);

    await page.getByRole("link", { name: "Véhicules" }).click();
    await page.waitForURL("**/vehicles");
    await expect(page.getByRole("heading", { name: "Véhicules" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ajouter un véhicule/i })).toBeVisible();

    await page.getByRole("link", { name: "Clients" }).click();
    await page.waitForURL("**/customers");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

    await page.getByRole("link", { name: "Réservations" }).click();
    await page.waitForURL("**/bookings");
    await expect(page.getByRole("heading", { name: "Réservations" })).toBeVisible();
    await expect(page.getByPlaceholder(/Rechercher client/i)).toBeVisible();

    await page.getByRole("link", { name: "Finance" }).click();
    await page.waitForURL("**/finance**");
    await expect(page.getByRole("heading", { name: "Finance Center" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ajouter une charge/i })).toBeVisible();
  });

  test("can create a vehicle", async ({ page }) => {
    await loginAsOwner(page);

    const suffix = Date.now().toString().slice(-6);
    const plate = `1${suffix.slice(0, 3)} A ${suffix.slice(3)}`;
    const model = `E2E-${suffix}`;

    await page.goto("/vehicles/add");
    await expect(page.getByRole("heading", { name: "Ajouter un véhicule" })).toBeVisible();

    await page.getByLabel("Marque").fill("Dacia");
    await page.getByLabel("Modèle").fill(model);
    await page.getByLabel("Année").fill("2024");
    await page.getByLabel("Plaque d'immatriculation").fill(plate);
    await page.getByLabel("Couleur").fill("Noir");
    await page.getByRole("button", { name: "Suivant" }).click();

    await expect(page.getByRole("heading", { name: /Tarification & statut/i })).toBeVisible();
    await page.getByLabel("Prix par jour").fill("333");
    await page.getByRole("button", { name: "Ajouter le véhicule" }).click();

    await page.waitForURL("**/vehicles", { timeout: 30_000 });
    await expect(page.getByText(model).first()).toBeVisible();
    await expect(page.getByText(plate).first()).toBeVisible();
  });

  test("can create a customer", async ({ page }) => {
    await loginAsOwner(page);

    const suffix = Date.now().toString().slice(-6);
    const name = `E2E Client ${suffix}`;
    const phone = `+212600${suffix}`;
    const identity = `E2E${suffix}`;
    const email = `e2e-${suffix}@example.com`;

    await page.goto("/customers/add");
    await expect(page.getByRole("heading", { name: "Ajouter un client" })).toBeVisible();

    await page.getByLabel("Nom complet *").fill(name);
    await page.getByLabel("Téléphone (WhatsApp) *").fill(phone);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Passeport ou CIN *").fill(identity);
    await page.getByRole("button", { name: "Ajouter le client" }).click();

    await page.waitForURL("**/customers", { timeout: 30_000 });
    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(email);
  });

  test("mobile booking wizard shows live summary and can create/select a client", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsOwner(page);

    await page.goto("/bookings/create");
    await expect(page.getByRole("heading", { name: "Nouvelle réservation" })).toBeVisible();

    const dateInputs = page.locator('main input[type="datetime-local"]');
    await dateInputs.nth(0).fill("2030-01-10T10:00");
    await dateInputs.nth(1).fill("2030-01-13T10:00");

    await page.locator('label:has-text("Véhicule *")').locator("..").getByRole("combobox").click();
    await page.getByRole("option", { name: /Disponible|Libre sur ces dates/i }).first().click();

    await page.getByRole("button", { name: /Vue d'ensemble/i }).click();
    await expect(page.getByRole("heading", { name: "Résumé réservation" })).toBeVisible();
    await expect(page.getByLabel("Résumé réservation").getByText(/Restant:/i)).toBeVisible();
    await page.getByRole("button", { name: "Fermer" }).click();

    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText("Sélectionnez le conducteur ou la société")).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    const name = `Mobile Client ${suffix}`;
    const phone = `+212611${suffix}`;
    const identity = `MOB${suffix}`;

    await page.getByRole("button", { name: /\+ Nouveau client/i }).click();
    await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
    await page.getByLabel("Nom complet *").fill(name);
    await page.getByLabel("Téléphone (WhatsApp) *").fill(phone);
    await page.getByLabel("Passeport ou CIN *").fill(identity);
    await page.getByRole("button", { name: "Ajouter et sélectionner" }).click();

    await expect(page.getByText("Client sélectionné")).toBeVisible();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  });
});
