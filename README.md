# RentCar SaaS - Système de Gestion de Location

MVP pour agences de location de voitures au Maroc.

## Stack Technique

- **Frontend:** Next.js 14 (App Router), React 19, TypeScript
- **UI:** TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js (credentials)
- **PDF:** Playwright
- **Forms:** React Hook Form + Zod

## Prérequis

- Node.js 18+
- PostgreSQL 14+ (installé et en cours d'exécution)
- npm ou yarn

## Installation

### 1. Installer les dépendances

```bash
npm install --legacy-peer-deps
```

### 2. Configurer la base de données

Créez une base de données PostgreSQL:

```bash
# Via psql
createdb rentcar_db

# Ou via PostgreSQL
psql -U postgres
CREATE DATABASE rentcar_db;
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` en `.env`:

```bash
cp .env.example .env
```

Modifiez `.env` avec vos informations:

```env
# Database - Remplacez par vos credentials PostgreSQL
DATABASE_URL="postgresql://VOTRE_USER:VOTRE_PASSWORD@localhost:5432/rentcar_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere-ici"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Pour générer `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Initialiser la base de données

Exécutez les migrations Prisma:

```bash
npm run db:migrate
```

Quand demandé pour un nom de migration, tapez: `init`

### 5. Peupler avec les données de test

```bash
npm run db:seed
```

Cela créera en local uniquement:
- 1 agence: Auto Maroc Location
- 1 utilisateur owner de démonstration: `owner@automaroc.ma` / `password123`
- 5 véhicules (Dacia Logan, Renault Clio, Peugeot 208, Hyundai i10, Toyota Corolla)
- 3 clients
- 4 réservations (1 active, 1 retour aujourd'hui, 1 départ aujourd'hui, 1 terminée)

## Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur: **http://localhost:3000**

## Test de la Foundation

### 1. Tester la page de connexion en local

1. Ouvrez http://localhost:3000
2. Vous devriez voir une page d'accueil basique
3. Allez sur http://localhost:3000/login
4. Connectez-vous avec le compte de démonstration local:
   - **Email:** `owner@automaroc.ma`
   - **Mot de passe:** `password123`

### 2. Vérifier l'authentification

Après connexion, vous devriez être redirigé vers `/dashboard`.

**Note:** En production, les nouveaux propriétaires passent par le flux `signup -> vérification email -> approbation interne -> première connexion`.

### 3. Vérifier la base de données

Vous pouvez explorer la base de données avec Prisma Studio:

```bash
npm run db:studio
```

Cela ouvrira une interface web sur http://localhost:5555 où vous pouvez voir toutes les tables et données.

### 4. Vérifier la protection des routes

Essayez d'accéder à `/dashboard` sans être connecté - vous devriez être redirigé vers `/login`.

## Scripts Disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Build pour production
- `npm start` - Lancer en mode production
- `npm run db:migrate` - Exécuter les migrations Prisma
- `npm run db:seed` - Peupler la BD avec les données de test
- `npm run db:reset` - Réinitialiser la BD (⚠️ supprime toutes les données)
- `npm run db:studio` - Ouvrir Prisma Studio

## Structure du Projet

```
├── app/
│   ├── (auth)/
│   │   └── login/          # Page de connexion
│   ├── (dashboard)/        # Routes protégées
│   │   ├── dashboard/      # Tableau de bord
│   │   ├── vehicles/       # Gestion véhicules
│   │   ├── customers/      # Gestion clients
│   │   ├── bookings/       # Gestion réservations
│   │   ├── contracts/      # Contrats PDF
│   │   ├── payments/       # Paiements & cautions
│   │   └── damage-reports/ # Rapports de dégâts
│   ├── api/
│   │   └── auth/           # NextAuth endpoints
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # Composants shadcn/ui
│   └── shared/             # Composants réutilisables
├── lib/
│   ├── prisma.ts           # Client Prisma
│   ├── auth.ts             # Config NextAuth
│   ├── utils.ts            # Utilitaires
│   └── validations/        # Schémas Zod
├── prisma/
│   ├── schema.prisma       # Modèles de données
│   └── seed.ts             # Données de test
└── public/
    └── uploads/            # Stockage local fichiers
```

## Modèles de Données

- **Agency** - Informations agence
- **User** - Utilisateurs (OWNER, STAFF)
- **Vehicle** - Véhicules (AVAILABLE, RENTED, MAINTENANCE)
- **Customer** - Clients
- **Booking** - Réservations (DRAFT, CONFIRMED, ACTIVE, COMPLETED, CANCELED)
- **Payment** - Paiements (CASH, CARD, TRANSFER)
- **Deposit** - Cautions (HELD, PARTIAL_RETURNED, RETURNED, FORFEITED)
- **Contract** - Contrats PDF
- **DamageReport** - Rapports de dégâts
- **DamagePhoto** - Photos de dommages

## Prochaines Étapes

La foundation est complète! Les prochaines étapes incluent:

1. ✅ Authentification et structure de base
2. 🔄 Composants réutilisables (PageHeader, StatCard, etc.)
3. 🔄 Pages CRUD (Véhicules, Clients)
4. 🔄 Système de réservations
5. 🔄 Dashboard avec métriques
6. 🔄 Génération de contrats PDF
7. 🔄 Gestion paiements & cautions
8. 🔄 Rapports de dégâts avec photos

## Dépannage

### Erreur de connexion à la base de données

Vérifiez que:
- PostgreSQL est démarré
- Les credentials dans `.env` sont corrects
- La base de données existe

### Erreur lors de l'installation

Si vous avez des conflits de peer dependencies, utilisez:
```bash
npm install --legacy-peer-deps
```

### Erreur Prisma

Si vous modifiez le schéma:
```bash
npm run db:migrate
npx prisma generate
```

## Support

Pour toute question ou problème, créez une issue dans le repository.
