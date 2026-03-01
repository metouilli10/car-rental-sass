# Marques (brands) – logos SVG

Logos des marques automobiles au format SVG, pour usage dans l’application (sélecteur de marque, fiches véhicules, etc.).

## Source

- **Logos SVG :** [Simple Icons](https://simpleicons.org/) (CDN jsDelivr), licence compatible usage projet.
- **Référence dataset :** [car-logos-dataset](https://github.com/filippofilip95/car-logos-dataset) (ce dépôt fournit des PNG/JPG ; les SVG présents ici viennent de Simple Icons pour un format vectoriel).

## Fichiers

| Marque     | Fichier        |
|-----------|----------------|
| Audi      | `audi.svg`     |
| BMW       | `bmw.svg`      |
| Citroën   | `citroen.svg`  |
| Dacia     | `dacia.svg`    |
| Fiat      | `fiat.svg`     |
| Ford      | `ford.svg`     |
| Hyundai   | `hyundai.svg`  |
| Jeep      | `jeep.svg`     |
| Kia       | `kia.svg`      |
| Land Rover| `landrover.svg`|
| Mercedes  | `mercedes.svg` |
| MG        | `mg.svg`       |
| Nissan    | `nissan.svg`   |
| Opel      | `opel.svg`     |
| Peugeot   | `peugeot.svg`  |
| Renault   | `renault.svg`  |
| SEAT      | `seat.svg`     |
| Škoda     | `skoda.svg`    |
| Suzuki    | `suzuki.svg`   |
| Toyota    | `toyota.svg`   |
| Volkswagen| `volkswagen.svg`|

## Régénérer les logos

```bash
node scripts/fetch-brand-logos.mjs
```

## Usage dans l’app

En Next.js, les fichiers sont servis sous `/brands/<slug>.svg`, par exemple :

- `/brands/renault.svg`
- `/brands/peugeot.svg`

Exemple en composant :

```tsx
<img src="/brands/volkswagen.svg" alt="Volkswagen" className="h-8 w-8" />
```
