const LIENS_RAPIDES = [
  { label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777", emoji: "🎓" },
  { label: "Site IBE3", url: "https://ibe3.minesparis.psl.eu/P2026/cu/cs/c/101-python/04-functions-dictionaries.html", emoji: "🏫" },
  { label: "Outlook", url: "https://outlook.cloud.microsoft/mail/inbox", emoji: "📧" },
  { label: "Oralangues", url: "https://oralangues.com/my/", emoji: "🗣️" }
];

const COURS_SEED = [
  {
    id: "python",
    nom: "Python",
    couleur: "#bcd9f7",
    couleurFonce: "#5b8fc9",
    emoji: "🐍",
    description: "Programmation Python — fonctions, dictionnaires, TP.",
    liens: [
      { label: "Cours IBE3 : fonctions & dictionnaires", url: "https://ibe3.minesparis.psl.eu/P2026/cu/cs/c/101-python/04-functions-dictionaries.html" },
      { label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" }
    ]
  },
  {
    id: "maths",
    nom: "Mathématiques",
    couleur: "#ddd0f5",
    couleurFonce: "#8b6fc9",
    emoji: "📐",
    description: "Analyse, algèbre, probabilités.",
    liens: [{ label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" }]
  },
  {
    id: "physique",
    nom: "Physique",
    couleur: "#bfe8d4",
    couleurFonce: "#4fae85",
    emoji: "⚛️",
    description: "Mécanique, électricité, ondes.",
    liens: [{ label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" }]
  },
  {
    id: "eco",
    nom: "Économie & Gestion",
    couleur: "#ffd9b8",
    couleurFonce: "#d08a4e",
    emoji: "💼",
    description: "Microéconomie, gestion d'entreprise.",
    liens: [{ label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" }]
  },
  {
    id: "anglais",
    nom: "Anglais",
    couleur: "#f9c6d3",
    couleurFonce: "#cf6f92",
    emoji: "🇬🇧",
    description: "Anglais académique + Oralangues.",
    liens: [
      { label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" },
      { label: "Oralangues", url: "https://oralangues.com/my/" }
    ]
  },
  {
    id: "sainf",
    nom: "Sciences de l'ingénieur",
    couleur: "#f7e8b0",
    couleurFonce: "#c2a44a",
    emoji: "⚙️",
    description: "SI, modélisation, projets.",
    liens: [{ label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777" }]
  }
];

const EDT_SEED = [
  { id: "e1", coursId: "python", titre: "Python — CM", jour: 1, debut: "09:00", fin: "10:30", salle: "Amphi A", type: "cours" },
  { id: "e2", coursId: "maths", titre: "Maths — CM", jour: 1, debut: "14:00", fin: "16:00", salle: "Amphi B", type: "cours" },
  { id: "e3", coursId: "physique", titre: "Physique — CM", jour: 2, debut: "08:00", fin: "10:00", salle: "Amphi C", type: "cours" },
  { id: "e4", coursId: null, titre: "Natation 🏊", jour: 2, debut: "20:00", fin: "21:00", salle: "Piscine", type: "sport" },
  { id: "e5", coursId: "eco", titre: "Éco — TD", jour: 3, debut: "10:00", fin: "12:00", salle: "Salle 12", type: "cours" },
  { id: "e6", coursId: "python", titre: "Python — TD", jour: 3, debut: "14:00", fin: "15:30", salle: "Salle info", type: "cours" },
  { id: "e7", coursId: "maths", titre: "Maths — TD", jour: 4, debut: "09:00", fin: "11:00", salle: "Salle 8", type: "cours" },
  { id: "e8", coursId: "anglais", titre: "Anglais — TD", jour: 4, debut: "14:00", fin: "15:30", salle: "Salle 3", type: "cours" },
  { id: "e9", coursId: null, titre: "Natation 🏊", jour: 4, debut: "20:00", fin: "21:00", salle: "Piscine", type: "sport" },
  { id: "e10", coursId: "physique", titre: "Physique — TP", jour: 5, debut: "09:00", fin: "12:00", salle: "Labo physique", type: "cours" },
  { id: "e11", coursId: "sainf", titre: "Sciences de l'ingé — Projet", jour: 5, debut: "14:00", fin: "16:00", salle: "Salle projet", type: "cours" }
];

const DEVOIRS_SEED = [
  { id: "d1", coursId: "python", titre: "TP dictionnaires à rendre", offsetJours: 2, heure: "23:59", type: "devoir", desc: "Rendre le TP sur les dictionnaires sur Moodle." },
  { id: "d2", coursId: "maths", titre: "DM d'analyse", offsetJours: 4, heure: "23:59", type: "devoir", desc: "Exercices du chapitre 3." },
  { id: "d3", coursId: "anglais", titre: "Exercice Oralangues", offsetJours: 1, heure: "20:00", type: "devoir", desc: "Session orale à valider sur Oralangues." },
  { id: "d4", coursId: "physique", titre: "Compte-rendu de TP", offsetJours: 6, heure: "23:59", type: "devoir", desc: "" }
];

const NOTES_SEED = {
  python: [
    { id: "n1", titre: "Interro fonctions", note: 14, coeff: 1, date: "12/09/2026" },
    { id: "n2", titre: "TP dictionnaires", note: 16, coeff: 1, date: "26/09/2026" }
  ],
  maths: [
    { id: "n3", titre: "DS algèbre", note: 11, coeff: 2, date: "03/10/2026" }
  ],
  physique: [],
  eco: [],
  anglais: [],
  sainf: []
};

const TACHES_SEED = [
  { id: "t1", texte: "Réviser le chapitre dictionnaires (Python)", date: null, heure: "18:00", fait: false, priorite: "haute", coursId: "python" }
];

const RUBRIQUES = [
  { id: "devoirs", label: "Devoirs", emoji: "📝" },
  { id: "cours", label: "Cours", emoji: "📖" },
  { id: "activites", label: "Activités", emoji: "🎯" },
  { id: "tutoriels", label: "Tutoriels", emoji: "🎬" }
];

const HEURES = { debut: 7, fin: 22 };
