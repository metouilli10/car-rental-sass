# Dépannage

## Erreur : « Can't reach database server » (Supabase)

Si vous voyez :

```text
Can't reach database server at `aws-1-eu-central-1.pooler.supabase.com:6543`
```

**Vérification via le plugin Supabase :** Le plugin Supabase (MCP) peut atteindre la base : `list_tables` renvoie bien vos tables. Le problème vient donc de la configuration locale (`.env`) ou du réseau (port 6543 bloqué).

### 1. Vérifier que le projet Supabase est actif

- Les projets **gratuits** Supabase sont **mis en pause** après une période d’inactivité.
- Allez sur [app.supabase.com](https://app.supabase.com) → votre projet → **Restore project** si nécessaire.

### 2. Vérifier le fichier `.env`

- Copiez `.env.example` vers `.env` si besoin.
- Remplacez `YOUR_DB_PASSWORD` par le mot de passe de la base (Supabase → Settings → Database).
- Avec Prisma + pooler en mode transaction (port 6543), **il faut** `pgbouncer=true` et optionnellement `connect_timeout=30` dans `DATABASE_URL` (déjà présents dans `.env.example`).
- Renseignez **les deux** variables :
  - `DATABASE_URL` : mode **Transaction** (port **6543**) avec `?pgbouncer=true&connect_timeout=30`.
  - `DIRECT_URL` : mode **Session** (port **5432**).

### 3. Utiliser le mode Session pour tout (si 6543 est inaccessible)

Si le pooler sur le port 6543 ne répond pas (réseau, pare-feu), utilisez le **mode Session** (port 5432) pour `DATABASE_URL` et `DIRECT_URL` :

- Dans `.env.example`, voir **Option B – Session only**.
- Dans votre `.env`, mettez la même URL (Session, port 5432) pour `DATABASE_URL` et `DIRECT_URL`.
- Redémarrez le serveur (`npm run dev`).

### 4. Réseau et pare-feu

- Vérifiez que les ports **5432** et **6543** ne sont pas bloqués (VPN, entreprise, box).
- Testez depuis un autre réseau (ex. partage de connexion) pour isoler un blocage.

### 5. Régénérer le client Prisma

Après toute modification de `.env` ou du schéma :

```bash
npx prisma generate
npm run dev
```

---

## Erreur : « must be owner of table expenses » (build / db push)

Si le build échoue avec :

```text
Error: ERROR: must be owner of table expenses
```

c’est que **Prisma utilise une connexion dont le rôle n’est pas propriétaire des tables** (souvent avec le **pooler** Supabase).

### Solution recommandée : utiliser la connexion directe pour les migrations

Pour **`db push`** et **`prisma migrate`**, Prisma utilise **`DIRECT_URL`**. Ce rôle doit être **propriétaire** des tables.

1. **Dans `.env`**, assurez-vous que **`DIRECT_URL`** pointe vers la **connexion directe** Supabase (pas le pooler) :
   - Hôte : **`db.actfqdgdmwfypffqazdv.supabase.co`** (ou votre `db.[ref].supabase.co`)
   - Port : **5432**
   - Utilisateur : **`postgres`**
   - Mot de passe : celui de Supabase (Settings → Database)

   Exemple :

   ```env
   DIRECT_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@db.actfqdgdmwfypffqazdv.supabase.co:5432/postgres?sslmode=require"
   ```

2. **`DATABASE_URL`** peut rester sur le pooler (port 6543 ou 5432) pour l’app, mais **pour le build** (qui lance `prisma db push`), soit :
   - vous utilisez aussi la **connexion directe** pour `DATABASE_URL` pendant le build,  
   - soit vous gardez le pooler pour `DATABASE_URL` et vous vous assurez que **`DIRECT_URL`** est bien la directe (étape 1).

3. **Sur Vercel / CI** : définir **`DIRECT_URL`** (et si besoin `DATABASE_URL`) avec la **connexion directe** `postgres@db....supabase.co:5432`, pour que le déploiement réussisse.

### Alternative : corriger les propriétaires en SQL (si vous devez garder le pooler pour tout)

Si vous devez absolument utiliser le pooler pour les migrations, dans **Supabase → SQL Editor** vous pouvez donner la propriété des tables au rôle du pooler (remplacez `postgres.actfqdgdmwfypffqazdv` par le rôle indiqué dans votre chaîne de connexion pooler) :

```sql
-- Remplacer par le rôle utilisé dans votre URL pooler (ex. postgres.actfqdgdmwfypffqazdv)
ALTER TABLE public.expenses OWNER TO "postgres.actfqdgdmwfypffqazdv";
-- Répéter pour les autres tables si l’erreur persiste :
-- ALTER TABLE public.agencies OWNER TO "postgres.actfqdgdmwfypffqazdv";
-- etc.
```

En pratique, **utiliser la connexion directe pour `DIRECT_URL`** est la solution la plus simple et la plus fiable.

### Index manquant créé via le plugin Supabase

L’index **`expenses_vehicleId_idx`** sur la table `expenses` a été créé via le plugin Supabase (exécution SQL en tant que `postgres`). Votre prochain `prisma db push` ou build ne devrait plus échouer sur cette étape. Pour les prochaines évolutions du schéma, privilégiez `DIRECT_URL` en connexion directe pour éviter les erreurs « must be owner ».
