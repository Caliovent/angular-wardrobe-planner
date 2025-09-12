Résumé du Projet
L'application "Wardrobe Planner" est un outil web permettant de planifier et de budgétiser le renouvellement d'une garde-robe. L'utilisateur peut ajouter des articles (vêtements, chaussures, parfums), définir des budgets, suivre ses dépenses réelles, et ajouter des notes, photos et liens pour chaque article.

Architecture
Le projet est un monorepo contenant :

Une application frontend en Angular (/)

Un serveur backend en Node.js/Express (/server)

Base de Données : Schéma PostgreSQL
La base de données contient 4 tables principales.

Table Users

user_id: SERIAL PRIMARY KEY

email: VARCHAR(255) UNIQUE NOT NULL

password_hash: VARCHAR(255) NOT NULL

total_budget: DECIMAL(10, 2)

monthly_budget: DECIMAL(10, 2)

Table Items

item_id: SERIAL PRIMARY KEY

user_id: INT (FOREIGN KEY vers Users)

name: VARCHAR(255) NOT NULL

category: VARCHAR(50) NOT NULL

estimated_cost: DECIMAL(10, 2) NOT NULL

actual_cost: DECIMAL(10, 2)

priority: VARCHAR(50) NOT NULL

purchase_month: VARCHAR(7) NOT NULL

is_purchased: BOOLEAN DEFAULT FALSE

notes: TEXT

rating: INT

Table Images

image_id: SERIAL PRIMARY KEY

item_id: INT (FOREIGN KEY vers Items)

image_url: TEXT NOT NULL

Table Links

link_id: SERIAL PRIMARY KEY

item_id: INT (FOREIGN KEY vers Items)

url: TEXT NOT NULL

annotation: VARCHAR(255) NOT NULL

API Backend : Endpoints principaux
GET /api/items : Récupère tous les articles.

POST /api/items : Ajoute un nouvel article.

PATCH /api/items/:id : Met à jour un article existant.

DELETE /api/items/:id : Supprime un article.

Déploiement sur Render (Backend)
Root Directory: server

Build Command: npm install && npm run build

Start Command: node dist/index.js

Note importante: Les dépendances de types (@types/...) et typescript doivent être dans les "dependencies" du package.json et non dans les "devDependencies".
