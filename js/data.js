const LIENS_RAPIDES = [
  { label: "Moodle", url: "https://moodle.psl.eu/course/view.php?id=42777", emoji: "🎓" },
  { label: "Site IBE3 (Python 101)", url: "https://ibe3.minesparis.psl.eu/P2026/cu/cs/c/101-python/04-functions-dictionaries.html", emoji: "🏫" },
  { label: "Site IBE3 (course units)", url: "https://ibe3.minesparis.psl.eu/P2026/cu/cs/", emoji: "📚" },
  { label: "Outlook (ma boîte)", url: "https://outlook.cloud.microsoft/mail/inbox/id/AAQkADA0NDFjZWRjLWNkMmMtNDcxZi04MWRjLTcyZGEzODhhZDIwNgAQABx%2Bu88L%2BwNJrqkZ2vNUJ3g%3D", emoji: "📧" },
  { label: "Oralangues", url: "https://oralangues.com/my/", emoji: "🗣️" }
];

const MOODLE_COURSES = "https://moodle.psl.eu/my/courses.php";
const IBE3_CS = "https://ibe3.minesparis.psl.eu/P2026/cu/cs/";

const COURS_SEED = [
  {
    id: "maths",
    nom: "Mathematics",
    prof: "Hervé Svoboda",
    couleur: "#ddd0f5",
    couleurFonce: "#8b6fc9",
    emoji: "📐",
    description: "Reasoning, logic, notations · Analysis · Linear Algebra",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "physique",
    nom: "Physics",
    prof: "Olivier Choffrut",
    couleur: "#bfe8d4",
    couleurFonce: "#4fae85",
    emoji: "⚛️",
    description: "Physics course unit.",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "geosciences",
    nom: "Geosciences",
    prof: "Caroline Mehl",
    couleur: "#f9c6d3",
    couleurFonce: "#cf6f92",
    emoji: "🌍",
    description: "Earth's Climate I: the Outer Envelopes",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "anglais",
    nom: "English",
    prof: "Olivia Levingston — Modern Languages",
    couleur: "#f7e8b0",
    couleurFonce: "#c2a44a",
    emoji: "🇬🇧",
    description: "Modern Languages — English + Oralangues.",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Oralangues", url: "https://oralangues.com/my/" },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "python",
    nom: "Computer Science",
    prof: "Georges-André Silber",
    couleur: "#bcd9f7",
    couleurFonce: "#5b8fc9",
    emoji: "💻",
    description: "Algorithms and Programming in Python 101 · Getting Started with FreeCAD",
    liens: [
      { label: "Moodle (cours 42777)", url: "https://moodle.psl.eu/course/view.php?id=42777" },
      { label: "Site IBE3 : Python 101", url: "https://ibe3.minesparis.psl.eu/P2026/cu/cs/c/101-python/04-functions-dictionaries.html" },
      { label: "Site IBE3 (course units)", url: IBE3_CS }
    ]
  },
  {
    id: "energie",
    nom: "Energy",
    prof: "Robin Girard",
    couleur: "#ffd9b8",
    couleurFonce: "#d08a4e",
    emoji: "⚡",
    description: "Introduction to Energy · Introduction to Energy and Climate Change Challenges (IE3C)",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "projets",
    nom: "SDG Projects",
    prof: "Philippe Blanc",
    couleur: "#e8dff5",
    couleurFonce: "#9678c9",
    emoji: "🌱",
    description: "Local hydrogen production for PERSEE's H2 lab · SunCrank · Malaquais: A Museum, 50 m2",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  },
  {
    id: "methodes",
    nom: "Working Methods",
    prof: "Sarah Kleinmann, Terrence Tran",
    couleur: "#d5e8e0",
    couleurFonce: "#5b9a85",
    emoji: "🧭",
    description: "Responsible Use of AI",
    liens: [
      { label: "Moodle", url: MOODLE_COURSES },
      { label: "Site IBE3", url: IBE3_CS }
    ]
  }
];

const EDT_SEED = [
  { id: "e1", coursId: "python", titre: "Computer Science — Python CM", jour: 1, debut: "09:00", fin: "10:30", salle: "Amphi A", type: "cours" },
  { id: "e2", coursId: "maths", titre: "Mathematics — CM", jour: 1, debut: "14:00", fin: "16:00", salle: "Amphi B", type: "cours" },
  { id: "e3", coursId: "physique", titre: "Physics — CM", jour: 2, debut: "08:00", fin: "10:00", salle: "Amphi C", type: "cours" },
  { id: "e4", coursId: null, titre: "Natation 🏊", jour: 2, debut: "20:00", fin: "21:00", salle: "Piscine", type: "sport" },
  { id: "e5", coursId: "geosciences", titre: "Geosciences — CM", jour: 3, debut: "10:00", fin: "12:00", salle: "Amphi D", type: "cours" },
  { id: "e6", coursId: "python", titre: "Python 101 — TD", jour: 3, debut: "14:00", fin: "15:30", salle: "Salle info", type: "cours" },
  { id: "e7", coursId: "maths", titre: "Mathematics — TD", jour: 4, debut: "09:00", fin: "11:00", salle: "Salle 8", type: "cours" },
  { id: "e8", coursId: "anglais", titre: "English — TD", jour: 4, debut: "14:00", fin: "15:30", salle: "Salle 3", type: "cours" },
  { id: "e9", coursId: null, titre: "Natation 🏊", jour: 4, debut: "20:00", fin: "21:00", salle: "Piscine", type: "sport" },
  { id: "e10", coursId: "physique", titre: "Physics — TP", jour: 5, debut: "09:00", fin: "12:00", salle: "Labo physique", type: "cours" },
  { id: "e11", coursId: "projets", titre: "SDG Projects — séance projet", jour: 5, debut: "14:00", fin: "16:00", salle: "Salle projet", type: "cours" },
  { id: "e12", coursId: "energie", titre: "Energy — TD", jour: 5, debut: "16:30", fin: "18:00", salle: "Salle 5", type: "cours" }
];

const DEVOIRS_SEED = [
  { id: "d1", coursId: "python", titre: "TP dictionnaires à rendre (Python 101)", offsetJours: 2, heure: "23:59", type: "devoir", desc: "Rendre le TP sur les dictionnaires sur Moodle.", lien: "https://moodle.psl.eu/course/view.php?id=42777", duree: 3 },
  { id: "d2", coursId: "maths", titre: "DM Analysis / Linear Algebra", offsetJours: 4, heure: "23:59", type: "devoir", desc: "Exercices du chapitre 3.", lien: MOODLE_COURSES, duree: 4 },
  { id: "d3", coursId: "anglais", titre: "Exercice Oralangues (English)", offsetJours: 1, heure: "20:00", type: "devoir", desc: "Session orale à valider sur Oralangues.", lien: "https://oralangues.com/my/", duree: 1 },
  { id: "d4", coursId: "physique", titre: "Compte-rendu de TP Physics", offsetJours: 6, heure: "23:59", type: "devoir", desc: "", lien: MOODLE_COURSES, duree: 2 },
  { id: "d5", coursId: "geosciences", titre: "Rapport Earth's Climate I", offsetJours: 5, heure: "23:59", type: "devoir", desc: "Rapport sur les enveloppes externes.", lien: MOODLE_COURSES, duree: 3 },
  { id: "d6", coursId: "projets", titre: "Avancement projet SDG", offsetJours: 7, heure: "23:59", type: "devoir", desc: "Point d'avancement du projet SDG.", lien: MOODLE_COURSES, duree: 4 }
];

const NOTES_SEED = {
  maths: [
    { id: "n3", titre: "DS Linear Algebra", note: 11, coeff: 2, date: "03/10/2026" }
  ],
  python: [
    { id: "n1", titre: "Interro fonctions", note: 14, coeff: 1, date: "12/09/2026" },
    { id: "n2", titre: "TP dictionnaires", note: 16, coeff: 1, date: "26/09/2026" }
  ],
  physique: [],
  geosciences: [],
  anglais: [],
  energie: [],
  projets: [],
  methodes: []
};

const TACHES_SEED = [
  { id: "t1", texte: "Réviser le chapitre dictionnaires (Python 101)", date: null, heure: "18:00", fait: false, priorite: "haute", coursId: "python" }
];

const RUBRIQUES = [
  { id: "devoirs", label: "Devoirs", emoji: "📝" },
  { id: "cours", label: "Cours", emoji: "📖" },
  { id: "activites", label: "Activités", emoji: "🎯" },
  { id: "tutoriels", label: "Tutoriels", emoji: "🎬" }
];

const HEURES = { debut: 7, fin: 22 };
