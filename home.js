import {
  getCasiClinici,
  getDomandeEsame,
  getMateriali,
  getCasiInAttesa,
  getMaterialiInAttesa,
  getRisposte,
  calcolaStatistiche,
  casiDaRipassareOggi,
  casiMaiVisti,
  getTempoStudio,
  sommaPerSezione,
  formattaDurata,
} from './db.js?v=16';
import { proteggiPagina } from './auth.js?v=9';

const elScheletro = document.getElementById('scheletro');
const elSezioni = document.getElementById('sezioni');
const elTessere = document.getElementById('tessere');
const elStato = document.getElementById('stato');
const elStatoRighe = document.getElementById('stato-righe');
const elStatoNota = document.getElementById('stato-nota');
const elTempo = document.getElementById('tempo');
const elTempoRighe = document.getElementById('tempo-righe');
const elTempoNota = document.getElementById('tempo-nota');
const elAttesa = document.getElementById('attesa');
const elAttesaElenco = document.getElementById('attesa-elenco');

function plurale(n, uno, molti) {
  return `${n} ${n === 1 ? uno : molti}`;
}

/* ---------- Tessere in cima: numero grande, etichetta piccola ---------- */

function creaTessera(tessera, posizione) {
  const el = document.createElement(tessera.indirizzo ? 'a' : 'div');
  el.className = 'tessera';
  if (tessera.indirizzo) el.href = tessera.indirizzo;

  // Le tessere entrano una dopo l'altra, non tutte insieme.
  el.style.setProperty('--ritardo', `${posizione * 40}ms`);

  const icona = document.createElement('span');
  icona.className = 'tessera-icona';
  const i = document.createElement('i');
  i.className = `ph ${tessera.icona}`;
  i.setAttribute('aria-hidden', 'true');
  icona.appendChild(i);
  el.appendChild(icona);

  const valore = document.createElement('p');
  valore.className = 'tessera-valore';
  valore.textContent = tessera.valore;
  el.appendChild(valore);

  const etichetta = document.createElement('p');
  etichetta.className = 'tessera-etichetta';
  etichetta.textContent = tessera.etichetta;
  el.appendChild(etichetta);

  return el;
}

/* ---------- Card delle sezioni ---------- */

function creaCardSezione(sezione) {
  const a = document.createElement('a');
  a.className = 'materia-card';
  a.href = sezione.indirizzo;

  const testata = document.createElement('div');
  testata.className = 'materia-testata';

  const badge = document.createElement('span');
  badge.className = 'materia-icona';
  const icona = document.createElement('i');
  icona.className = `ph ${sezione.icona}`;
  icona.setAttribute('aria-hidden', 'true');
  badge.appendChild(icona);
  testata.appendChild(badge);

  const testo = document.createElement('div');

  const titolo = document.createElement('div');
  titolo.className = 'materia-nome';
  titolo.textContent = sezione.nome;
  testo.appendChild(titolo);

  const conteggio = document.createElement('div');
  conteggio.className = 'materia-conteggio';
  conteggio.textContent = sezione.conteggio;
  testo.appendChild(conteggio);

  testata.appendChild(testo);
  a.appendChild(testata);

  const descrizione = document.createElement('p');
  descrizione.className = 'materia-descrizione';
  descrizione.textContent = sezione.descrizione;
  a.appendChild(descrizione);

  return a;
}

/* ---------- Colonna destra: avanzamento ---------- */

function creaRigaStato(etichetta, quanti, totale) {
  const riga = document.createElement('div');
  riga.className = 'stato-riga';

  const nome = document.createElement('span');
  nome.className = 'stato-riga-nome';
  nome.textContent = etichetta;
  riga.appendChild(nome);

  const barra = document.createElement('span');
  barra.className = 'stato-barra';
  const pieno = document.createElement('span');
  pieno.className = 'stato-barra-pieno';
  pieno.style.width = totale > 0 ? `${(quanti / totale) * 100}%` : '0%';
  barra.appendChild(pieno);
  riga.appendChild(barra);

  const valore = document.createElement('span');
  valore.className = 'stato-riga-valore';
  valore.textContent = quanti;
  riga.appendChild(valore);

  return riga;
}

function mostraStato(casi, statistiche) {
  if (casi.length === 0) return;

  const conta = { consolidato: 0, da_ripassare: 0, nuovo: 0 };
  casi.forEach((c) => {
    if (conta[c.stato] !== undefined) conta[c.stato] += 1;
  });

  elStatoRighe.appendChild(creaRigaStato('Consolidati', conta.consolidato, casi.length));
  elStatoRighe.appendChild(creaRigaStato('Da ripassare', conta.da_ripassare, casi.length));
  elStatoRighe.appendChild(creaRigaStato('Da vedere', conta.nuovo, casi.length));

  // Una riga di senso, non solo numeri: cosa conviene fare adesso.
  const scaduti = casiDaRipassareOggi(casi);

  if (scaduti.length > 0) {
    elStatoNota.textContent =
      scaduti.length === 1
        ? '1 caso e in scadenza oggi.'
        : `${scaduti.length} casi sono in scadenza oggi.`;
  } else if (conta.nuovo > 0) {
    elStatoNota.textContent = `Niente in scadenza. ${plurale(conta.nuovo, 'caso', 'casi')} ancora da vedere.`;
  } else if (statistiche.totale === 0) {
    elStatoNota.textContent = 'Non hai ancora risposto a nessun caso.';
  } else {
    elStatoNota.textContent = 'Niente in scadenza oggi. Il prossimo ripasso arrivera da solo.';
  }

  elStato.hidden = false;
}

/* ---------- Colonna destra: tempo di studio ---------- */

const NOMI_SEZIONE = {
  quiz: 'Quiz',
  domande: "Domande d'esame",
  materiali: 'Materiali',
};

function creaRigaTempo(sezione, secondi) {
  const riga = document.createElement('div');
  riga.className = 'tempo-riga';

  const nome = document.createElement('span');
  nome.className = 'tempo-riga-nome';
  nome.textContent = NOMI_SEZIONE[sezione] || sezione;
  riga.appendChild(nome);

  const valore = document.createElement('span');
  valore.className = 'tempo-riga-valore';
  valore.textContent = formattaDurata(secondi);
  riga.appendChild(valore);

  return riga;
}

function mostraTempo(righe) {
  const oggi = new Date().toISOString().slice(0, 10);
  const diOggi = righe.filter((r) => r.giorno === oggi);

  const totaliOggi = sommaPerSezione(diOggi);
  const sezioni = Object.keys(totaliOggi).filter((s) => totaliOggi[s] > 0);

  if (sezioni.length === 0) {
    elTempoRighe.innerHTML =
      '<p class="tempo-vuoto">Oggi non hai ancora studiato qui dentro.</p>';
  } else {
    sezioni
      .sort((a, b) => totaliOggi[b] - totaliOggi[a])
      .forEach((s) => elTempoRighe.appendChild(creaRigaTempo(s, totaliOggi[s])));
  }

  // Il totale della settimana da' la misura vera: una giornata storta
  // da sola non dice niente.
  const settimana = new Date();
  settimana.setDate(settimana.getDate() - 6);
  const limite = settimana.toISOString().slice(0, 10);

  const secondiSettimana = righe
    .filter((r) => r.giorno >= limite)
    .reduce((somma, r) => somma + r.secondi, 0);

  elTempoNota.textContent =
    secondiSettimana > 0
      ? `Negli ultimi sette giorni: ${formattaDurata(secondiSettimana)}.`
      : 'Il conteggio si ferma da solo quando lasci la pagina.';

  elTempo.hidden = false;
}

/* ---------- Colonna destra: coda di revisione ---------- */

function mostraAttesa(casiAttesa, materialiAttesa) {
  const voci = [
    ...casiAttesa.map((c) => ({ testo: c.domanda, tipo: 'Caso clinico' })),
    ...materialiAttesa.map((m) => ({ testo: m.titolo, tipo: 'Materiale' })),
  ];

  if (voci.length === 0) return;

  voci.slice(0, 4).forEach((voce) => {
    const li = document.createElement('li');

    const tipo = document.createElement('span');
    tipo.className = 'elenco-secco-tipo';
    tipo.textContent = voce.tipo;
    li.appendChild(tipo);

    const testo = document.createElement('span');
    testo.className = 'elenco-secco-testo';
    testo.textContent = voce.testo;
    li.appendChild(testo);

    elAttesaElenco.appendChild(li);
  });

  if (voci.length > 4) {
    const li = document.createElement('li');
    li.className = 'elenco-secco-resto';
    li.textContent = `e altre ${voci.length - 4}`;
    elAttesaElenco.appendChild(li);
  }

  elAttesa.hidden = false;
}

/* ---------- Avvio ---------- */

async function avvia(profilo) {
  try {
    const [casi, domande, materiali, risposte, tempo] = await Promise.all([
      getCasiClinici(),
      getDomandeEsame(),
      getMateriali(),
      getRisposte(),
      getTempoStudio(),
    ]);

    const statistiche = calcolaStatistiche(risposte);
    const consolidati = casi.filter((c) => c.stato === 'consolidato').length;
    const inScadenza = casiDaRipassareOggi(casi);
    const maiVisti = casiMaiVisti(casi);

    elTessere.innerHTML = '';
    [
      {
        valore: inScadenza.length || (maiVisti.length ? maiVisti.length : 0),
        etichetta: inScadenza.length
          ? 'Da ripassare oggi'
          : maiVisti.length
            ? 'Casi mai visti'
            : 'Nulla in scadenza',
        icona: 'ph-clock-counter-clockwise',
        indirizzo: 'sessione.html',
      },
      {
        valore: `${consolidati}/${casi.length}`,
        etichetta: 'Casi consolidati',
        icona: 'ph-check-circle',
        indirizzo: 'casi.html',
      },
      {
        valore: statistiche.accuratezza === null ? '0' : `${statistiche.accuratezza}%`,
        etichetta: statistiche.accuratezza === null ? 'Risposte date' : 'Risposte esatte',
        icona: 'ph-target',
        indirizzo: 'quiz.html',
      },
      {
        valore: domande.length,
        etichetta: "Domande d'esame",
        icona: 'ph-exam',
        indirizzo: 'domande.html',
      },
    ].forEach((t, i) => elTessere.appendChild(creaTessera(t, i)));

    const sezioni = [
      {
        nome: 'Quiz',
        indirizzo: 'quiz.html',
        icona: 'ph-cards',
        conteggio: plurale(casi.length, 'caso clinico', 'casi clinici'),
        descrizione:
          'Vignette con quattro risposte e la spiegazione. Chi risponde bene consolida il caso, chi sbaglia se lo ritrova davanti.',
      },
      {
        nome: 'Domande esami',
        indirizzo: 'domande.html',
        icona: 'ph-exam',
        conteggio: plurale(domande.length, 'domanda', 'domande'),
        descrizione:
          'Le domande che tornano agli orali, con quante volte sono state chieste e le note di chi le ha sostenute.',
      },
      {
        nome: 'Materiali',
        indirizzo: 'materiali.html',
        icona: 'ph-folder',
        conteggio: plurale(materiali.length, 'documento', 'documenti'),
        descrizione:
          'Sbobine, dispense, letteratura e appunti. Alcuni documenti sono protetti da una chiave di accesso.',
      },
    ];

    elScheletro.remove();
    sezioni.forEach((s) => elSezioni.appendChild(creaCardSezione(s)));
    elSezioni.hidden = false;

    mostraStato(casi, statistiche);
    mostraTempo(tempo);

    if (profilo.ruolo === 'admin') {
      const [casiAttesa, materialiAttesa] = await Promise.all([
        getCasiInAttesa(),
        getMaterialiInAttesa(),
      ]);
      mostraAttesa(casiAttesa, materialiAttesa);
    }
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia(profilo);
});
