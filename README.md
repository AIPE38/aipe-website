# AIPE | Association Intercommunale Petite Enfance de Moirans

Une association pour les enfants, les parents et les professionnels.

## Installation

```bash
# Cloné le dépot
git clone https://github.com/AIPE38/aipe-website.git

# On se place dans le répertoire
cd aipe-website/

# Installer les dépendances du projet
npm install -y
```

## Build & Run

|Commande|Effet|
|--------|-----|
|`npx eleventy`|Build|
|`npx eleventy --serve`|Run + lancement serveur local|
|`npx netlify-cms-proxy-server`|Run CMS à l'adresse `<yoursiteaddress.com>/admin/`|