import {
  getCasiClinici,
  getDomandeEsame,
  getMateriali,
  getCasiInAttesa,
  getMaterialiInAttesa,
} from './db.js?v=13';
import { proteggiPagina } from './auth.js?v=7';

const elScheletro = document.getElementById('scheletro');
const elSezioni = document.getElementById('sezioni');
const elStato = document.getElementById('stato');
const elStatoRighe = document.getElementById('stato-righe');
const elSaluto = document.getElementById('saluto');

function plurale(n, singolare, plurale_) {
  return `${n} ${n === 1 ? singolare : plurale_}`;
}

/* ---------- Le sezioni dell'app ---------- */

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

/* ---------- Riga di avanzamento ---------- */

function creaRigaStato(etichetta, quanti, totale) {
  const riga = document.createElement('div');
  riga.className = 'stato-riga';

  const nome = document.createElement('span');
  nome.className = 'stato-riga-nome';
  nome.textContent = etichetta;
  riga.appendChild(nome);

  // La barra dice a colpo d'occhio la proporzione, il numero la precisione.
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

function mostraStato(casi) {
  if (casi.length === 0) return;

  const conta = { consolidato: 0, da_ripassare: 0, nuovo: 0 };
  casi.forEach((c) => {
    if (conta[c.stato] !== undefined) conta[c.stato] += 1;
  });

  elStatoRighe.appendChild(creaRigaStato('Consolidati', conta.consolidato, casi.length));
  elStatoRighe.appendChild(creaRigaStato('Da ripassare', conta.da_ripassare, casi.length));
  elStatoRighe.appendChild(creaRigaStato('Ancora da vedere', conta.nuovo, casi.length));

  elStato.hidden = false;
}

/* ---------- Avvio ---------- */

async function avvia(profilo) {
  if (profilo.nome) elSaluto.textContent = `Bentornata, ${profilo.nome}`;

  try {
    const [casi, domande, materiali] = await Promise.all([
      getCasiClinici(),
      getDomandeEsame(),
      getMateriali(),
    ]);

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

    // La revisione compare solo a chi deve approvare, e solo se c'e'
    // qualcosa da guardare: una sezione vuota non serve a nessuno.
    if (profilo.ruolo === 'admin') {
      const [casiAttesa, materialiAttesa] = await Promise.all([
        getCasiInAttesa(),
        getMaterialiInAttesa(),
      ]);
      const quanti = casiAttesa.length + materialiAttesa.length;

      if (quanti > 0) {
        sezioni.push({
          nome: 'Revisione',
          indirizzo: 'revisione.html',
          icona: 'ph-seal-check',
          conteggio: plurale(quanti, 'proposta in attesa', 'proposte in attesa'),
          descrizione:
            'Casi e materiali proposti dagli studenti. Restano invisibili agli altri finche non li approvi.',
        });
      }
    }

    elScheletro.remove();
    sezioni.forEach((s) => elSezioni.appendChild(creaCardSezione(s)));
    elSezioni.hidden = false;

    mostraStato(casi);
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia(profilo);
});
