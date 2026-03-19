# Restaurant Frontend – Backoffice MVP

Interface de gestion restaurant connectée au backend FoodApp (auth, restaurants, menus, commandes, statistiques).

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (styling)
- **Zustand** (state)
- **TanStack Query** (cache API)
- **Zod** (validation)
- **Axios** (HTTP client)
- **Lucide React** (icônes)

## Installation

```bash
cd restaurant-frontend
npm install
cp .env.example .env
# Éditer .env si besoin (VITE_API_BASE_URL pointe vers le backend)
npm run dev
```

## Scripts

| Commande       | Description              |
|----------------|--------------------------|
| `npm run dev`  | Serveur de développement |
| `npm run build`| Build production         |
| `npm run preview` | Prévisualiser le build |
| `npm run lint` | Linter                   |
| `npm run format` | Formater (Prettier)    |
| `npm run test` | Tests unitaires          |

## Structure

```
src/
├── api/           # Client Axios, endpoints
├── hooks/         # Hooks React Query
├── lib/           # Utilitaires, validation, queryClient
├── modules/       # Pages par domaine (auth, dashboard, floor, etc.)
├── shared/        # Composants partagés (Toast, ErrorBoundary, ProtectedRoute)
└── store/         # Zustand (auth, restaurant)
```

## Connexion au backend

1. Lancer le backend sur `http://localhost:8000`
2. Créer un utilisateur `restaurant_owner` via l’API d’auth
3. Se connecter avec ces identifiants sur `/login`
4. Les routes protégées chargent les données via les APIs documentées dans `docs/REACT_FRONTEND_INTEGRATION.md`

## Variables d’environnement

| Variable | Requis (prod) | Description |
|----------|---------------|-------------|
| `VITE_API_BASE_URL` | Oui | URL du backend (ex: https://api.votredomaine.com) |
| `VITE_API_PREFIX` | Non | Préfixe API (défaut: /api/v1) |
| `VITE_DEFAULT_RESTAURANT_ID` | Non | ID restaurant par défaut (optionnel) |

En production, **VITE_API_BASE_URL est obligatoire**.

## Déploiement (Vercel / Netlify)

1. Dossier racine : `restaurant-frontend`
2. Build : `npm run build` | Output : `dist`
3. Variables : `VITE_API_BASE_URL` = URL de l'API
4. CORS backend : autoriser l'origine du frontend

## Tests & CI

- Tests : Vitest + Testing Library
- CI : GitHub Actions (lint, format, build, test) dans `.github/workflows/ci.yml`
