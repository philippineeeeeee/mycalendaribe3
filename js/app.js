const CLE_STOCKAGE = "ibe3-hub-v1";
const JOURS_NOMS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const HAUTEUR_HEURE = 60;

let state = charger();
let decalageSemaine = 0;
let ui = { coursId: null, rubriqueId: "devoirs" };

function uid() {
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function aujourdhui() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseISO(s) {
  const p = s.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
}

function iso(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}

function addJours(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function prochainJour(jourCible) {
  const d = aujourdhui();
  let diff = (jourCible - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  return addJours(d, diff);
}

function lundiDeLaSemaine(d) {
  return addJours(d, -((d.getDay() + 6) % 7));
}

function heureEnMin(h) {
  const p = h.split(":");
  return (+p[0]) * 60 + (+p[1] || 0);
}

function minEnHeure(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fmtDate(s) {
  return parseISO(s).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function fmtDateLongue(s) {
  return parseISO(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function ecartEnJours(a, b) {
  return Math.round((parseISO(a) - parseISO(b)) / 86400000);
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut) {
      const s = JSON.parse(brut);
      if (s && s.devoirs && s.eventsPerso) {
        s.moodleToken = s.moodleToken || "";
        s.eventsMoodle = s.eventsMoodle || [];
        return s;
      }
    }
  } catch (e) { }
  return etatDefaut();
}

function etatDefaut() {
  const auj = iso(aujourdhui());
  return {
    eventsPerso: [],
    eventsMoodle: [],
    moodleToken: "",
    devoirs: DEVOIRS_SEED.map(d => ({ ...d, date: iso(addJours(aujourdhui(), d.offsetJours)) })),
    items: {},
    qa: {},
    notes: JSON.parse(JSON.stringify(NOTES_SEED)),
    taches: TACHES_SEED.map(t => ({ ...t, date: t.date || auj }))
  };
}

function sauvegarder() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(state)); } catch (e) { }
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), 2600);
}

function coursParId(id) {
  return COURS_SEED.find(c => c.id === id) || null;
}

function couleurEvenement(ev) {
  if (ev.type === "sport") return { fond: "#e2f5fa", bord: "#5bb8d4" };
  if (ev.type === "devoir") return { fond: "#fdeaea", bord: "#e07a7a" };
  if (ev.type === "revision") return { fond: "#f4ecfd", bord: "#c9a2e8" };
  if (ev.type === "perso") return { fond: "#f1f0f7", bord: "#b8b3c9" };
  const c = coursParId(ev.coursId);
  if (c) return { fond: c.couleur, bord: c.couleurFonce };
  return { fond: "#eef2fb", bord: "#9fb6d9" };
}

function eventsPourDate(dateISO) {
  const d = parseISO(dateISO);
  const dow = d.getDay();
  const liste = [];
  for (const e of EDT_SEED) {
    if (e.jour === dow) liste.push({ ...e, source: "edt", id: e.id });
  }
  for (const e of state.eventsPerso) {
    if (e.hebdo && e.jour === dow) liste.push({ ...e, source: "perso" });
    else if (!e.hebdo && e.date === dateISO) liste.push({ ...e, source: "perso" });
  }
  for (const e of (state.eventsMoodle || [])) {
    if (e.date === dateISO) liste.push({ ...e, source: "moodle" });
  }
  return liste;
}

function devoirsPourDate(dateISO) {
  return state.devoirs.filter(d => d.date === dateISO);
}

function intervallesOccupes(dateISO) {
  const occ = eventsPourDate(dateISO).map(e => ({ debut: heureEnMin(e.debut), fin: heureEnMin(e.fin) }));
  for (const d of devoirsPourDate(dateISO)) {
    occ.push({ debut: heureEnMin(d.heure), fin: heureEnMin(d.heure) + 30 });
  }
  return occ;
}

function chevauche(aDebut, aFin, bDebut, bFin) {
  return aDebut < bFin && bDebut < aFin;
}

function trouverCreneau(dateISO, dureeMin, prefMin) {
  const dates = [dateISO, iso(addJours(parseISO(dateISO), -1)), iso(addJours(parseISO(dateISO), -2))];
  for (const d of dates) {
    const occ = intervallesOccupes(d);
    const essais = [];
    if (prefMin != null) essais.push(prefMin);
    for (let m = 8 * 60; m <= 21 * 60; m += 30) essais.push(m);
    for (const debut of essais) {
      const fin = debut + dureeMin;
      if (fin > 22 * 60) continue;
      if (!occ.some(o => chevauche(debut, fin, o.debut, o.fin))) {
        return { date: d, debut, fin };
      }
    }
  }
  return { date: dateISO, debut: 18 * 60, fin: 18 * 60 + dureeMin };
}

function rendreCalendrier() {
  const lundi = lundiDeLaSemaine(addJours(aujourdhui(), decalageSemaine * 7));
  const dates = [];
  for (let i = 0; i < 7; i++) dates.push(iso(addJours(lundi, i)));
  const aujISO = iso(aujourdhui());

  const debutFmt = parseISO(dates[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const finFmt = parseISO(dates[6]).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  document.getElementById("semaine-label").textContent = `${debutFmt} – ${finFmt}`;

  let headerHTML = `<div class="cal-gutter"><div class="cal-col-header"></div></div>`;
  let bodyHTML = `<div class="cal-gutter">`;
  for (let h = HEURES.debut; h < HEURES.fin; h++) {
    bodyHTML += `<div class="cal-heure">${String(h).padStart(2, "0")}:00</div>`;
  }
  bodyHTML += `</div>`;

  dates.forEach((dateISO) => {
    const d = parseISO(dateISO);
    const estAuj = dateISO === aujISO;
    headerHTML += `<div class="cal-col-header ${estAuj ? "aujourdhui" : ""}">${JOURS_COURTS[d.getDay()]}<span class="num">${d.getDate()}</span></div>`;
  });

  dates.forEach(dateISO => {
    const d = parseISO(dateISO);
    const estAuj = dateISO === aujISO;
    bodyHTML += `<div class="cal-jour ${estAuj ? "aujourdhui-col" : ""}" data-date="${dateISO}">`;
    for (let h = HEURES.debut; h < HEURES.fin; h++) {
      html += `<div class="cal-ligne-heure" style="top:${(h - HEURES.debut) * HAUTEUR_HEURE}px"></div>`;
    }
    for (const dv of devoirsPourDate(dateISO)) {
      bodyHTML += `<span class="chip-devoir" data-devoir="${dv.id}" title="${dv.titre} — à rendre ${fmtDate(dv.date)} à ${dv.heure}">⚠️ ${dv.titre}</span>`;
    }
    for (const ev of eventsPourDate(dateISO)) {
      const c = couleurEvenement(ev);
      const top = (heureEnMin(ev.debut) - HEURES.debut * 60);
      const hauteur = Math.max(heureEnMin(ev.fin) - heureEnMin(ev.debut), 20);
      const salle = ev.salle ? `<span class="ev-salle">${ev.salle}</span>` : "";
      bodyHTML += `<div class="evenement type-${ev.type}" data-source="${ev.source}" data-id="${ev.id}"
        style="top:${top}px;height:${hauteur}px;background:${c.fond};border-left-color:${c.bord}">
        <span class="ev-titre">${ev.titre}</span>${salle}</div>`;
    }
    for (const dv of devoirsPourDate(dateISO)) {
      if (dv.heure === "23:59") continue;
      const c = couleurEvenement({ type: "devoir" });
      const top = heureEnMin(dv.heure) - HEURES.debut * 60;
      bodyHTML += `<div class="evenement type-devoir" data-source="devoir" data-id="${dv.id}"
        style="top:${top}px;height:26px;background:${c.fond};border-left-color:${c.bord}">
        <span class="ev-titre">⏰ ${dv.heure}</span></div>`;
    }
    bodyHTML += `</div>`;
  });

  document.getElementById("calendrier").innerHTML = `<div class="cal-header">${headerHTML}</div><div class="cal-body">${bodyHTML}</div>`;

  document.querySelectorAll(".evenement").forEach(el => {
    el.addEventListener("click", () => ouvrirDetailEvenement(el.dataset.source, el.dataset.id));
  });
  document.querySelectorAll(".chip-devoir").forEach(el => {
    el.addEventListener("click", () => ouvrirDetailDevoir(el.dataset.devoir));
  });
  document.querySelectorAll(".cal-jour").forEach(el => {
    el.addEventListener("dblclick", () => ouvrirModalEvenement(el.dataset.date));
  });
}

function rendreLegende() {
  let html = "";
  for (const c of COURS_SEED) {
    html += `<span class="item"><span class="pastille" style="background:${c.couleur}"></span>${c.nom}</span>`;
  }
  html += `<span class="item"><span class="pastille" style="background:#fdeaea;border-color:#e07a7a"></span>Deadline</span>`;
  html += `<span class="item"><span class="pastille" style="background:#f4ecfd;border-color:#c9a2e8"></span>Révision</span>`;
  html += `<span class="item"><span class="pastille" style="background:#e2f5fa;border-color:#5bb8d4"></span>Sport</span>`;
  document.getElementById("legende").innerHTML = html;
}

function optionsCours(selected) {
  return COURS_SEED.map(c => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.emoji} ${c.nom}</option>`).join("");
}

function ouvrirModal(titre, corpsHTML) {
  document.getElementById("modal-titre").textContent = titre;
  document.getElementById("modal-corps").innerHTML = corpsHTML;
  document.getElementById("modal").classList.remove("hidden");
}

function fermerModal() {
  document.getElementById("modal").classList.add("hidden");
}

function ouvrirModalEvenement(datePrefill) {
  const date = datePrefill || iso(aujourdhui());
  ouvrirModal("＋ Ajouter un événement", `
    <div class="form-champ"><label>Titre</label><input type="text" id="f-titre" placeholder="Ex : Réunion projet, dentiste..."></div>
    <div class="form-ligne">
      <div class="form-champ"><label>Type</label>
        <select id="f-type">
          <option value="perso">Perso</option>
          <option value="cours">Cours</option>
          <option value="sport">Sport</option>
          <option value="revision">Révision</option>
        </select></div>
      <div class="form-champ"><label>Cours (optionnel)</label><select id="f-cours"><option value="">—</option>${optionsCours("")}</select></div>
    </div>
    <div class="form-champ"><label>Date</label><input type="date" id="f-date" value="${date}"></div>
    <div class="form-ligne">
      <div class="form-champ"><label>Début</label><input type="time" id="f-debut" value="18:00"></div>
      <div class="form-champ"><label>Fin</label><input type="time" id="f-fin" value="19:00"></div>
    </div>
    <div class="form-champ"><label>Lieu (optionnel)</label><input type="text" id="f-salle"></div>
    <div class="form-champ"><label><input type="checkbox" id="f-hebdo"> Se répète chaque semaine ce jour-là</label></div>
    <div class="form-actions">
      <button class="btn-ghost" id="f-annuler">Annuler</button>
      <button class="btn" id="f-valider">Ajouter</button>
    </div>
  `);
  document.getElementById("f-annuler").addEventListener("click", fermerModal);
  document.getElementById("f-valider").addEventListener("click", () => {
    const titre = document.getElementById("f-titre").value.trim();
    if (!titre) { toast("Donne un titre à l'événement"); return; }
    const dateV = document.getElementById("f-date").value;
    const hebdo = document.getElementById("f-hebdo").checked;
    state.eventsPerso.push({
      id: uid(),
      titre,
      coursId: document.getElementById("f-cours").value || null,
      type: document.getElementById("f-type").value,
      date: dateV,
      jour: parseISO(dateV).getDay(),
      debut: document.getElementById("f-debut").value,
      fin: document.getElementById("f-fin").value,
      salle: document.getElementById("f-salle").value.trim(),
      hebdo
    });
    sauvegarder();
    fermerModal();
    rendreTout();
    toast("Événement ajouté ✅");
  });
}

function ouvrirModalDevoir() {
  const date = iso(addJours(aujourdhui(), 3));
  ouvrirModal("＋ Ajouter un devoir / deadline", `
    <div class="form-champ"><label>Titre</label><input type="text" id="f-titre" placeholder="Ex : DM de maths, TP Python..."></div>
    <div class="form-champ"><label>Cours</label><select id="f-cours">${optionsCours("python")}</select></div>
    <div class="form-ligne">
      <div class="form-champ"><label>Date de rendu</label><input type="date" id="f-date" value="${date}"></div>
      <div class="form-champ"><label>Heure</label><input type="time" id="f-heure" value="23:59"></div>
    </div>
    <div class="form-champ"><label>Description (optionnel)</label><textarea id="f-desc" rows="2"></textarea></div>
    <div class="form-ligne">
      <div class="form-champ"><label>Lien de la source (Moodle, Oralangues…)</label><input type="url" id="f-lien" placeholder="https://..."></div>
      <div class="form-champ"><label>Durée estimée (h)</label><input type="number" id="f-duree" min="0.5" max="20" step="0.5" value="3"></div>
    </div>
    <div class="form-actions">
      <button class="btn-ghost" id="f-annuler">Annuler</button>
      <button class="btn btn-accent" id="f-valider">Ajouter</button>
    </div>
  `);
  document.getElementById("f-annuler").addEventListener("click", fermerModal);
  document.getElementById("f-valider").addEventListener("click", () => {
    const titre = document.getElementById("f-titre").value.trim();
    if (!titre) { toast("Donne un titre au devoir"); return; }
    state.devoirs.push({
      id: uid(),
      titre,
      coursId: document.getElementById("f-cours").value,
      date: document.getElementById("f-date").value,
      heure: document.getElementById("f-heure").value || "23:59",
      type: "devoir",
      desc: document.getElementById("f-desc").value.trim(),
      lien: document.getElementById("f-lien").value.trim(),
      duree: parseFloat(document.getElementById("f-duree").value) || 3
    });
    sauvegarder();
    fermerModal();
    rendreTout();
    toast("Devoir ajouté au calendrier ✅");
  });
}

function ouvrirDetailEvenement(source, id) {
  if (source === "moodle") {
    const e = (state.eventsMoodle || []).find(x => x.id === id);
    if (!e) return;
    const c = coursParId(e.coursId);
    ouvrirModal(e.titre, `
      <p><strong>Source :</strong> Moodle 📥</p>
      ${c ? `<p><strong>Cours :</strong> ${c.emoji} ${c.nom}</p>` : ""}
      <p><strong>Date :</strong> ${fmtDateLongue(e.date)}</p>
      <p><strong>Horaire :</strong> ${e.debut} – ${e.fin}</p>
      <div class="form-actions">
        <button class="btn btn-danger-ghost" id="f-suppr">Masquer</button>
        <button class="btn" id="f-ok">OK</button>
      </div>
    `);
    document.getElementById("f-ok").addEventListener("click", fermerModal);
    document.getElementById("f-suppr").addEventListener("click", () => {
      state.eventsMoodle = state.eventsMoodle.filter(x => x.id !== id);
      sauvegarder();
      fermerModal();
      rendreTout();
      toast("Événement masqué (il reviendra à la prochaine synchro Moodle)");
    });
    return;
  }
  if (source === "edt") {
    const e = EDT_SEED.find(x => x.id === id);
    const c = coursParId(e.coursId);
    ouvrirModal(e.titre, `
      <p><strong>Cours :</strong> ${c ? c.nom : "—"}</p>
      <p><strong>Jour :</strong> ${JOURS_NOMS[e.jour]}</p>
      <p><strong>Horaire :</strong> ${e.debut} – ${e.fin}</p>
      <p><strong>Lieu :</strong> ${e.salle || "—"}</p>
      <p class="hint" style="margin-top:10px">Cet horaire fait partie de l'emploi du temps type (modifiable dans js/data.js).</p>
      <div class="form-actions"><button class="btn" id="f-ok">OK</button></div>
    `);
    document.getElementById("f-ok").addEventListener("click", fermerModal);
    return;
  }
  const e = state.eventsPerso.find(x => x.id === id);
  if (!e) return;
  const c = coursParId(e.coursId);
  ouvrirModal(e.titre, `
    <p><strong>Type :</strong> ${e.type}</p>
    ${c ? `<p><strong>Cours :</strong> ${c.nom}</p>` : ""}
    <p><strong>Date :</strong> ${e.hebdo ? "chaque " + JOURS_NOMS[e.jour] : fmtDateLongue(e.date)}</p>
    <p><strong>Horaire :</strong> ${e.debut} – ${e.fin}</p>
    ${e.salle ? `<p><strong>Lieu :</strong> ${e.salle}</p>` : ""}
    <div class="form-actions">
      <button class="btn btn-danger-ghost" id="f-suppr">Supprimer</button>
      <button class="btn" id="f-ok">OK</button>
    </div>
  `);
  document.getElementById("f-ok").addEventListener("click", fermerModal);
  document.getElementById("f-suppr").addEventListener("click", () => {
    state.eventsPerso = state.eventsPerso.filter(x => x.id !== id);
    sauvegarder();
    fermerModal();
    rendreTout();
    toast("Événement supprimé");
  });
}

function ouvrirDetailDevoir(id) {
  const d = state.devoirs.find(x => x.id === id);
  if (!d) return;
  const c = coursParId(d.coursId);
  const reste = ecartEnJours(d.date, iso(aujourdhui()));
  const nomCours = d.coursNom || (c ? c.nom : "—");
  ouvrirModal(`⚠️ ${d.titre}`, `
    <p><strong>Cours :</strong> ${c ? c.emoji + " " : ""}${nomCours}</p>
    <p><strong>À rendre :</strong> ${fmtDateLongue(d.date)} à ${d.heure}</p>
    <p><strong>Dans :</strong> ${reste <= 0 ? "aujourd'hui !" : reste === 1 ? "demain" : reste + " jours"}</p>
    <p><strong>Travail prévu :</strong> ${d.duree || 3} h</p>
    ${d.lien ? `<p><strong>Source :</strong> <a href="${d.lien}" target="_blank" rel="noopener">🔗 ouvrir le lien</a></p>` : ""}
    ${d.desc ? `<p><strong>Description :</strong> ${d.desc}</p>` : ""}
    <div class="form-actions">
      <button class="btn btn-accent" id="f-revision">🧠 Programmer une révision</button>
      <button class="btn btn-danger-ghost" id="f-suppr">Supprimer</button>
      <button class="btn" id="f-ok">OK</button>
    </div>
  `);
  document.getElementById("f-ok").addEventListener("click", fermerModal);
  document.getElementById("f-suppr").addEventListener("click", () => {
    state.devoirs = state.devoirs.filter(x => x.id !== id);
    sauvegarder();
    fermerModal();
    rendreTout();
    toast("Devoir supprimé");
  });
  document.getElementById("f-revision").addEventListener("click", () => {
    const creneau = trouverCreneau(iso(addJours(parseISO(d.date), -1)), 60, 18 * 60);
    state.eventsPerso.push({
      id: uid(),
      titre: `Révision : ${d.titre}`,
      coursId: d.coursId,
      type: "revision",
      date: creneau.date,
      jour: parseISO(creneau.date).getDay(),
      debut: minEnHeure(creneau.debut),
      fin: minEnHeure(creneau.fin),
      salle: "",
      hebdo: false
    });
    sauvegarder();
    fermerModal();
    rendreTout();
    toast(`Séance de révision ajoutée le ${fmtDate(creneau.date)} à ${minEnHeure(creneau.debut)} 🧠`);
  });
}

function rendreListeCours() {
  const el = document.getElementById("liste-cours");
  el.innerHTML = COURS_SEED.map(c => `
    <div class="carte-cours" data-cours="${c.id}" style="--couleur:${c.couleur}">
      <span class="emoji">${c.emoji}</span>
      <h3>${c.nom}</h3>
      ${c.prof ? `<p style="font-size:0.78rem;color:var(--texte-doux)">👤 ${c.prof}</p>` : ""}
      <p>${c.description}</p>
    </div>
  `).join("");
  el.querySelectorAll(".carte-cours").forEach(carte => {
    carte.addEventListener("click", () => {
      ui.coursId = carte.dataset.cours;
      ui.rubriqueId = "devoirs";
      document.getElementById("detail-cours").classList.remove("hidden");
      rendreDetailCours();
      document.getElementById("detail-cours").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function rendreDetailCours() {
  const c = coursParId(ui.coursId);
  if (!c) return;
  const el = document.getElementById("detail-cours");
  const liens = c.liens.map(l => `<a href="${l.url}" target="_blank" rel="noopener">🔗 ${l.label}</a>`).join("");
  const tabs = RUBRIQUES.map(r => `
    <button class="rubrique-tab ${ui.rubriqueId === r.id ? "active" : ""}" data-rub="${r.id}">${r.emoji} ${r.label}</button>
  `).join("");

  const items = (state.items[c.id] && state.items[c.id][ui.rubriqueId]) || [];
  const itemsHTML = items.length === 0
    ? `<p class="hint">Rien ici pour l'instant — ajoute un élément ci-dessous.</p>`
    : `<ul class="liste-items">${items.map(it => `
      <li>
        <span>${it.url ? `<a href="${it.url}" target="_blank" rel="noopener">${it.titre}</a>` : it.titre}
        ${it.note ? `<span class="meta"> — ${it.note}</span>` : ""}</span>
        <button class="btn-suppr" data-item="${it.id}" title="Supprimer">🗑</button>
      </li>`).join("")}</ul>`;

  const cleQA = `${c.id}:${ui.rubriqueId}`;
  const histo = state.qa[cleQA] || [];
  const histoHTML = histo.length === 0 ? "" : `<div class="historique-qa"><strong>Mes questions précédentes :</strong>${histo.map(q =>
    `<div class="q">${q.question}<span class="date">${q.date}</span></div>`).join("")}</div>`;

  const rubrique = RUBRIQUES.find(r => r.id === ui.rubriqueId);

  el.innerHTML = `
    <button class="btn-ghost retour" id="btn-retour-cours">‹ Tous les cours</button>
    <h2>${c.emoji} ${c.nom}</h2>
    ${c.prof ? `<p class="desc">👤 ${c.prof}</p>` : ""}
    <p class="desc">${c.description}</p>
    <div class="liens-cours">${liens}</div>
    <div class="rubriques-tabs">${tabs}</div>
    <h3 style="margin-bottom:10px">${rubrique.emoji} ${rubrique.label}</h3>
    ${itemsHTML}
    <button class="btn btn-petit" id="btn-ajout-item">＋ Ajouter dans « ${rubrique.label} »</button>
    <div class="zone-qa" style="margin-top:20px">
      <h3>💬 Pose ta question sur « ${rubrique.label} » (${c.nom})</h3>
      <textarea id="qa-texte" placeholder="Ta question ici..."></textarea>
      <div class="boutons-ia">
        <a class="btn-ia btn-chatgpt" id="qa-gpt" target="_blank" rel="noopener">💚 Demander à ChatGPT</a>
        <a class="btn-ia btn-claude" id="qa-claude" target="_blank" rel="noopener">🧡 Demander à Claude</a>
        <button class="btn btn-enregistrer btn-petit" id="qa-save">💾 Sauvegarder la question</button>
      </div>
      ${histoHTML}
    </div>
  `;

  el.querySelector("#btn-retour-cours").addEventListener("click", () => {
    el.classList.add("hidden");
    ui.coursId = null;
  });
  el.querySelectorAll(".rubrique-tab").forEach(b => {
    b.addEventListener("click", () => {
      ui.rubriqueId = b.dataset.rub;
      rendreDetailCours();
    });
  });
  el.querySelectorAll(".btn-suppr").forEach(b => {
    b.addEventListener("click", () => {
      state.items[c.id][ui.rubriqueId] = state.items[c.id][ui.rubriqueId].filter(it => it.id !== b.dataset.item);
      sauvegarder();
      rendreDetailCours();
    });
  });
  el.querySelector("#btn-ajout-item").addEventListener("click", () => ouvrirModalItem(c.id, ui.rubriqueId));

  const majLiensIA = () => {
    const q = el.querySelector("#qa-texte").value.trim();
    const prompt = promptIA(c, rubrique, q || "(ma question arrive dans le chat)");
    el.querySelector("#qa-gpt").href = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
    el.querySelector("#qa-claude").href = "https://claude.ai/new?q=" + encodeURIComponent(prompt);
  };
  majLiensIA();
  el.querySelector("#qa-texte").addEventListener("input", majLiensIA);
  el.querySelector("#qa-save").addEventListener("click", () => {
    const q = el.querySelector("#qa-texte").value.trim();
    if (!q) { toast("Écris d'abord ta question"); return; }
    if (!state.qa[cleQA]) state.qa[cleQA] = [];
    state.qa[cleQA].unshift({ id: uid(), question: q, date: new Date().toLocaleDateString("fr-FR") });
    sauvegarder();
    rendreDetailCours();
    toast("Question sauvegardée 💾");
  });
}

function promptIA(cours, rubrique, question) {
  return `Tu es un assistant pédagogique pour un étudiant en 1ère année de bachelor ingénieur (IBE3, Mines Paris - PSL).
Cours : ${cours.nom}
Rubrique : ${rubrique.label}
Ma question : ${question}
Réponds de façon claire et pédagogique, avec des exemples concrets si c'est utile.`;
}

function ouvrirModalItem(coursId, rubriqueId) {
  const c = coursParId(coursId);
  const r = RUBRIQUES.find(x => x.id === rubriqueId);
  ouvrirModal(`＋ Ajouter dans ${r.emoji} ${r.label} — ${c.nom}`, `
    <div class="form-champ"><label>Titre</label><input type="text" id="f-titre" placeholder="Ex : Chapitre 4, vidéo YouTube..."></div>
    <div class="form-champ"><label>Lien (optionnel)</label><input type="url" id="f-url" placeholder="https://..."></div>
    <div class="form-champ"><label>Note / commentaire (optionnel)</label><input type="text" id="f-note" placeholder="Ex : à relire avant le DS"></div>
    <div class="form-actions">
      <button class="btn-ghost" id="f-annuler">Annuler</button>
      <button class="btn" id="f-valider">Ajouter</button>
    </div>
  `);
  document.getElementById("f-annuler").addEventListener("click", fermerModal);
  document.getElementById("f-valider").addEventListener("click", () => {
    const titre = document.getElementById("f-titre").value.trim();
    if (!titre) { toast("Donne un titre"); return; }
    if (!state.items[coursId]) state.items[coursId] = {};
    if (!state.items[coursId][rubriqueId]) state.items[coursId][rubriqueId] = [];
    state.items[coursId][rubriqueId].unshift({
      id: uid(),
      titre,
      url: document.getElementById("f-url").value.trim(),
      note: document.getElementById("f-note").value.trim(),
      date: new Date().toLocaleDateString("fr-FR")
    });
    sauvegarder();
    fermerModal();
    rendreDetailCours();
    toast("Ajouté ✅");
  });
}

function couleurNote(n) {
  const hue = Math.max(0, Math.min(20, n)) / 20 * 120;
  return {
    fond: `hsl(${hue}, 70%, 82%)`,
    texte: `hsl(${hue}, 55%, 30%)`
  };
}

function rendreNotes() {
  const el = document.getElementById("liste-notes");
  el.innerHTML = COURS_SEED.map(c => {
    const notes = state.notes[c.id] || [];
    let moyenne = null;
    if (notes.length > 0) {
      const somme = notes.reduce((a, n) => a + n.note * n.coeff, 0);
      const poids = notes.reduce((a, n) => a + n.coeff, 0);
      moyenne = poids > 0 ? somme / poids : null;
    }
    const lignes = notes.length === 0
      ? `<tr><td colspan="4" class="hint">Aucune note pour l'instant.</td></tr>`
      : notes.map(n => {
        const col = couleurNote(n.note);
        return `<tr>
          <td>${n.titre}<br><span class="meta" style="color:var(--texte-doux);font-size:0.75rem">${n.date}</span></td>
          <td>×${n.coeff}</td>
          <td><span class="case-note" style="background:${col.fond};color:${col.texte}">${n.note}/20</span></td>
          <td><button class="btn-suppr" data-note="${n.id}" data-cours="${c.id}">🗑</button></td>
        </tr>`;
      }).join("");
    const moyHTML = moyenne === null
      ? `<span style="color:var(--texte-doux);font-weight:600">Pas encore de note</span>`
      : (() => { const col = couleurNote(moyenne); return `<span class="case-note" style="background:${col.fond};color:${col.texte}">${moyenne.toFixed(2)}/20</span>`; })();
    return `
      <div class="carte-notes" style="--couleur:${c.couleur}">
        <h3>${c.emoji} ${c.nom}</h3>
        <table class="table-notes">
          <tr><th>Évaluation</th><th>Coeff</th><th>Note</th><th></th></tr>
          ${lignes}
        </table>
        <div class="moyenne"><span>Moyenne</span>${moyHTML}</div>
      </div>`;
  }).join("");

  el.querySelectorAll(".btn-suppr").forEach(b => {
    b.addEventListener("click", () => {
      const cid = b.dataset.cours;
      state.notes[cid] = (state.notes[cid] || []).filter(n => n.id !== b.dataset.note);
      sauvegarder();
      rendreNotes();
    });
  });
}

function ouvrirModalNote() {
  ouvrirModal("＋ Ajouter une note", `
    <div class="form-champ"><label>Cours</label><select id="f-cours">${optionsCours("python")}</select></div>
    <div class="form-champ"><label>Titre de l'évaluation</label><input type="text" id="f-titre" placeholder="Ex : DS n°2, interro, TP..."></div>
    <div class="form-ligne">
      <div class="form-champ"><label>Note (/20)</label><input type="number" id="f-note" min="0" max="20" step="0.25" value="12"></div>
      <div class="form-champ"><label>Coefficient</label><input type="number" id="f-coeff" min="0.5" max="10" step="0.5" value="1"></div>
    </div>
    <div class="form-champ"><label>Date</label><input type="date" id="f-date" value="${iso(aujourdhui())}"></div>
    <div class="form-actions">
      <button class="btn-ghost" id="f-annuler">Annuler</button>
      <button class="btn" id="f-valider">Ajouter</button>
    </div>
  `);
  document.getElementById("f-annuler").addEventListener("click", fermerModal);
  document.getElementById("f-valider").addEventListener("click", () => {
    const titre = document.getElementById("f-titre").value.trim();
    const note = parseFloat(document.getElementById("f-note").value);
    if (!titre || isNaN(note)) { toast("Titre et note requis"); return; }
    const cid = document.getElementById("f-cours").value;
    if (!state.notes[cid]) state.notes[cid] = [];
    state.notes[cid].unshift({
      id: uid(),
      titre,
      note: Math.max(0, Math.min(20, note)),
      coeff: parseFloat(document.getElementById("f-coeff").value) || 1,
      date: parseISO(document.getElementById("f-date").value).toLocaleDateString("fr-FR")
    });
    sauvegarder();
    fermerModal();
    rendreNotes();
    toast("Note ajoutée ✅");
  });
}

function analyserTexte(t) {
  const bas = t.toLowerCase();
  const joursMap = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0 };
  let date = null;
  for (const [nom, j] of Object.entries(joursMap)) {
    if (bas.includes(nom)) { date = iso(prochainJour(j)); break; }
  }
  let m = bas.match(/dans\s+(\d+)\s+jours?/);
  if (m) date = iso(addJours(aujourdhui(), parseInt(m[1])));
  if (/\bdemain\b/.test(bas)) date = iso(addJours(aujourdhui(), 1));
  if (/aujourd'hui|ce soir/.test(bas)) date = iso(aujourdhui());
  if (/week[- ]?end/.test(bas)) date = iso(prochainJour(6));

  let heure = null;
  m = bas.match(/à\s*(\d{1,2})\s*h\s*(\d{2})?/) || bas.match(/(\d{1,2})\s*h\s*(\d{2})/);
  if (m) heure = `${String(m[1]).padStart(2, "0")}:${m[2] || "00"}`;

  let coursId = null;
  for (const c of COURS_SEED) {
    const mots = c.nom.toLowerCase().split(/[^a-zàâäéèêëîïôöùûüç]+/).filter(w => w.length > 2);
    if (bas.includes(c.id) || mots.some(w => bas.includes(w))) { coursId = c.id; break; }
  }

  let type = "tache";
  if (/rendre|devoir|\bdm\b|\bds\b|examen|contrôle|controle|oral|tp à|à rendre|interro/.test(bas)) type = "devoir";
  else if (/révis|revision|réviser|review|bachoter/.test(bas)) type = "revision";

  return { texte: t.trim(), date, heure, coursId, type };
}

function rendreProposition(analyse) {
  const el = document.getElementById("proposition");
  const c = coursParId(analyse.coursId);
  let creneau = null;
  if (analyse.date) {
    const pref = analyse.heure ? heureEnMin(analyse.heure) : 18 * 60;
    creneau = trouverCreneau(analyse.date, 60, analyse.type === "devoir" ? null : pref);
  }
  const tags = [];
  tags.push(`<span class="tag">${analyse.type === "devoir" ? "📝 Devoir" : analyse.type === "revision" ? "🧠 Révision" : "✅ Tâche"}</span>`);
  if (c) tags.push(`<span class="tag" style="background:${c.couleurFonce}">${c.emoji} ${c.nom}</span>`);
  if (analyse.date) tags.push(`<span class="tag" style="background:#9fb6d9">📅 ${fmtDateLongue(analyse.date)}${analyse.heure ? " à " + analyse.heure : ""}</span>`);

  let creneauHTML = "";
  if (creneau) {
    creneauHTML = `<p class="hint" style="margin:8px 0 10px">💡 Créneau libre proposé : <strong>${fmtDateLongue(creneau.date)}, ${minEnHeure(creneau.debut)} – ${minEnHeure(creneau.fin)}</strong></p>`;
  }

  el.innerHTML = `
    <div class="resume">${tags.join("")} ${analyse.texte}</div>
    ${creneauHTML}
    <div class="actions-header">
      ${creneau ? `<button class="btn" id="prop-cal">📅 Ajouter au calendrier (${minEnHeure(creneau.debut)})</button>` : ""}
      <button class="btn btn-accent" id="prop-tache">✅ Ajouter comme tâche</button>
      ${analyse.type !== "devoir" && analyse.date ? `<button class="btn-ghost" id="prop-rev">🧠 Ajouter aussi une révision la veille</button>` : ""}
    </div>
  `;
  el.classList.remove("hidden");

  const ajouterEvenement = (date, debutMin, titre, type) => {
    state.eventsPerso.push({
      id: uid(),
      titre,
      coursId: analyse.coursId,
      type,
      date,
      jour: parseISO(date).getDay(),
      debut: minEnHeure(debutMin),
      fin: minEnHeure(debutMin + 60),
      salle: "",
      hebdo: false
    });
  };

  if (creneau) {
    el.querySelector("#prop-cal").addEventListener("click", () => {
      ajouterEvenement(creneau.date, creneau.debut, analyse.texte, analyse.type === "devoir" ? "devoir" : analyse.type);
      if (analyse.type === "devoir") {
        state.devoirs.push({ id: uid(), titre: analyse.texte, coursId: analyse.coursId || "python", date: analyse.date, heure: analyse.heure || "23:59", type: "devoir", desc: "" });
      }
      sauvegarder();
      rendreTout();
      toast("Ajouté au calendrier 📅");
    });
  }
  el.querySelector("#prop-tache").addEventListener("click", () => {
    state.taches.unshift({
      id: uid(),
      texte: analyse.texte,
      date: analyse.date || iso(aujourdhui()),
      heure: analyse.heure || "18:00",
      fait: false,
      priorite: analyse.type === "devoir" ? "haute" : "moyenne",
      coursId: analyse.coursId
    });
    sauvegarder();
    rendreTout();
    toast("Tâche ajoutée ✅");
  });
  const btnRev = el.querySelector("#prop-rev");
  if (btnRev) {
    btnRev.addEventListener("click", () => {
      const veille = iso(addJours(parseISO(analyse.date), -1));
      const cr = trouverCreneau(veille, 60, 18 * 60);
      ajouterEvenement(cr.date, cr.debut, `Révision : ${analyse.texte}`, "revision");
      sauvegarder();
      rendreTout();
      toast(`Révision ajoutée le ${fmtDate(cr.date)} à ${minEnHeure(cr.debut)} 🧠`);
    });
  }
}

function rendreTaches() {
  const el = document.getElementById("liste-taches");
  const triees = [...state.taches].sort((a, b) => (a.fait - b.fait) || ((a.date || "") > (b.date || "") ? 1 : -1));
  el.innerHTML = triees.length === 0 ? `<p class="hint">Aucune tâche pour l'instant.</p>` : triees.map(t => {
    const c = coursParId(t.coursId);
    return `<li class="${t.fait ? "fait" : ""}">
      <input type="checkbox" data-tache="${t.id}" ${t.fait ? "checked" : ""}>
      <span class="texte">${c ? c.emoji + " " : ""}${t.texte}</span>
      <span class="badge-prio prio-${t.priorite}">${t.priorite}</span>
      <span class="badge-date">${t.date ? fmtDate(t.date) : ""}${t.heure ? " " + t.heure : ""}</span>
      <button class="btn-suppr" data-suppr-tache="${t.id}">🗑</button>
    </li>`;
  }).join("");
  el.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const t = state.taches.find(x => x.id === cb.dataset.tache);
      if (t) { t.fait = cb.checked; sauvegarder(); rendreTaches(); }
    });
  });
  el.querySelectorAll("[data-suppr-tache]").forEach(b => {
    b.addEventListener("click", () => {
      state.taches = state.taches.filter(x => x.id !== b.dataset.supprTache);
      sauvegarder();
      rendreTaches();
    });
  });
}

function rendreDeadlines() {
  const el = document.getElementById("liste-deadlines");
  const auj = iso(aujourdhui());
  const aVenir = [...state.devoirs].filter(d => d.date >= auj).sort((a, b) => (a.date > b.date ? 1 : -1));
  el.innerHTML = aVenir.length === 0 ? `<p class="hint">Aucune deadline à venir 🎉</p>` : aVenir.map(d => {
    const c = coursParId(d.coursId);
    const reste = ecartEnJours(d.date, auj);
    const nomCours = d.coursNom || (c ? c.nom : "?");
    return `<li>
      <span class="texte">⚠️ ${d.titre} (${c ? c.emoji + " " : ""}${nomCours})
        ${d.lien ? `<a href="${d.lien}" target="_blank" rel="noopener" title="Ouvrir la source">🔗</a>` : ""}</span>
      <span class="badge-date">${fmtDate(d.date)} à ${d.heure} — ${reste <= 0 ? "aujourd'hui" : reste === 1 ? "demain" : "dans " + reste + " j"}</span>
      <button class="btn-suppr" data-suppr-deadline="${d.id}">🗑</button>
    </li>`;
  }).join("");
  el.querySelectorAll("[data-suppr-deadline]").forEach(b => {
    b.addEventListener("click", () => {
      state.devoirs = state.devoirs.filter(x => x.id !== b.dataset.supprDeadline);
      sauvegarder();
      rendreTout();
    });
  });
}

function genererPlanAuto() {
  const auj = aujourdhui();
  let ajoutes = 0;
  for (const dv of state.devoirs) {
    const d = parseISO(dv.date);
    if (d < auj) continue;
    for (const dj of [3, 1]) {
      const tag = `auto-${dv.id}-${dj}`;
      if (state.eventsPerso.some(e => e.tag === tag)) continue;
      const dateRev = iso(addJours(d, -dj));
      const creneau = trouverCreneau(dateRev, 60, 18 * 60);
      state.eventsPerso.push({
        id: uid(),
        tag,
        titre: `Révision : ${dv.titre}`,
        coursId: dv.coursId,
        type: "revision",
        date: creneau.date,
        jour: parseISO(creneau.date).getDay(),
        debut: minEnHeure(creneau.debut),
        fin: minEnHeure(creneau.fin),
        salle: "",
        hebdo: false
      });
      ajoutes++;
    }
  }
  sauvegarder();
  rendreTout();
  toast(ajoutes > 0 ? `${ajoutes} séance(s) de révision programmée(s) 🧠 (J-3 et J-1 avant chaque deadline)` : "Les séances de révision sont déjà en place ✅");
}

function promptPlanIA() {
  const auj = iso(aujourdhui());
  const lignesDevoirs = state.devoirs
    .filter(d => d.date >= auj)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map(d => `- [${coursParId(d.coursId) ? coursParId(d.coursId).nom : "?"}] ${d.titre} — ${fmtDateLongue(d.date)} à ${d.heure}`)
    .join("\n");
  const lignesTaches = state.taches.filter(t => !t.fait).map(t => `- ${t.texte}${t.date ? " (pour le " + fmtDate(t.date) + ")" : ""}`).join("\n");
  const faibles = [];
  for (const c of COURS_SEED) {
    const notes = state.notes[c.id] || [];
    const moyenne = notes.length ? notes.reduce((a, n) => a + n.note * n.coeff, 0) / notes.reduce((a, n) => a + n.coeff, 0) : null;
    if (moyenne !== null && moyenne < 12) faibles.push(`- ${c.nom} : moyenne ${moyenne.toFixed(1)}/20`);
  }
  return `Tu es un coach d'études pour un étudiant en 1ère année de bachelor ingénieur (IBE3, Mines Paris - PSL).

DEVOIRS / DEADLINES À VENIR :
${lignesDevoirs || "- aucun"}

TÂCHES EN ATTENTE :
${lignesTaches || "- aucune"}

COURS À RENFORCER (moyenne < 12/20) :
${faibles.length ? faibles.join("\n") : "- aucun"}

CONTRAINTES : cours du lundi au vendredi environ 8h-17h, natation mardi et jeudi de 20h à 21h. Le week-end est libre.

Donne-moi un plan de révision détaillé jour par jour jusqu'aux prochaines deadlines : pour chaque jour, des séances courtes (45-90 min) avec un objectif précis, en utilisant les créneaux libres (soir après 18h, week-end). Sois concis, actionnable, et motive-moi.`;
}

const MOODLE_REST = "https://moodle.psl.eu/webservice/rest/server.php";

async function appelMoodle(wsfunction, extra) {
  if (!state.moodleToken) throw new Error("Enregistre d'abord ton token Moodle.");
  const url = MOODLE_REST +
    "?wstoken=" + encodeURIComponent(state.moodleToken) +
    "&moodlewsrestformat=json&wsfunction=" + wsfunction + (extra || "");
  const r = await fetch(url);
  const data = await r.json();
  if (data && (data.exception || data.errorcode)) {
    throw new Error(data.message || data.errorcode || "Erreur Moodle");
  }
  return data;
}

function mapCoursMoodle(texte) {
  const t = (texte || "").toLowerCase();
  if (/math/.test(t)) return "maths";
  if (/physi/.test(t)) return "physique";
  if (/geoscience|géoscience|earth|outer envelopes|climate i\b/.test(t)) return "geosciences";
  if (/english|anglais|modern languages|langue/.test(t)) return "anglais";
  if (/computer|python|algorithm|freecad|informatique/.test(t)) return "python";
  if (/energy|énergie|ie3c|hydrogen|solar|climate change/.test(t)) return "energie";
  if (/sdg/.test(t)) return "projets";
  if (/working methods|méthode|methodes|responsible use of ai/.test(t)) return "methodes";
  return null;
}

function heureDepuisTimestamp(ts) {
  const d = new Date(ts * 1000);
  const m = d.getHours() * 60 + d.getMinutes();
  return { date: iso(d), heure: m === 0 ? "23:59" : minEnHeure(m), dateObj: d };
}

async function synchroniserMoodle() {
  const statut = document.getElementById("moodle-sync-status");
  const setStatut = (m) => { statut.textContent = m; };
  setStatut("Connexion à moodle.psl.eu...");
  try {
    const info = await appelMoodle("core_webservice_get_site_info");
    setStatut(`Connecté en tant que ${info.fullname} ✅ Récupération des cours...`);
    const courses = await appelMoodle("core_enrol_get_users_courses", "&userid=" + info.userid);
    const courseById = {};
    for (const c of courses) courseById[c.id] = c;
    const params = courses.map((c, i) => `&courseids[${i}]=${c.id}`).join("");

    const assignData = await appelMoodle("mod_assign_get_assignments", params);
    const nouveauxDevoirs = [];
    for (const c of (assignData.courses || [])) {
      const coursInfo = courseById[c.id] || {};
      for (const a of (c.assignments || [])) {
        if (!a.duedate) continue;
        const h = heureDepuisTimestamp(a.duedate);
        nouveauxDevoirs.push({
          id: "moodle-" + a.id,
          titre: a.name,
          coursId: mapCoursMoodle((coursInfo.fullname || "") + " " + (coursInfo.shortname || "")),
          coursNom: coursInfo.fullname || null,
          date: h.date,
          heure: h.heure,
          type: "devoir",
          desc: "Récupéré depuis Moodle — " + (coursInfo.fullname || c.id),
          lien: a.cmid ? "https://moodle.psl.eu/mod/assign/view.php?id=" + a.cmid : "https://moodle.psl.eu/course/view.php?id=" + c.id,
          duree: 3
        });
      }
    }
    state.devoirs = state.devoirs.filter(d => !String(d.id).startsWith("moodle-")).concat(nouveauxDevoirs);

    const now = Math.floor(Date.now() / 1000);
    const calParams = params + "&timesortfrom=" + (now - 7 * 86400) + "&timesortto=" + (now + 60 * 86400);
    let nbEvents = 0;
    try {
      const cal = await appelMoodle("core_calendar_get_action_events_by_courses", calParams);
      state.eventsMoodle = (cal.events || []).filter(e => e.timestart).map(e => {
        const d1 = heureDepuisTimestamp(e.timestart);
        const finTs = e.timeduration ? e.timestart + e.timeduration : e.timestart + 3600;
        const d2 = heureDepuisTimestamp(finTs);
        const coursInfo = courseById[e.courseid] || {};
        return {
          id: "moodle-ev-" + e.id,
          titre: e.name,
          coursId: mapCoursMoodle((coursInfo.fullname || "") + " " + (coursInfo.shortname || "")),
          type: "cours",
          date: d1.date,
          jour: d1.dateObj.getDay(),
          debut: d1.heure === "23:59" ? "09:00" : d1.heure,
          fin: d2.heure === "23:59" ? minEnHeure(heureEnMin(d1.heure === "23:59" ? "09:00" : d1.heure) + 60) : d2.heure,
          salle: "",
          hebdo: false
        };
      });
      nbEvents = state.eventsMoodle.length;
    } catch (e) {
      setStatut("Devoirs récupérés, mais le calendrier Moodle a renvoyé : " + e.message);
    }

    sauvegarder();
    rendreTout();
    setStatut(`Synchronisation terminée ✅ ${courses.length} cours, ${nouveauxDevoirs.length} devoirs, ${nbEvents} événements de calendrier ajoutés.`);
    toast("Moodle synchronisé 🔄");
  } catch (e) {
    setStatut("Échec : " + e.message + " — vérifie que le service web « Moodle mobile » est activé et que le token est valide. Astuce : si le navigateur bloque la requête (CORS), utilise l'import .ics ci-dessous.");
  }
}

function parserICS(texte) {
  const propre = texte.replace(/\r?\n[ \t]/g, "");
  const blocs = propre.split("BEGIN:VEVENT").slice(1);
  const liste = [];
  for (const b of blocs) {
    const get = (prop) => {
      const m = b.match(new RegExp("^" + prop + "[^:\\r\\n]*:([^\\r\\n]+)", "m"));
      return m ? m[1].trim().replace(/\\,/g, ",").replace(/\\n/g, " ") : null;
    };
    const dtstart = get("DTSTART");
    if (!dtstart) continue;
    const dtendBrut = get("DTEND");
    const dtend = dtendBrut || dtstart;
    const parseDt = (v) => {
      const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/);
      if (!m) return null;
      return { date: `${m[1]}-${m[2]}-${m[3]}`, heure: m[4] ? `${m[4]}:${m[5]}` : null };
    };
    const d1 = parseDt(dtstart);
    const d2 = parseDt(dtend);
    if (!d1) continue;
    const allDay = !d1.heure;
    const debut = allDay ? "09:00" : d1.heure;
    const fin = (!allDay && dtendBrut && d2 && d2.date === d1.date && d2.heure) ? d2.heure : minEnHeure(heureEnMin(debut) + 60);
    liste.push({
      id: uid(),
      titre: get("SUMMARY") || "Événement Moodle",
      coursId: mapCoursMoodle(get("SUMMARY") + " " + (get("DESCRIPTION") || "")),
      type: /devoir|à rendre|rendu|examen|contrôle|oral/i.test(get("SUMMARY") || "") ? "devoir" : "perso",
      date: d1.date,
      jour: parseISO(d1.date).getDay(),
      debut,
      fin,
      salle: get("LOCATION") || "",
      hebdo: false
    });
  }
  return liste;
}

function importerICS(texte) {
  const statut = document.getElementById("ics-status");
  try {
    const liste = parserICS(texte);
    if (liste.length === 0) { statut.textContent = "Aucun événement trouvé dans ce fichier."; return; }
    const existants = new Set(state.eventsPerso.map(e => e.titre + "|" + e.date + "|" + e.debut));
    let ajoutes = 0;
    for (const e of liste) {
      const cle = e.titre + "|" + e.date + "|" + e.debut;
      if (!existants.has(cle)) { state.eventsPerso.push(e); ajoutes++; }
    }
    sauvegarder();
    rendreTout();
    statut.textContent = `${ajoutes} événement(s) importé(s) ✅ (${liste.length - ajoutes} déjà présents)`;
    toast("Calendrier .ics importé 📥");
  } catch (e) {
    statut.textContent = "Erreur de lecture du fichier : " + e.message;
  }
}

async function recupererICSDepuisURL(url) {
  const statut = document.getElementById("ics-status");
  statut.textContent = "Téléchargement du calendrier...";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    importerICS(await r.text());
  } catch (e) {
    statut.textContent = "Impossible de récupérer l'URL directement (" + e.message + "). Télécharge le fichier .ics depuis Moodle et utilise « Importer un fichier .ics ».";
  }
}

function planifierSeances(dv) {
  const auj = aujourdhui();
  const dateLimite = parseISO(dv.date);
  const total = Math.max(30, Math.round((parseFloat(dv.duree) || 3) * 60));
  const joursDispo = Math.min(3, Math.max(1, Math.round((dateLimite - auj) / 86400000)));
  const parJour = Math.min(180, Math.ceil(total / joursDispo / 30) * 30);
  let reste = total;
  const seances = [];
  let d = new Date(auj);
  let i = 0;
  while (reste > 0 && d < dateLimite && i < joursDispo) {
    const duree = Math.min(reste, parJour);
    const cr = trouverCreneau(iso(d), duree, 17 * 60);
    seances.push({ date: cr.date, debut: cr.debut, fin: cr.fin, dureeMin: duree });
    reste -= duree;
    d = addJours(d, 1);
    i++;
  }
  if (seances.length === 0) {
    const cr = trouverCreneau(iso(auj), Math.min(total, 60), 18 * 60);
    seances.push({ date: cr.date, debut: cr.debut, fin: cr.fin, dureeMin: Math.min(total, 60) });
  }
  return seances;
}

function rendrePlanTravail() {
  const el = document.getElementById("plan-travail");
  if (!el) return;
  const liste = [...state.devoirs].sort((a, b) => (a.date > b.date ? 1 : -1));
  el.innerHTML = liste.length === 0 ? `<p class="hint">Aucun devoir pour l'instant.</p>` : liste.map(dv => {
    const c = coursParId(dv.coursId);
    const nomCours = dv.coursNom || (c ? c.nom : "Général");
    const seances = planifierSeances(dv);
    const deja = seances.every((s, i) => state.eventsPerso.some(e => e.tag === `travail-${dv.id}-${i}`));
    return `<div class="plan-devoir">
      <h4>⚠️ ${dv.titre} — ${c ? c.emoji + " " : ""}${nomCours}</h4>
      <p class="meta">Deadline : ${fmtDateLongue(dv.date)} à ${dv.heure} · Travail prévu : ${dv.duree || 3} h${dv.lien ? ` · <a href="${dv.lien}" target="_blank" rel="noopener">🔗 source</a>` : ""}</p>
      <ul>${seances.map(s => `<li>${fmtDate(s.date)} · ${minEnHeure(s.debut)}–${minEnHeure(s.fin)} (${Math.round(s.dureeMin / 60 * 10) / 10}h)</li>`).join("")}</ul>
      <button class="btn btn-petit" data-plan="${dv.id}" ${deja ? "disabled" : ""}>${deja ? "✅ déjà au calendrier" : "📅 Ajouter ces séances au calendrier"}</button>
    </div>`;
  }).join("");
  el.querySelectorAll("[data-plan]").forEach(b => {
    b.addEventListener("click", () => {
      const dv = state.devoirs.find(x => x.id === b.dataset.plan);
      if (!dv) return;
      planifierSeances(dv).forEach((s, i) => {
        const tag = `travail-${dv.id}-${i}`;
        if (state.eventsPerso.some(e => e.tag === tag)) return;
        state.eventsPerso.push({
          id: uid(),
          tag,
          titre: `Travail : ${dv.titre}`,
          coursId: dv.coursId,
          type: "revision",
          date: s.date,
          jour: parseISO(s.date).getDay(),
          debut: minEnHeure(s.debut),
          fin: minEnHeure(s.fin),
          salle: "",
          hebdo: false
        });
      });
      sauvegarder();
      rendreTout();
      toast("Séances de travail ajoutées au calendrier 🎯");
    });
  });
}

function rendreLiensRapides() {
  document.getElementById("liens-rapides").innerHTML = LIENS_RAPIDES
    .map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.emoji} ${l.label}</a>`).join("");
  const cartes = document.getElementById("liens-cartes");
  if (cartes) {
    cartes.innerHTML = LIENS_RAPIDES
      .map(l => `<a class="lien-carte" href="${l.url}" target="_blank" rel="noopener"><span class="emoji">${l.emoji}</span><span>${l.label}</span></a>`).join("");
  }
}

function rendreTout() {
  rendreCalendrier();
  rendreLegende();
  rendreListeCours();
  if (ui.coursId) rendreDetailCours();
  else document.getElementById("detail-cours").classList.add("hidden");
  rendreNotes();
  rendreTaches();
  rendreDeadlines();
  rendrePlanTravail();
}

function initialiser() {
  rendreLiensRapides();

  document.querySelectorAll("#nav-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#nav-tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".vue").forEach(v => v.classList.remove("active"));
      document.getElementById("vue-" + tab.dataset.vue).classList.add("active");
    });
  });

  document.getElementById("btn-semaine-prec").addEventListener("click", () => { decalageSemaine--; rendreCalendrier(); });
  document.getElementById("btn-semaine-suiv").addEventListener("click", () => { decalageSemaine++; rendreCalendrier(); });
  document.getElementById("btn-aujourdhui").addEventListener("click", () => { decalageSemaine = 0; rendreCalendrier(); });
  document.getElementById("btn-ajout-event").addEventListener("click", () => ouvrirModalEvenement());
  document.getElementById("btn-ajout-devoir").addEventListener("click", ouvrirModalDevoir);
  document.getElementById("btn-ajout-note").addEventListener("click", ouvrirModalNote);
  document.getElementById("btn-fermer-modal").addEventListener("click", fermerModal);
  document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") fermerModal();
  });

  document.getElementById("btn-analyser").addEventListener("click", () => {
    const t = document.getElementById("input-libre").value.trim();
    if (!t) { toast("Écris quelque chose à faire 😉"); return; }
    rendreProposition(analyserTexte(t));
  });
  document.getElementById("input-libre").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btn-analyser").click();
  });

  document.getElementById("btn-ajout-tache").addEventListener("click", () => {
    const t = document.getElementById("input-tache").value.trim();
    if (!t) { toast("Écris ta tâche"); return; }
    state.taches.unshift({
      id: uid(),
      texte: t,
      date: document.getElementById("input-tache-date").value || iso(aujourdhui()),
      heure: "18:00",
      fait: false,
      priorite: "moyenne",
      coursId: null
    });
    sauvegarder();
    document.getElementById("input-tache").value = "";
    rendreTaches();
    toast("Tâche ajoutée ✅");
  });

  document.getElementById("btn-plan-auto").addEventListener("click", genererPlanAuto);

  document.getElementById("btn-plan-ia").addEventListener("click", async () => {
    const prompt = promptPlanIA();
    try { await navigator.clipboard.writeText(prompt); } catch (e) { }
    window.open("https://chatgpt.com/?q=" + encodeURIComponent(prompt), "_blank", "noopener");
    toast("Plan demandé à ChatGPT 💚 (prompt aussi copié — colle-le dans Claude si tu préfères)");
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ibe3-hub-donnees.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Données exportées ⬇");
  });

  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("file-import").click();
  });
  document.getElementById("file-import").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.devoirs || !data.eventsPerso) throw new Error("format");
        state = data;
        sauvegarder();
        rendreTout();
        toast("Données importées ⬆");
      } catch (err) {
        toast("Fichier invalide ❌");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  });

  const champToken = document.getElementById("moodle-token");
  champToken.value = state.moodleToken || "";
  document.getElementById("btn-save-token").addEventListener("click", () => {
    state.moodleToken = champToken.value.trim();
    sauvegarder();
    toast(state.moodleToken ? "Token enregistré localement 💾 (révoquable à tout moment dans Moodle)" : "Token effacé");
  });
  document.getElementById("btn-test-moodle").addEventListener("click", async () => {
    const statut = document.getElementById("moodle-status");
    state.moodleToken = champToken.value.trim();
    sauvegarder();
    statut.textContent = "Test de connexion...";
    try {
      const info = await appelMoodle("core_webservice_get_site_info");
      statut.textContent = `✅ Connecté à Moodle en tant que ${info.fullname} (${info.sitename})`;
    } catch (e) {
      statut.textContent = "❌ " + e.message;
    }
  });
  document.getElementById("btn-sync-moodle").addEventListener("click", synchroniserMoodle);
  document.getElementById("btn-fetch-ics").addEventListener("click", () => {
    const url = document.getElementById("ics-url").value.trim();
    if (!url) { toast("Colle d'abord l'URL .ics de Moodle"); return; }
    recupererICSDepuisURL(url);
  });
  document.getElementById("btn-import-ics").addEventListener("click", () => {
    document.getElementById("file-ics").click();
  });
  document.getElementById("file-ics").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => importerICS(reader.result);
    reader.readAsText(f);
    e.target.value = "";
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Tout réinitialiser (événements, devoirs, notes, tâches) ?")) {
      try { localStorage.removeItem(CLE_STOCKAGE); } catch (e) { }
      location.reload();
    }
  });

  rendreTout();
}

document.addEventListener("DOMContentLoaded", initialiser);
