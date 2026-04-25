# Locaryx

Plateforme SaaS de gestion pour agences de location de voitures au Maroc.

Locaryx combine un back-office multi-tenant pour les équipes d'agence et une surface publique en cours de développement pour les demandes de réservation et le storefront agence.

## Fonctionnalités actuelles

- authentification par email/mot de passe avec NextAuth
- inscription propriétaire avec vérification email et approbation interne
- gestion multi-agence avec séparation par `agencyId`
- véhicules, clients, réservations, paiements, cautions et dépenses
- dashboard opérationnel, onboarding guidé et centre de notifications
- inspections / damage reports et infractions
- gestion des utilisateurs avec permissions effectives et overrides
- paramètres de site web agence et demandes de réservation storefront
- support PWA et infrastructure de notifications push web
- impression / export booking côté print routes

## Stack technique

- Next.js `15.1.4` - App Router
- React `19`
- TypeScript `5`
- Prisma `6`
- PostgreSQL via `prisma/schema.prisma`
- NextAuth `4`
- Tailwind CSS `3`, shadcn/ui, Radix UI
- Zod + React Hook Form
- Playwright présent dans le repo pour tests/outillage
- `web-push` pour les notifications push

## Prérequis

- Node.js `18+`
- npm
- une base PostgreSQL accessible
- idéalement Supabase si vous suivez `.env.example`

## Installation locale

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer l'environnement

Copiez `.env.example` vers `.env` puis remplissez les variables nécessaires.

```bash
cp .env.example .env
```

Variables minimales pour démarrer:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Générer `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Variables optionnelles selon les features utilisées:

- `PRIMARY_APP_DOMAIN` (utile si la détection des hosts internes ne doit pas dépendre uniquement de `NEXT_PUBLIC_APP_URL`)
- `VERCEL_API_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID` ou `VERCEL_TEAM_SLUG`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `PUSH_PROCESSOR_CRON_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `VERCEL_TOOLBAR_ENABLED` (`true` pour injecter la Vercel Toolbar hors dev)

### 3. Appliquer les migrations

```bash
npm run db:migrate
```

### 4. Seed de développement

```bash
npm run db:seed
```

Le seed crée notamment:

- 1 agence `Auto Maroc Location`
- 1 owner de démonstration `owner@automaroc.ma` / `password123`
- des véhicules, clients, réservations et paramètres de site web

### 5. Lancer l'application

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Parcours principaux en local

### Connexion

- page login: `http://localhost:3000/login`
- compte seed: `owner@automaroc.ma` / `password123`

### Dashboard

Le dashboard est locale-aware. Les routes réelles vivent sous `/{locale}/...`, par exemple:

- `/fr/dashboard`
- `/fr/vehicles`
- `/fr/bookings`
- `/ar/dashboard`

Le middleware peut rediriger les chemins dashboard non préfixés vers la locale active.

### Signup owner

Le flux d'inscription owner passe par:

1. `/signup`
2. vérification email
3. approbation interne
4. première connexion

### Storefront et domaines personnalisés

- la vitrine publique garde toujours un fallback slug Locaryx en `/{agencySlug}`
- une agence peut connecter un domaine personnalisé unique depuis `Paramètres > Site web`
- la vérification et le SSL passent par les APIs domaine de Vercel, donc les variables `VERCEL_*` doivent être configurées côté serveur
- les domaines personnalisés vérifiés deviennent canoniques; le slug Locaryx redirige alors vers le host vérifié

## Scripts utiles

- `npm run dev` - démarre le serveur local
- `npm run dev:turbopack` - variante Turbopack explicite
- `npm run build` - génère Prisma Client puis build Next.js
- `npm run build:db` - `prisma db push`, `prisma generate`, puis build
- `npm run start` - démarre l'app en mode production
- `npm run test` - exécute les tests Node présents sous `lib/**/*.test.ts`
- `npm run lint` - lint Next.js
- `npm run db:migrate` - migrations Prisma en local
- `npm run db:seed` - seed de dev
- `npm run db:reset` - reset complet de la base
- `npm run db:studio` - ouvre Prisma Studio
- `npm run deploy:check` - vérifie migrations + build avant déploiement
- `npm run i18n:audit` - audit simple des routes/messages i18n
- `npm run i18n:parity` - test de parité des messages i18n

## Architecture du repo

```text
app/
  (auth)/                       routes publiques: login, signup, setup, verify-email
  [locale]/(dashboard)/         dashboard multi-locale et protégé
  api/                          routes API internes, publiques et push
  storefront/                   surface publique storefront
  (print)/                      vues print / impression
components/
  layout/ shared/ ui/           shell, composants transverses et primitives UI
  bookings/ customers/ vehicles/ users/ settings/ ...
lib/
  actions/                      server actions
  push/                         logique push web
  storefront/                   logique publique / website settings / booking requests
  permissions.ts                matrice de permissions
  auth.ts                       NextAuth
prisma/
  schema.prisma                 schéma PostgreSQL
  migrations/                   historique des migrations
  seed.ts                       seed de développement
public/
  pwa/                          icônes et assets PWA
```

## Points d'attention techniques

### Multi-tenant

- toutes les données métier doivent rester scoppées par `agencyId`
- ne pas ajouter de requêtes Prisma cross-tenant par accident

### Permissions

- rôles disponibles: `OWNER`, `MANAGER`, `EMPLOYEE`
- beaucoup d'écrans utilisent les permissions effectives, pas seulement le rôle
- voir `lib/permissions.ts`

### Localisation

- locales actives: `fr` et `ar`
- la UI reste French-first aujourd'hui, avec support arabe en cours dans l'app

### PWA et push

- manifeste: `app/manifest.ts`
- bootstrap PWA: `app/layout.tsx`
- API push: `app/api/push/*`
- traitement interne push: `app/api/internal/push/process`

## Déploiement

Avant un déploiement production:

```bash
npm run deploy:check
```

Puis:

```bash
npx prisma migrate deploy
```

Checklist minimale:

1. charger les variables d'environnement de production
2. exécuter `npm run deploy:check`
3. exécuter `npx prisma migrate deploy`
4. déployer l'application
5. tester au minimum `/dashboard`, `/customers`, `/vehicles` et `/bookings`

## Références utiles

- [claude.md](claude.md) - guide repo orienté agent/coding
- [AGENTS.md](AGENTS.md) - bootstrap de contexte pour tout agent
- [PROJECT_MEMORY.md](PROJECT_MEMORY.md) - mémoire projet vivante
- [prisma/schema.prisma](prisma/schema.prisma) - source de vérité du modèle de données
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - aide au diagnostic env / Prisma / Supabase
