# 🎓 IBE3 Hub — ton espace étudiant perso

Site statique (HTML/CSS/JS pur, aucune installation, aucune dépendance) qui regroupe :

- 📅 **Emploi du temps** : semaine type + natation (mar/jeu 20h-21h) + tes événements perso, et toutes les **deadlines de devoirs affichées sur le même calendrier**
- 📚 **Cours** : une carte par cours, avec 4 rubriques (Devoirs, Cours, Activités, Tutoriels), chacune avec sa **zone de questions reliée à ChatGPT et Claude**
- 📊 **Notes** : notes par cours avec coefficients, moyenne, et couleur du **rouge (faible) au vert (bonne note)**
- 🧠 **Planning & révisions** : saisie en langage naturel (« réviser python pour vendredi ») avec **proposition de créneau libre** sur ton calendrier, génération auto de séances de révision (J-3 / J-1 avant chaque deadline), et bouton pour **demander un plan complet à l'IA** (ChatGPT / Claude)

Tes données sont stockées **localement dans ton navigateur** (localStorage) : événements, devoirs, notes, tâches, questions. Boutons d'export/import JSON dans l'onglet Planning.

## ▶️ Lancer le site

Ouvre simplement `index.html` dans ton navigateur (double-clic), ou sers le dossier localement :

```bash
cd ibe3-hub
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

## 🔧 Personnaliser (pour l'améliorer plus tard)

Tout se configure dans **`js/data.js`** :

- `LIENS_RAPIDES` : tes raccourcis (Moodle, Outlook, Oralangues...)
- `COURS_SEED` : ajoute/modifie tes cours (id, nom, couleur pastel, emoji, liens)
- `EDT_SEED` : ton emploi du temps type (jour : 1=lundi … 7=dimanche)
- `DEVOIRS_SEED` : devoirs de départ (décalés en jours depuis aujourd'hui)
- `NOTES_SEED`, `TACHES_SEED`, `RUBRIQUES` : idem

Les ajouts que tu fais dans l'interface sont enregistrés dans le navigateur et **ne modifient pas** `data.js`.

## 🔌 Moodle (onglet dédié)

Deux méthodes **sans jamais partager ton mot de passe ni tes cookies** :

1. **Token web service** : dans Moodle, *Profil → Préférences → Clés de sécurité → « Moodle mobile web service »*. Colle le token dans l'onglet 🔌 Moodle du site : il est stocké uniquement dans ton navigateur (localStorage) et n'est envoyé qu'à `moodle.psl.eu`. Le bouton « Synchroniser » récupère alors tes cours inscrits, tes devoirs (`mod_assign`) avec leurs dates de rendu, et les événements du calendrier Moodle — ils apparaissent sur ton emploi du temps et dans tes deadlines. Le token est révoquable à tout moment dans Moodle.
2. **Export .ics** : dans Moodle, *Calendrier → Exporter le calendrier*, colle l'URL .ics (ou importe le fichier téléchargé). Aucun token nécessaire.

Si le navigateur bloque l'appel direct (CORS), l'import .ics reste la solution de repli.

## 🚀 Idées d'améliorations futures

- Synchroniser les vraies deadlines Moodle via l'API web service (déjà intégré, voir onglet 🔌 Moodle)
- Recevoir les mails Outlook non lus dans un widget
- Mode sombre
- Rappels de notifications (Notification API) avant les deadlines
- Hébergement gratuit (GitHub Pages, Netlify, Vercel) pour y accéder depuis ton téléphone
- Appel direct à l'API ChatGPT/Claude depuis le site (clé API dans les réglages, jamais envoyée ailleurs que vers l'API)

## 📁 Structure

```
ibe3-hub/
├── index.html      # structure des 4 vues
├── css/style.css   # thème pastel
├── js/data.js      # ← TES données (cours, EDT, devoirs de départ)
└── js/app.js       # logique (calendrier, notes, planning, IA)
```
