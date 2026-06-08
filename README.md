# Amazon Retour — Shapeheart

Dashboard des **retours Amazon Vendor Central → fournisseur** (les unités qu'Amazon nous renvoie et déduit de nos paiements). Trois onglets : **Synthèse motifs**, **Synthèse ASIN**, **Détail**, avec filtres mois + pays et export Excel.

Stack : Next.js 16 / React 19 / TypeScript / Tailwind v4 / recharts / exceljs — même modèle que `keepa-dashboard`.

## Lancer en local

```bash
npm install
npm run dev   # http://localhost:3007/amazon-retour
```

Au démarrage, les données viennent de `data/returns.json` (ou de `seed/returns.json` en repli). Le seed contient **janvier → mai 2026** (915 lignes, 496 retours).

## Mettre à jour les données (chaque mois)

1. Charger l'extension `chrome-extension/` (chrome://extensions → Mode développeur → « Charger l'extension non empaquetée »).
2. Ouvrir une page **Vendor Central** connectée (n'importe quelle marketplace).
3. Cliquer sur l'icône de l'extension → vérifier l'endpoint (`.../amazon-retour/api/returns`) et l'année → **Lancer la synchro**.

L'extension récupère, pour toutes les marketplaces et tous les mois de l'année, la liste des retours puis le détail ASIN + motif de chaque retour, et envoie le tout à l'API. La fusion est **cumulative** : chaque couple (année, mois, marketplace) présent dans l'envoi remplace l'existant ; le reste est conservé.

## Données

- Source de vérité : `data/returns.json` (`ReturnLine[]`, une ligne = un ASIN d'un retour).
- API : `GET /api/returns` (lecture), `PUT /api/returns` (ingestion, CORS Vendor Central).
- Agrégations (motifs / ASIN / pays) calculées à la volée dans `src/lib/aggregate.ts`.

## Motifs Amazon

`CUSTOMER_DAMAGED` (endommagé client), `OVERSTOCK` (surstock), `DEFECTIVE` (défectueux), `CARRIER_DAMAGED` (transporteur), `WAREHOUSE_DAMAGED` (entrepôt Amazon), `NEGOTIATED_RETURN` (retour négocié).

## Déploiement (à faire plus tard)

Même schéma que les autres tools : repo GitHub → GitHub Action → VPS OVH, `basePath: /amazon-retour`, `output: standalone`, `data/` symlinké vers le stockage persistant. Voir `CLAUDE.md`.
