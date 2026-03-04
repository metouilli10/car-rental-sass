# Locapro — App Review Report
**Date:** 4 mars 2025  
**Scope:** Bugs, fonctionnalités, mobile

---

## Résumé exécutif

| Priorité | Nombre | Statut |
|----------|--------|--------|
| Haute    | 2      | À corriger |
| Moyenne  | 4      | À corriger |
| Basse    | 5      | Améliorations recommandées |
| Mobile   | 3      | Points d’attention |

---

## 1. Bugs prioritaires (haute sévérité)

### 1.1 API debug-auth exposée publiquement  
**Fichier:** `app/api/debug-auth/route.ts`

**Problème:** L’endpoint `GET /api/debug-auth` est public et renvoie des informations sensibles :
- Email, `agencyId`, rôle, statut `isActive`, présence d’agence

**Risque:** Fuite d’informations, aide à l’énumération d’utilisateurs.

**Action:** Supprimer ce fichier ou le protéger (authentification + restriction d’accès ou désactivation en production).

---

### 1.2 Session sans `agencyId` non gérée partout  
**Fichiers:** `app/(dashboard)/vehicles/page.tsx`, `app/(dashboard)/customers/page.tsx`, `lib/actions/infractions.ts`, etc.

**Problème:** Si `session.user.agencyId` est `undefined`, certaines pages et actions passent `undefined` aux requêtes Prisma. Prisma peut ignorer `agencyId` dans le `where`, ce qui peut exposer des données d’autres agences.

**Exemple:**  
```ts
const where = { agencyId: session.user.agencyId }; // undefined = filtre ignoré
```

**Action:**  
- Vérifier `agencyId` avant tout appel Prisma, comme dans `app/(dashboard)/bookings/page.tsx` (lignes 33–36)  
- Rediriger vers `/setup` ou `/login` si absent  
- Utiliser un helper type `getAgencyIdOrThrow()` (comme dans `lib/actions/onboarding.ts`)

---

## 2. Bugs et problèmes UX (sévérité moyenne)

### 2.1 Recherche globale avec données factices → 404  
**Fichier:** `components/shared/search-overlay.tsx`

**Problème:** Données mockées (`c1`, `c2`, `r1`, `v1`, etc.) ; les liens pointent vers des IDs inexistants et mènent à des 404.

**Action:** Brancher la recherche sur de vraies données (server actions / API), ou désactiver temporairement les liens vers des entrées mock.

---

### 2.2 Pages renvoyant `null` sans redirection  
**Fichiers:**  
- `app/(dashboard)/bookings/page.tsx` (ligne 29)  
- `app/(dashboard)/vehicles/page.tsx` (ligne 31)  
- `app/(dashboard)/customers/page.tsx` (ligne 17)  
- `app/(dashboard)/dashboard/page.tsx` (ligne 20)

**Problème:** Ces pages font `return null` quand la session ou `agencyId` manque. Le layout redirige normalement, mais en cas d’exception ou de comportement inattendu, l’utilisateur peut voir un écran blanc.

**Action:** Remplacer par `redirect("/login")` pour homogénéiser et éviter une page vide.

---

### 2.3 `useCallback` avec dépendances incomplètes dans le formulaire infraction  
**Fichier:** `components/infractions/infraction-form.tsx` (lignes 79–110)

**Problème:**  
- `doMatch` a une dépendance vide `[]`  
- Il appelle `handleSelectMatch` dans sa fermeture, ce qui peut créer une version obsolète de `handleSelectMatch`

**Action:** Inclure `handleSelectMatch` dans les dépendances de `doMatch` ou utiliser un `useRef` pour garder une référence à jour.

---

### 2.4 Middleware ne couvrant pas toutes les routes protégées  
**Fichier:** `middleware.ts`

**Problème:** Les routes `/catalogue`, `/calendrier`, `/caisse`, `/settings`, `/notifications` ne sont pas dans le `matcher`. Elles sont sous le layout qui fait `getSession` et redirige, mais la protection n’est pas centralisée.

**Action:** Ajouter ces chemins au `matcher` du middleware pour renforcer la sécurité et la cohérence.

---

## 3. Améliorations recommandées (sévérité basse)

### 3.1 Validation de `agencyId` dans `getCurrentUserOrThrow`  
**Fichier:** `lib/authz.ts`

**Problème:** `getCurrentUserOrThrow()` renvoie un objet avec `agencyId: session.user.agencyId` sans vérifier qu’il est défini.

**Action:** Vérifier la présence de `agencyId` et lever une erreur 401 si absent.

---

### 3.2 Typo dans le message d’erreur  
**Fichier:** `app/(dashboard)/dashboard/page.tsx` (ligne 61)

**Problème:** « Donnees » au lieu de « Données ».

---

### 3.3 Cohérence des schémas / rôles  
**Documentation:** Le schéma Prisma inclut `MANAGER` et `EMPLOYEE`, alors que `CLAUDE.md` mentionne surtout `OWNER` et `STAFF`. À aligner si nécessaire.

---

## 4. Mobile

### 4.1 Calendrier  
**Fichiers:** `components/calendar/TimelineGrid.tsx`, `components/calendar/CalendarGrid.tsx`

**Constat:**  
- `min-w-[800px]` et `min-w-[900px]` avec `overflow-x-auto`  
- Navigation horizontale fonctionnelle sur mobile

**Action:** Optionnel : adapter la largeur ou ajouter une vue mobile plus compacte.

---

### 4.2 Tables avec largeur minimale  
**Fichiers:**  
- `app/(dashboard)/customers/[id]/page.tsx` : `min-w-[980px]`  
- `components/vehicles/vehicles-list.tsx` : `min-w-[720px]`  
- `components/users/users-page.tsx` : `min-w-[960px]`, `min-w-[860px]`

**Problème:** Sur petits écrans, ces tables provoquent du défilement horizontal.

**Action:** Ajouter des wrappers `overflow-x-auto` autour des tables ou des vues alternatives en grille sur mobile.

---

### 4.3 Éléments interactifs et touch targets  
**Constat:**  
- FAB : `h-14 w-14` (56px)  
- Liens de la bottom nav : `h-11 w-11` (44px)  
- La plupart des cibles tactiles respectent les recommandations (min 44px).

**Action:** Vérifier les boutons et liens plus petits (`text-[10px]`, etc.) pour garantir au moins 44×44px de zone tactile.

---

## 5. Fonctionnalités vérifiées

| Module               | Statut | Remarque                                      |
|----------------------|--------|-----------------------------------------------|
| Auth / login          | OK     |                                                |
| Multi-tenancy        | OK     | `agencyId` bien filtré dans la plupart des cas |
| Véhicules CRUD       | OK     |                                                |
| Clients CRUD         | OK     |                                                |
| Réservations         | OK     | Chevauchements gérés, calcul de prix          |
| Paiements            | OK     |                                                |
| Inspections / dégâts| OK     |                                                |
| Infractions          | OK     | À part le `useCallback` du formulaire           |
| Calendrier           | OK     | Défilement horizontal sur mobile               |
| Catalogue            | OK     | N+1 à optimiser (voir TODO.md)                |
| Finance / caisse     | OK     |                                                |
| Paramètres           | OK     |                                                |

---

## 6. Actions recommandées (priorité)

1. Supprimer ou sécuriser `/api/debug-auth`.
2. Centraliser la vérification de `agencyId` (helper, redirection si absent).
3. Connecter la recherche globale à des données réelles ou désactiver les liens mockés.
4. Remplacer les `return null` par `redirect("/login")` sur les pages protégées.
5. Mettre à jour le `matcher` du middleware pour couvrir toutes les routes protégées.
6. Corriger les dépendances de `useCallback` dans `infraction-form.tsx`.

---

## 7. Notes de performance (TODO.md existant)

- Pagination sur les pages lourdes (véhicules, réservations, clients).
- Cache des requêtes du tableau de bord.
- Optimisation du catalogue (éviter N+1 sur l’availability).
