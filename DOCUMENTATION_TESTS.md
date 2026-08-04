# 📚 Documentation Générale des Tests (PHPUnit & Vitest) - LivrExpres

**Projet** : LivrExpres  
**Technologies** : Symfony 7.x (PHP 8.2) & React 19 (Vite + Vitest)  
**Date de mise à jour** : 4 Août 2026  
**Auteur** : Équipe de Développement / PFE  

---

## 📑 Table des Matières
1. [Présentation Générale](#1-présentation-générale)
2. [Suite de Tests Backend (PHPUnit)](#2-suite-de-tests-backend-phpunit)
   - [2.1 Architecture & Emplacement](#21-architecture--emplacement)
   - [2.2 Tests Unitaires (Services, 13 Entities, EventSubscribers, 3 Commands)](#22-tests-unitaires)
   - [2.3 Tests Fonctionnels & API (WebTestCase - 17 APIs)](#23-tests-fonctionnels--api)
   - [2.4 Guide d'Exécution PHPUnit](#24-guide-dexécution-phpunit)
3. [Suite de Tests Frontend (React / Vitest)](#3-suite-de-tests-frontend-react--vitest)
   - [3.1 Architecture & Emplacement](#31-architecture--emplacement-1)
   - [3.2 Tests des Services & Intercepteurs API](#32-tests-des-services--intercepteurs-api)
   - [3.3 Tests de Composants UI & Pages React](#33-tests-de-composants-ui--pages-react)
   - [3.4 Guide d'Exécution Vitest](#34-guide-dexécution-vitest)
4. [Résumé des Métriques de Couverture](#4-résumé-des-métriques-de-couverture)

---

## 1. Présentation Générale

L'application **LivrExpres** est couverte par une suite intégrale de tests automatisés :
- **Backend (PHP / Symfony)** : **79 tests unitaires et fonctionnels (604 assertions)** couvrant 100% des 13 Entités, 100% des 3 Commandes CLI, des Services métier, des Événements Doctrine, du Security Authenticator et des **17 Contrôleurs d'API HTTP**.
- **Frontend (React / Vitest)** : Tests unitaires et d'intégration UI avec **Vitest**, **React Testing Library** et **jsdom**.

---

## 2. Suite de Tests Backend (PHPUnit)

### 2.1 Architecture & Emplacement
Tous les tests Backend sont situés dans le dossier `livrexp_backend/tests/` :

```
livrexp_backend/tests/
├── Command/
│   ├── AllCommandsUnitTest.php                 # Tests des commandes CLI (ImportCities, SeedTestData)
│   └── CreateUserCommandTest.php               # Test de la commande CLI app:create-user
├── Entity/
│   ├── AllEntitiesUnitTest.php                 # Tests unitaires des 13 Entités (BonLivraison, City, Crbt, PickupRequest, ReturnRequest, StockProduct, etc.)
│   └── EntityUnitTest.php                      # Tests des règles de gestion spécifiques (Colis, User)
├── EventSubscriber/
│   └── SubscriberUnitTest.php                  # Tests des événements ColisWhatsAppSubscriber et ColisCrbtSubscriber
├── Functional/                                 # Tests fonctionnels des 17 API HTTP (WebTestCase)
│   ├── AffiliateAndDocsApiTest.php             # API /api/affiliate et /api/api-docs
│   ├── AnalyticsApiTest.php                    # API /api/analytics/advanced
│   ├── ColisApiTest.php                        # API /api/colis
│   ├── NotificationApiTest.php                 # API /api/notifications
│   ├── ProfileAndClientApiTest.php             # API /api/profile et /api/clients
│   ├── RamassageAndBonLivraisonApiTest.php     # API /api/ramassage
│   ├── RetourAndAiApiTest.php                  # API /api/retour et /api/admin/ai-assistant
│   ├── SecurityControllerTest.php              # Routes HTTP /login, /login/staff
│   ├── StockAndLivreurApiTest.php              # API /api/stock, /api/livreurs et /api/driver
│   └── WhatsAppApiTest.php                     # API /api/whatsapp et vérification OTP
├── Security/
│   └── AppCustomAuthenticatorTest.php          # Test de l'authentificateur de sécurité
├── Service/                                    # Tests unitaires des Services métiers
│   ├── BonLivraisonPdfGeneratorTest.php        # Génération des Bons de Livraison PDF
│   ├── BonRetourPdfGeneratorTest.php           # Génération des Bons de Retour PDF
│   ├── CrbtManagerTest.php                     # Calcul des montants CRBT et commissions
│   ├── StockProductMediaManagerTest.php        # Gestion sécurisée des QR codes et médias
│   ├── UserSettingsManagerTest.php             # Gestion des paramètres colis/emballages
│   └── WhatsAppServiceTest.php                 # Notifications WhatsApp et codes OTP
└── SettingsApiTest.php                         # API Paramètres généraux
```

### 2.2 Tests Unitaires
* **Entités (100% des 13 Entités)** : `BonLivraison`, `City`, `Colis`, `Crbt`, `PickupRequest`, `ReturnRequest`, `StockMovement`, `StockMovementItem`, `StockProduct`, `StockProductVariant`, `User`, `UserSettings`, `WhatsAppTemplate`.
* **Commandes CLI (100% des 3 Commandes)** : `app:create-user`, `app:import-cities`, `app:seed-test-data`.
* **Services Métiers** : `CrbtManager`, `StockProductMediaManager`, `WhatsAppService`, `UserSettingsManager`, `BonLivraisonPdfGenerator`, `BonRetourPdfGenerator`.
* **Doctrine EventSubscribers** : `ColisWhatsAppSubscriber`, `ColisCrbtSubscriber`.

### 2.3 Tests Fonctionnels & API
* **Authentification & Sécurité** : Vérification des réponses `401 Unauthorized` / `302 Found` pour les requêtes anonymes, et validation de l'accès sécurisé via `$client->loginUser($user)`.
* **Couverture des 17 Contrôleurs API** : Validation du format des réponses JSON, de la structure des objets retournés et de la gestion des erreurs `400 Bad Request` et `404 Not Found`.

### 2.4 Guide d'Exécution PHPUnit
Naviguez dans le dossier backend et utilisez l'une des commandes ci-dessous :

```powershell
cd livrexp_backend

# 1. Exécuter l'intégralité des 79 tests PHPUnit (604 assertions)
php bin/phpunit

# 2. Exécuter les tests avec affichage détaillé (--testdox)
php bin/phpunit --testdox

# 3. Exécuter uniquement les tests d'Entités et Commandes
php bin/phpunit tests/Entity tests/Command
```

---

## 3. Suite de Tests Frontend (React / Vitest)

### 3.1 Architecture & Emplacement
Tous les tests Frontend sont situés dans le dossier `livrexp_frontend/src/` :

```
livrexp_frontend/src/
├── components/ui/
│   ├── PasswordInput.test.jsx                  # Test du composant de saisie avec masquage/démasquage mot de passe
│   └── SafeAvatar.test.jsx                     # Test du rendu d'avatar avec fallback sur l'initiale
├── pages/auth/
│   └── LoginPage.test.jsx                      # Test d'intégration de la page de connexion
├── services/
│   └── api.test.js                             # Test unitaire du service d'appel HTTP (authService)
└── test/
    └── setup.js                                # Configuration de l'environnement JSDOM & matchers jest-dom
```

### 3.2 Guide d'Exécution Vitest
Naviguez dans le dossier frontend et lancez les tests :

```powershell
cd livrexp_frontend

# Lancer la suite de tests Vitest
npm test
```

---

## 4. Résumé des Métriques de Couverture

| Module | Outil de Test | Nombre de Fichiers de Tests | Nombre de Tests Exécutés | Statut |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Entities (13 Entités)** | PHPUnit 11 | 2 fichiers | 14 tests | 🟢 **100% Passed** |
| **Backend Commands (3 CLI Commands)** | PHPUnit 11 | 2 fichiers | 4 tests | 🟢 **100% Passed** |
| **Backend Services & Subscribers** | PHPUnit 11 | 7 fichiers | 26 tests | 🟢 **100% Passed** |
| **Backend API Controllers (17 APIs)** | PHPUnit 11 | 10 fichiers | 35 tests | 🟢 **100% Passed** |
| **Frontend UI & Services** | Vitest 3 | 4 fichiers | 11 tests UI | 🟢 **100% Passed** |
| **TOTAL GÉNÉRAL** | **PHPUnit + Vitest** | **25 fichiers** | **90+ tests (604+ assertions)** | 🟢 **TOTALEMENT VERT** |

---
*Fin du document de synthèse des tests LivrExpres.*
