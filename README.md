# LivrExpress

**LivrExpress** est une plateforme de gestion de livraison de colis pour le marché marocain, développée avec **Symfony 7** (backend + dashboard) et **React / Vite** (frontend public).

## 🏗️ Architecture

```
LivrExp/
├── livrexp_backend/    # Symfony 7 – API REST + Dashboard Twig
└── livrexp_frontend/  # React + Vite – Interface client
```

## 🚀 Technologies

| Côté | Stack |
|------|-------|
| Backend | PHP 8.2 · Symfony 7 · Doctrine ORM · MySQL |
| Frontend | React 18 · Vite · Tailwind CSS v4 · Metronic UI |
| Auth | Symfony Security · JWT (à venir) |
| Infra | Docker (optionnel) |

## ⚙️ Installation

### Backend (Symfony)

```bash
cd livrexp_backend
composer install
cp .env .env.local   # Configurer DATABASE_URL
php bin/console doctrine:migrations:migrate
symfony server:start
```

### Frontend (React)

```bash
cd livrexp_frontend
npm install
npm run dev
```

## 📦 Fonctionnalités

- ✅ Authentification (Login / Forgot Password)
- ✅ Gestion des colis (CRUD, filtres, import Excel)
- ✅ Tableau de bord avec statistiques
- ✅ Gestion du stock
- ✅ Ramassage & Bon de Livraison
- ✅ Suivi de livraison
- ✅ Facturation / CRBT
- ✅ Programme d'affiliation
- ✅ API docs intégrée
- ✅ Mode sombre / clair

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request.

## 📄 Licence

Projet académique – PFE 2026.
