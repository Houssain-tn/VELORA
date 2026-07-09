# Guide de Déploiement Production · VELORA PRO v2.4
*Standard d'Excellence Opérationnelle Waycon · Édition Entreprise 2026*

Ce document détaille la procédure standard de déploiement en production de l'infrastructure de commandement opérationnel **VELORA PRO v2.4** sous environnements Linux (Ubuntu 22.04 LTS recommandé) ou Windows Server.

---

## 📐 Topologie Générale de Déploiement

Le système utilise une topologie découplée moderne pour maximiser la sécurité et le rendement de charge :
```mermaid
flowchart TD
    Client[Navigateur Client Web/Mobile] <-->|HTTPS / SSL| Nginx[Serveur Nginx / Apache Reverse Proxy]
    Nginx <-->|Fichiers Statiques HTML/JS/CSS| Dist[Répertoire apps/frontend/dist]
    Nginx <-->|Proxy API: /api et /socket.io| NestJS[Serveur Backend NestJS: Port 3333]
    NestJS <-->|Prisma ORM| MySQL[Base de données MySQL: Port 3306]
```

---

## 🛠️ Pré-requis Systèmes

* **Node.js** : v20.x ou v22.x (LTS)
* **Package Manager** : npm v10.x+ ou yarn v1.22+
* **Database Engine** : MySQL v8.0+ ou MariaDB v10.6+ (compatible XAMPP en environnement local)
* **Process Manager** : PM2 (installé globalement via `npm install -g pm2`)
* **Reverse Proxy / SSL Engine** : Nginx v1.18+ (recommandé) ou Apache v2.4+

---

## 🚀 Étape 1 : Préparation de la Base de Données

1. **Création de la base de données de production** :
   Connectez-vous à votre console MySQL et exécutez la requête d'initialisation :
   ```sql
   CREATE DATABASE velora_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Génération du client Prisma et application du schéma** :
   Dans le dossier `apps/backend/`, mettez à jour votre connexion et poussez la topologie :
   ```bash
   cd apps/backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Injection des données d'initialisation (Seeding)** :
   Populez la base de données avec les rôles métiers (`SUPER_ADMIN`, `COMMERCIAL`, `ACHETEUR`, etc.), les permissions RBAC et le compte d'administration initial :
   ```bash
   npx prisma db seed
   ```

---

## 🔐 Étape 2 : Configuration Environnementale Backend

Créez un fichier `.env` de production dans le dossier `apps/backend/` en copiant le modèle `.env.example`. 

> [!IMPORTANT]
> Ne réutilisez jamais les clés de développement. Générez de nouveaux secrets cryptographiques uniques et robustes à l'aide de la commande suivante :
> ```bash
> openssl rand -base64 32
> ```

Configurez les valeurs suivantes dans le fichier `apps/backend/.env.production` :
```env
# Mode d'exécution
NODE_ENV="production"
PORT=3333

# URL de connexion à la base de données de production
# IMPORTANT : Remplacer par le mot de passe sécurisé validé (ex: Velora+Waycon@2026)
DATABASE_URL="mysql://velora_prod_user:Velora+Waycon@2026@127.0.0.1:3306/velora_prod"

# Clés de chiffrement JWT (Générez de nouvelles clés sécurisées !)
JWT_SECRET="insérer_clé_secrète_jwt_production"
JWT_REFRESH_SECRET="insérer_clé_secrète_refresh_production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Sécurité CORS & Hôte frontend autorisé
ALLOWED_ORIGINS="https://velora.votre-domaine.com"

# Dossier des fichiers et uploads persistants
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760 # 10 Mo de limite d'upload par défaut
```

---

## ⚙️ Étape 3 : Compilation et Démarrage du Backend (NestJS)

1. **Compilation des sources TypeScript** :
   Compilez l'application backend. Le résultat optimisé sera généré dans le dossier `dist/` :
   ```bash
   cd apps/backend
   npm run build
   ```

2. **Lancement Haute-Disponibilité via PM2** :
   Revenez à la racine du projet et démarrez le service en mode cluster à l'aide du fichier `ecosystem.config.js` :
   ```bash
   cd ../..
   pm2 start ecosystem.config.js --env production
   ```

3. **Sauvegarde de la liste PM2** :
   Assurez-vous que le service redémarre automatiquement après un reboot du serveur physique :
   ```bash
   pm2 save
   pm2 startup
   ```

---

## 🎨 Étape 4 : Compilation et Hébergement du Frontend (Vite / React)

Le frontend est une application SPA (Single Page Application). En production, elle doit être compilée sous forme de fichiers statiques légers (HTML, JS, CSS) pour être servie directement par un serveur web performant comme Nginx.

1. **Ajustement de l'URL API de production** :
   Assurez-vous que les variables de configuration frontend pointent vers l'URL de votre reverse proxy de production.

2. **Compilation du client web** :
   Lancez la compilation de production dans le dossier frontend :
   ```bash
   cd apps/frontend
   npm install
   npm run build
   ```

3. **Copie des fichiers statiques** :
   Le build génère le répertoire `apps/frontend/dist/`. Copiez le contenu de ce dossier vers le répertoire de diffusion de votre serveur web (ex: `/var/www/velora-frontend/` sous Linux ou `C:\xampp\htdocs\` sous Windows).

---

## 🌐 Étape 5 : Configuration du Reverse Proxy Nginx (Recommandé)

Créez un fichier de configuration de site Nginx (ex: `/etc/nginx/sites-available/velora`) pour acheminer le trafic de façon sécurisée (SSL) :

```nginx
server {
    listen 80;
    server_name velora.votre-domaine.com;
    
    # Redirection automatique HTTP vers HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name velora.votre-domaine.com;

    # Certificats SSL (générés via Let's Encrypt / Certbot par exemple)
    ssl_certificate /etc/letsencrypt/live/velora.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/velora.votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Dossier frontend statique
    root /var/www/velora-frontend;
    index index.html;

    # Routage pour le client React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API NestJS
    location /api {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy WebSockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3333/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Sécurisation additionnelle (Headers)
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

Activez le site et rechargez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/velora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Étape 6 : Liste de Vérification Sécuritaire

* [ ] Les clés `JWT_SECRET` et `JWT_REFRESH_SECRET` ont été modifiées et font plus de 32 caractères.
* [ ] La base de données MySQL n'écoute pas sur le port public `0.0.0.0` sans protection (ou est restreinte par firewall à l'hôte local `127.0.0.1`).
* [ ] Le port NestJS `3333` est bloqué par firewall (`ufw` / iptables) pour les connexions externes et n'est accessible que via le reverse proxy Nginx.
* [ ] L'accès SSL / HTTPS est forcé avec des protocoles modernes (TLS v1.2 minimum).
* [ ] La limite d'upload de Nginx (`client_max_body_size`) est calée sur la même valeur que l'API (50 Mo).
