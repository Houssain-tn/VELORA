# VELORA PRO - LAN Enterprise Solution

Bienvenue dans la version **PRO** de VELORA (anciennement SuiviTech). Il s'agit d'une plateforme d'entreprise (FSM) performante, optimisée pour un déploiement sécurisé sur réseau local (LAN) ou en environnement cloud privé.

## 🚀 Lancement Rapide

Pour démarrer l'ensemble de la suite logicielle (Backend + Frontend + WebSocket) sur ce serveur :

1.  **Base de données (MySQL)** : Assurez-vous que le module **MySQL** de XAMPP (ou votre serveur MySQL) est démarré.
2.  **Lancement Global** : Double-cliquez sur le fichier `start_pro.bat` situé à la racine du projet pour lancer simultanément les deux applications.
3.  **Accès à la Plateforme** : 
    -   Depuis ce poste (Localhost) : [http://localhost:5175](http://localhost:5175)
    -   Depuis un autre poste sur le même réseau (LAN) : `http://<IP_DU_SERVEUR>:5175`

> **Note sur les Ports :**
> - **Frontend (React/Vite)** : Port `5175`
> - **Backend (NestJS API & WebSocket)** : Port `3333`
> - **Base de données (MySQL)** : Port `3306`

## 📂 Architecture Système & Monorepo

Le projet est structuré en pseudo-monorepo pour une maintenabilité maximale :
-   **`apps/backend/`** : API REST robuste développée sous **NestJS** (Node.js). Ce module gère la logique métier complexe, le système d'authentification par JWT, le contrôle d'accès basé sur les rôles (RBAC), la communication en temps réel via **Socket.IO** (@nestjs/websockets), et l'accès à la base de données via **Prisma ORM**.
-   **`apps/frontend/`** : Interface Web Single Page Application (SPA) ultra-réactive développée en **React 19** et packagée avec **Vite**. Elle intègre **TanStack Query** (React Query) pour le cache et la synchronisation des données, **Zustand** pour l'état global, et **Tailwind CSS v4** pour un design sur mesure et professionnel.

## 🧩 Modèles & Modules Principaux

Le système d'information de VELORA PRO repose sur 14 modèles de bases de données relationnelles principaux, déployés à travers de multiples pages d'interface :

1.  **Utilisateurs & RBAC (`User`, `Company`)** : Gestion multi-rôles sur la page `/users` (Super Admin, Admin, Directeur, Chef de Projet, Responsable Technique, Technicien, Client). Accompagné de la gestion des équipes formées et spécialisées, via le modèle `Squad` depuis `/squads`.
2.  **Infrastructures (`Site`, `Equipment`)** : Cartographie globale des sites et équipements (Scan QR Code `/scanner`, cycles de vie, rattachement de la maintenance).
3.  **Tickets & Interventions (`Intervention`, `Task`)** : Moteur ITSM complet (`/interventions`), workflow dynamique de paramétrage allant de la conception (DEMANDE) jusqu'à la validation (`CLOTUREE` avec recueil de signature logicielle client).
4.  **Projets (`Project`, `Phase`)** : Modélisation avancée avec barres de progressions, assignation des chefs, et gestion sous-jacente des travaux fractionnés sur la page `/projects`.
5.  **Maintenances Préventives (`MaintenanceSchedule`)** : Génération automatisée (PPM) sur `/ppm` de tickets d'intervention liés à des récurrences (mensuelle, annuelle) exécutée via des routines du moteur CRON NestJS interne.
6.  **Facturation & Contrats (`Invoice`, `Contract`)** : Traçabilité métier sur la page `/contracts` et `/invoices`. L'outil compense les heures exécutées et prévient du dépassement de budgets horaires (SLA Hours).
7.  **Réunions (`Meeting`)** : Plateforme applicative `/meetings` et vue de calendrier (`/calendar`) pour programmer d'uniques réunions techniques, les documenter dynamiquement et générer instantanément l'envoi de documents PDF aux intéressés.
8.  **Documents & Commentaires (`Document`, `Comment`)** : Centralisation totale (`/documents`) des médias du site et documents de plan de prévention, avec communications contextuelles entre intervenants (avec tags internes).
9.  **Audits & Opérations (`AuditLog`)** : Panneau d'inspection analytique complet situé sur `/audit-logs` pour l'enregistrement et conformité parfaite immuable légal (Changements, Ips, etc.).
10. **Velora Copilot (Assistant IA)** : Intégration d'un moteur d'intention (NLP) permettant aux utilisateurs de formuler des questions en langage naturel dans la barre de recherche globale pour interroger dynamiquement la base de données (ex: "Combien d'interventions ?"). 

## 🛠️ Configuration Réseau / LAN
L'API backend écoute par défaut sur l'adresse `0.0.0.0` (LAN-accessible), permettant ainsi la réception automatique de requêtes provenant de n'importe quel autre équipement, smartphone, ou affichage du même réseau interne. Le CORS applicatif est configuré pour l'expansion.

## 👤 Identifiants par défaut (Seed)
Le démarrage de la base de données comprend une phase d'injection de données par défaut (seed). 
Connexion de test : `admin@waycon.com` / `password123`.

---
**© 2026 VELORA PRO | MISSION CRITICAL SYSTEMS**  
Développé avec excellence par **Waycon Méditerranée** pour la gestion des opérations et infrastructures critiques de haut niveau.
