/* Il giro guidato della prima volta.

   Chi apre Akesis la prima volta trova cinque sezioni e nessuna idea di
   cosa siano. Questo giro le attraversa una per una: si preme Avanti e
   Akesis apre da sola la pagina dopo, illuminando la cosa di cui sta
   parlando e lasciando in ombra il resto.

   Sta in un file suo perche' lo usano cinque pagine diverse, e perche'
   il passo in cui si e' arrivati deve sopravvivere al cambio di pagina:
   ogni Avanti e' una navigazione vera, non una diapositiva.

   Due memorie diverse, di proposito:
   - a che passo siamo: nel browser (`localStorage`), perche' e' roba di
     mezzo minuto e non ha senso scriverla nel database a ogni Avanti
   - se il giro e' gia' stato fatto: nel profilo (`giro_fatto`), perche'
     cambiare telefono non deve rifartelo vedere daccapo */

import { mieImpostazioni, salvaImpostazioni } from './db.js';

const CHIAVE_PASSO = 'akesis-giro-passo';

/* Ogni passo dice: su che pagina sta, cosa illuminare, e cosa dire.
   `dove` e' il primo selettore che si trova davvero: se una pagina
   cambia e il pezzo non c'e' piu', il fumetto si mette al centro invece
   di sparire o di puntare il vuoto. */
export const PASSI = [
  {
    pagina: 'index.html',
    dove: ['#oggi-corpo', '.apertura-frase'],
    titolo: 'La Home',
    testo: 'Qui vedi cosa ti tocca studiare oggi e cosa ti aspetta nei prossimi giorni. '
      + 'È il posto da cui partire ogni mattina: se non hai ancora organizzato niente, è vuota.',
  },
  {
    pagina: 'calendario.html',
    dove: ['#sessione-elenco', '.page-titolo'],
    titolo: 'Il Calendario',
    testo: 'Gli esami della sessione con tutti i loro appelli, piu tirocini, lezioni e scadenze. '
      + 'Quando scegli un appello, quello diventa la tua data e la ritrovi dappertutto.',
  },
  {
    pagina: 'esami.html',
    dove: ['#elenco', '.page-titolo'],
    titolo: 'Il Libretto',
    testo: 'Tutti gli esami del corso, anno per anno, con i voti di quelli che hai già dato '
      + 'e la media che si aggiorna da sola. Gli esami si scrivono qui una volta sola: '
      + 'poi li ritrovi nel calendario e nell\'organizzazione studio.',
  },
  {
    pagina: 'piano.html',
    dove: ['#oggi', '.page-titolo'],
    titolo: 'Organizzazione studio',
    testo: 'Qui decidi come studiare una materia: quanto materiale c\'è, quanto tempo hai, '
      + 'e in quante passate dividerlo. Akesis ti dice ogni giorno quante pagine fare.',
  },
  {
    pagina: 'piano.html',
    dove: ['#apri-nuovo'],
    titolo: 'Come si comincia',
    testo: 'Premi "Nuova materia" e compila i campi: che materia è, quanto materiale c\'è '
      + 'e quanto tempo hai. Al resto pensa Akesis.',
  },
  {
    pagina: 'materiali.html',
    dove: ['#contenuto-materiali', '.page-titolo'],
    titolo: 'Materiale',
    testo: 'Sbobine, dispense e appunti, divisi per categoria e per materia. '
      + 'Quello che carichi tu lo trovano anche gli altri: è la parte che si costruisce insieme.',
  },
];

export function passoSalvato() {
  try {
    /* Attenzione a `Number(localStorage.getItem(...))`: quando la chiave
       non c'e' il valore letto e' `null`, e `Number(null)` fa **zero**,
       che e' un passo validissimo. Scritto cosi', il giro credeva
       sempre di essere gia' cominciato dal primo passo, e l'offerta
       sulla Home non compariva mai. La stringa va guardata prima. */
    const grezzo = localStorage.getItem(CHIAVE_PASSO);
    if (grezzo === null || grezzo === '') return null;
    const n = Number(grezzo);
    return Number.isInteger(n) && n >= 0 && n < PASSI.length ? n : null;
  } catch (e) {
    return null;
  }
}

function ricordaPasso(n) {
  try { localStorage.setItem(CHIAVE_PASSO, String(n)); } catch (e) { /* pazienza */ }
}

function scordaPasso() {
  try { localStorage.removeItem(CHIAVE_PASSO); } catch (e) { /* pazienza */ }
}

/* Il nome del file della pagina aperta adesso, senza cartelle. */
function paginaQui() {
  const ultimo = location.pathname.split('/').pop();
  return ultimo || 'index.html';
}

function primoCheEsiste(selettori) {
  for (const s of selettori) {
    const e = document.querySelector(s);
    if (e) return e;
  }
  return null;
}

/* ---------- Il fumetto ---------- */

function togliFumetto() {
  document.querySelectorAll('.giro-velo, .giro-fumetto').forEach((e) => e.remove());
  document.body.classList.remove('giro-in-corso');
}

/* Il buco nel velo si fa con un'ombra enorme attorno al pezzo
   illuminato: e' l'unico modo che non richieda di ritagliare davvero
   niente, e regge lo scorrimento della pagina. */
function disegnaPasso(n, chiudi) {
  togliFumetto();
  const passo = PASSI[n];
  const bersaglio = primoCheEsiste(passo.dove);

  document.body.classList.add('giro-in-corso');

  const velo = document.createElement('div');
  velo.className = 'giro-velo';

  if (bersaglio) {
    bersaglio.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = bersaglio.getBoundingClientRect();
    const p = 8;
    velo.classList.add('con-buco');
    velo.style.top = `${r.top - p}px`;
    velo.style.left = `${r.left - p}px`;
    velo.style.width = `${r.width + p * 2}px`;
    velo.style.height = `${r.height + p * 2}px`;
  } else {
    // Il pezzo non c'e': velo pieno e fumetto al centro.
    velo.classList.add('pieno');
  }
  document.body.appendChild(velo);

  const fumetto = document.createElement('div');
  fumetto.className = 'giro-fumetto';
  fumetto.setAttribute('role', 'dialog');
  fumetto.setAttribute('aria-label', passo.titolo);

  const pallini = document.createElement('div');
  pallini.className = 'giro-pallini';
  PASSI.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'giro-pallino' + (i === n ? ' adesso' : '') + (i < n ? ' fatto' : '');
    pallini.appendChild(d);
  });
  fumetto.appendChild(pallini);

  const titolo = document.createElement('p');
  titolo.className = 'giro-titolo';
  titolo.textContent = passo.titolo;
  fumetto.appendChild(titolo);

  const testo = document.createElement('p');
  testo.className = 'giro-testo';
  testo.textContent = passo.testo;
  fumetto.appendChild(testo);

  const tasti = document.createElement('div');
  tasti.className = 'giro-tasti';

  const salta = document.createElement('button');
  salta.type = 'button';
  salta.className = 'btn btn-neutro btn-piccolo';
  salta.textContent = 'Salta';
  salta.addEventListener('click', () => chiudi());
  tasti.appendChild(salta);

  const avanti = document.createElement('button');
  avanti.type = 'button';
  avanti.className = 'btn btn-primario btn-piccolo';
  avanti.textContent = n === PASSI.length - 1 ? 'Ho capito' : 'Avanti';
  avanti.addEventListener('click', () => vaiAlProssimo(n, chiudi));
  tasti.appendChild(avanti);

  fumetto.appendChild(tasti);
  document.body.appendChild(fumetto);

  mettiAPosto(fumetto, bersaglio);
  avanti.focus();
}

/* Il fumetto vicino al pezzo illuminato, ma sempre dentro lo schermo:
   attaccato a un tasto in fondo a destra, meta' finirebbe fuori. */
function mettiAPosto(fumetto, bersaglio) {
  const f = fumetto.getBoundingClientRect();
  const margine = 12;

  if (!bersaglio) {
    fumetto.style.top = `${Math.max(margine, (window.innerHeight - f.height) / 2)}px`;
    fumetto.style.left = `${Math.max(margine, (window.innerWidth - f.width) / 2)}px`;
    return;
  }

  const r = bersaglio.getBoundingClientRect();
  // Sotto se ci sta, altrimenti sopra.
  let top = r.bottom + margine;
  if (top + f.height > window.innerHeight - margine) {
    top = r.top - f.height - margine;
  }
  top = Math.max(margine, Math.min(top, window.innerHeight - f.height - margine));

  let left = r.left;
  left = Math.max(margine, Math.min(left, window.innerWidth - f.width - margine));

  fumetto.style.top = `${top}px`;
  fumetto.style.left = `${left}px`;
}

function vaiAlProssimo(n, chiudi) {
  const prossimo = n + 1;
  if (prossimo >= PASSI.length) {
    chiudi();
    return;
  }
  ricordaPasso(prossimo);
  if (PASSI[prossimo].pagina === paginaQui()) {
    // Stessa pagina: nessuna navigazione, si sposta solo il fumetto.
    disegnaPasso(prossimo, chiudi);
    return;
  }
  location.href = PASSI[prossimo].pagina;
}

/* ---------- L'offerta, sulla Home ---------- */

function offriIlGiro(comincia, rifiuta) {
  const scatola = document.createElement('div');
  scatola.className = 'giro-offerta';

  const icona = document.createElement('i');
  icona.className = 'ph ph-hand-waving';
  icona.setAttribute('aria-hidden', 'true');
  scatola.appendChild(icona);

  const titolo = document.createElement('p');
  titolo.className = 'giro-offerta-titolo';
  titolo.textContent = 'Benvenuta in Akesis';
  scatola.appendChild(titolo);

  const testo = document.createElement('p');
  testo.className = 'giro-offerta-testo';
  testo.textContent =
    'Ti faccio vedere com\'è fatta? Sono cinque schermate, meno di un minuto. '
    + 'Puoi fermarti quando vuoi.';
  scatola.appendChild(testo);

  const tasti = document.createElement('div');
  tasti.className = 'giro-offerta-tasti';

  const no = document.createElement('button');
  no.type = 'button';
  no.className = 'btn btn-neutro';
  no.textContent = 'Guardo da sola';
  no.addEventListener('click', rifiuta);
  tasti.appendChild(no);

  const si = document.createElement('button');
  si.type = 'button';
  si.className = 'btn btn-primario';
  si.textContent = 'Sì, fammi vedere';
  si.addEventListener('click', comincia);
  tasti.appendChild(si);

  scatola.appendChild(tasti);
  return scatola;
}

/* ---------- L'attacco ----------

   Ogni pagina chiama questa, e questa decide da sola se c'e' qualcosa
   da fare: e' l'unico modo perche' cinque pagine diverse non debbano
   sapere niente del giro. */
export async function preparaGiro() {
  const chiudi = async () => {
    togliFumetto();
    scordaPasso();
    document.querySelectorAll('.giro-offerta').forEach((e) => e.remove());
    await salvaImpostazioni({ giro_fatto: true });
  };

  const inCorso = passoSalvato();

  if (inCorso !== null) {
    /* Un giro gia' cominciato. Si riprende solo se il passo e' di
       questa pagina: le altre non devono fare niente, nemmeno chiedere
       il profilo al database. */
    if (PASSI[inCorso].pagina === paginaQui()) {
      // Un istante perche' la pagina finisca di disegnarsi: il fumetto
      // deve puntare qualcosa che c'e' gia'.
      setTimeout(() => disegnaPasso(inCorso, chiudi), 350);
    }
    return;
  }

  // Nessun giro in corso: si offre, ma solo sulla Home e solo a chi non
  // l'ha gia' fatto. Il profilo si legge soltanto qui.
  if (paginaQui() !== 'index.html') return;

  const dove = document.getElementById('giro-offerta');
  if (!dove) return;

  const impostazioni = await mieImpostazioni();
  if (impostazioni.giro_fatto) return;

  dove.appendChild(offriIlGiro(
    () => {
      document.querySelectorAll('.giro-offerta').forEach((e) => e.remove());
      dove.hidden = true;
      ricordaPasso(0);
      disegnaPasso(0, chiudi);
    },
    chiudi
  ));
  dove.hidden = false;
}

/* Per rivedere la spiegazione quando si vuole, dal Profilo. */
export function rivediIlGiro() {
  ricordaPasso(0);
  location.href = PASSI[0].pagina;
}
