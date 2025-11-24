JardinSolidaire
Plateforme qui connecte les propriétaires de jardins et les amis du vert pour réserver des créneaux, jardiner et favoriser l’entraide locale.

Fonctionnalités principales

Création de compte (propriétaire ou ami du vert).

Ajout d’un jardin avec photos, description, compétences et disponibilités.

Réservation d’un créneau sur un jardin.

Calendrier des disponibilités.

Page “Mes réservations” (à venir / passées).

Connexion / déconnexion avec navbar dynamique.

Stack technique

Frontend : Next.js 15, React, Tailwind CSS.

Backend : Node.js, Express.

Base de données : PostgreSQL.

API REST pour la communication front/back.

Installation

Cloner le projet :
git clone https://github.com/Medinabouillart/jardinsolidaire.git

cd jardinsolidaire

Backend :
cd backend
npm install
Créer un fichier .env avec DATABASE_URL, DB_SSL et PORT
Importer la base avec db.sql
npm run dev

Frontend :
cd ../frontend
npm install
Créer un fichier .env.local avec NEXT_PUBLIC_API_BASE
npm run dev

Utilisation

Ouvrir http://localhost:3000

Créer un compte

Consulter les jardins

Réserver un créneau

Voir ses réservations dans /reservations

Structure du projet
backend/
frontend/
db.sql
README.md