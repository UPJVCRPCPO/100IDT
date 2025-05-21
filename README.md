# Répertoire Professionnel Interactif (Préversion)

Ceci est une préversion d'un répertoire professionnel interactif conçu pour aider les enseignants à identifier les besoins de leurs élèves grâce à une interface de chat IA.

## Fonctionnalités (Préversion)

*   Interface de chat en français.
*   Interaction basique avec une IA (basée sur des règles simples) pour discuter des situations professionnelles.
*   Sauvegarde de l'historique des conversations dans des fichiers JSON (dans le dossier `data`).

## Structure du Projet

*   `html/`: Contient les fichiers HTML (e.g., `index.html`).
*   `css/`: Contient les feuilles de style CSS (e.g., `style.css`).
*   `js/`: Contient les fichiers JavaScript côté client (e.g., `chat.js`).
*   `php/`: Contient les scripts PHP côté serveur (e.g., `chat_ai.php`, `data_manager.php`).
*   `data/`: Stocke les données JSON (e.g., historique des conversations). Ce dossier doit être accessible en écriture par le serveur web.

## Installation et Lancement

1.  Clonez ce dépôt.
2.  Assurez-vous que votre serveur web (e.g., Apache, Nginx) est configuré pour exécuter PHP.
3.  Pointez votre navigateur vers le fichier `html/index.html`.
4.  **Important**: Le serveur web doit avoir les permissions d'écriture sur le dossier `data/` pour que la sauvegarde des conversations fonctionne.

## Utilisation

Ouvrez `html/index.html` dans votre navigateur. Vous pouvez commencer à interagir avec l'IA en tapant des messages dans la boîte de dialogue. Les conversations sont automatiquement sauvegardées.

---

*Ce projet est en cours de développement.*
