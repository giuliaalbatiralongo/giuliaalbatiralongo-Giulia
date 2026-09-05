import {
  getCasiClinici,
  getDomandeEsame,
  getMateriali,
  getCasiInAttesa,
  getMaterialiInAttesa,
  getDateEsame,
  getPiani,
  studioDiOggi,
  nomeUnita,
  giorniMancanti,
  nomeTipoData,
} from './db.js?v=25';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elSezioni = document.getElementById('sezioni');
const elSaluto = document.getElementById('saluto');
const elRaccolta = document.getElementById('raccolta');
const elStudioOggi = document.getElementById('studio-oggi');
const elStudioOggiElenco = document.getElementById('studio-oggi-elenco');
const elProssimeDate = document.getElementById('prossime-date');
const elProssimeElenco = document.getElementById('prossime-elenco');
const elAttesa = document.getElementById('attesa');
const elAttesaElenco = document.getElementById('attesa-elenco');

function plurale(n, uno, molti) {
  return `${n} ${n === 1 ? uno : molti}`;
}

function arrotonda(n) {
  return Math.ceil(n - 1e-9);
}

/* Il saluto cambia con l'ora. Non e' decorazione: aprire l'app alle
   sette di sera e leggere "buongiorno" fa sembrare che nessuno stia
   guardando. */
function saluto(nome) {
  const ora = new Date().getHours();
  const parte = ora < 13 ? 'Buongiorno' : ora < 19 ? 'Buon pomeriggio' : 'Buonasera';
  return nome ? `${parte}, ${nome}` : parte;
}

/* ---------- Cosa c'e' dentro ----------
   Una riga che conta quello che hai messo insieme, non quello che ti
   manca. Aprire l'app non deve essere un rimprovero. */

function scriviRaccolta(casi, domande, materiali, date) {
  const pezzi = [];
  if (materiali.length) pezzi.push(plurale(materiali.length, 'documento', 'documenti'));
  if (domande.length) pezzi.push(plurale(domande.length, "domanda d'esame", "domande d'esame"));
  if (casi.length) pezzi.push(plurale(casi.length, 'caso clinico', 'casi clinici'));
  if (date.length) pezzi.push(plurale(date.length, 'data segnata', 'date segnate'));

  if (pezzi.length === 0) {
    elRaccolta.textContent =
      'Non c e ancora niente dentro. Comincia da dove ti fa piu comodo: un documento, una data, una domanda.';
    return;
  }

  const ultimo = pezzi.pop();
  const elenco = pezzi.length ? `${pezzi.join(', ')} e ${ultimo}` : ultimo;
  elRaccolta.textContent = `Qui dentro ci sono ${elenco}. Tutto roba che ti sei costruita.`;
}

/* ---------- Le sezioni ---------- */

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

/* ---------- Colonna destra ---------- */

function mostraStudioDiOggi(piani) {
  const voci = studioDiOggi(piani);
  if (voci.length === 0) return;

  voci.forEach((voce) => {
    const riga = document.createElement('a');
    riga.className = 'oggi-riga';
    riga.href = 'piano.html';

    const quanto = document.createElement('span');
    quanto.className = 'oggi-quanto';
    quanto.textContent = voce.quantita === null ? '-' : arrotonda(voce.quantita);
    riga.appendChild(quanto);

    const testo = document.createElement('span');
    testo.className = 'oggi-testo';

    const materia = document.createElement('span');
    materia.className = 'oggi-materia';
    materia.textContent = voce.materia;
    testo.appendChild(materia);

    const dettaglio = document.createElement('span');
    dettaglio.className = 'oggi-dettaglio';
    const q = voce.quantita === null ? null : arrotonda(voce.quantita);
    dettaglio.textContent = q === null ? voce.fase : `${nomeUnita(voce.unita, q)} · ${voce.fase}`;
    testo.appendChild(dettaglio);

    riga.appendChild(testo);
    elStudioOggiElenco.appendChild(riga);
  });

  elStudioOggi.hidden = false;
}

function mostraProssimeDate(date) {
  const future = date.filter((d) => giorniMancanti(d.giorno) >= 0).slice(0, 3);
  if (future.length === 0) return;

  future.forEach((voce) => {
    const riga = document.createElement('a');
    riga.className = 'prossima';
    riga.href = 'calendario.html';

    const quando = document.createElement('span');
    quando.className = 'prossima-quando';
    const g = giorniMancanti(voce.giorno);
    quando.textContent = g === 0 ? 'oggi' : g;
    if (g > 0) quando.classList.add('numero');
    riga.appendChild(quando);

    const testo = document.createElement('span');
    testo.className = 'prossima-testo';

    const materia = document.createElement('span');
    materia.className = 'prossima-materia';
    materia.textContent = voce.materia || nomeTipoData(voce.tipo);
    testo.appendChild(materia);

    const meta = document.createElement('span');
    meta.className = 'prossima-meta';
    const data = new Date(voce.giorno + 'T00:00:00');
    meta.textContent = `${nomeTipoData(voce.tipo)} · ${data.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
    })}`;
    testo.appendChild(meta);

    riga.appendChild(testo);
    elProssimeElenco.appendChild(riga);
  });

  elProssimeDate.hidden = false;
}

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
  elSaluto.textContent = saluto(profilo.nome);

  try {
    const [casi, domande, materiali, date, piani] = await Promise.all([
      getCasiClinici(),
      getDomandeEsame(),
      getMateriali(),
      getDateEsame(),
      getPiani(),
    ]);

    scriviRaccolta(casi, domande, materiali, date);

    const sezioni = [
      {
        nome: 'Calendario',
        indirizzo: 'calendario.html',
        icona: 'ph-calendar-dots',
        conteggio: date.length ? plurale(date.length, 'data', 'date') : 'ancora vuoto',
        descrizione:
          'Appelli, esami, tirocini, lezioni e scadenze. Con quanti giorni mancano, e i colori per capirlo a colpo d occhio.',
      },
      {
        nome: 'Organizzazione studio',
        indirizzo: 'piano.html',
        icona: 'ph-path',
        conteggio: piani.length ? plurale(piani.length, 'materia', 'materie') : 'ancora vuoto',
        descrizione:
          'Quanto materiale c e, in quanto tempo, e in quante passate. Lui calcola quanto fare al giorno, e rifa il conto se cambi ritmo.',
      },
      {
        nome: 'Materiali',
        indirizzo: 'materiali.html',
        icona: 'ph-folder',
        conteggio: materiali.length ? plurale(materiali.length, 'documento', 'documenti') : 'ancora vuoto',
        descrizione:
          'Sbobine, dispense, letteratura e appunti, divisi per materia. Alcuni documenti si aprono solo con una chiave.',
      },
      {
        nome: 'Domande esami',
        indirizzo: 'domande.html',
        icona: 'ph-exam',
        conteggio: domande.length ? plurale(domande.length, 'domanda', 'domande') : 'ancora vuoto',
        descrizione:
          'Cosa hanno chiesto davvero i professori, con chi l ha chiesto e le note di chi c e passato. Ci si puo anche farsi interrogare.',
      },
      {
        nome: 'Quiz',
        indirizzo: 'quiz.html',
        icona: 'ph-cards',
        conteggio: casi.length ? plurale(casi.length, 'caso', 'casi') : 'ancora vuoto',
        descrizione:
          'Casi clinici per tenere la mente allenata quando hai un ritaglio di tempo, e capire se una cosa la sai davvero.',
      },
      {
        nome: 'Test SSM',
        indirizzo: 'ssm.html',
        icona: 'ph-target',
        conteggio: 'in preparazione',
        descrizione:
          'Le domande dei concorsi di specializzazione. La sezione resta chiusa finche non ci sono le domande.',
      },
    ];

    elScheletro.remove();
    sezioni.forEach((s) => elSezioni.appendChild(creaCardSezione(s)));
    elSezioni.hidden = false;

    mostraStudioDiOggi(piani);
    mostraProssimeDate(date);

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
