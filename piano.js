import {
  getPiani,
  ultimoErroreDb,
  inserisciPiano,
  aggiornaPiano,
  aggiornaFatteFase,
  eliminaPiano,
  calcolaPiano,
  studioDiOggi,
  nomeUnita,
  proponiPassate,
  getDateEsame,
  getEsami,
  assicuraEsameDiMateria,
  titoloData,
  misureDi,
  giorniMancanti,
} from './db.js?v=39';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elPiani = document.getElementById('piani');
const elStriscia = document.getElementById('materie-striscia');
const elConto = document.getElementById('materie-conto');
const finestraMateria = document.getElementById('finestra-materia');
const elOggi = document.getElementById('oggi');
const elOggiElenco = document.getElementById('oggi-elenco');
const finestra = document.getElementById('finestra-piano');
const form = document.getElementById('form-piano');
const esito = document.getElementById('piano-esito');
const elRighe = document.getElementById('righe-fasi');

const NOMI_GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

let piani = [];
let date = [];
let esami = [];
// null quando si sta creando, il piano quando lo si sta correggendo.
let inModifica = null;
// La materia di cui e' aperto il dettaglio.
let materiaAperta = null;
// L'ultima divisione proposta, pronta da applicare.
let propostaCorrente = null;

function oggiIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${g}`;
}

function dataBreve(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

function arrotonda(n) {
  // Mezza pagina non esiste: si arrotonda per eccesso, altrimenti
  // seguendo il piano alla lettera si resta sempre un po' indietro.
  return Math.ceil(n - 1e-9);
}

/* ---------- Cosa tocca oggi ---------- */

function mostraOggi() {
  const voci = studioDiOggi(piani, oggiIso());
  elOggiElenco.innerHTML = '';

  if (voci.length === 0) {
    elOggi.hidden = piani.length === 0;
    if (piani.length > 0) {
      elOggiElenco.innerHTML =
        '<p class="blocco-vuoto">Oggi non e in programma niente. Puo essere un giorno libero, o una finestra non ancora cominciata.</p>';
    }
    return;
  }

  voci.forEach((voce) => {
    const riga = document.createElement('div');
    riga.className = 'oggi-riga';

    const q = voce.quantita === null ? null : arrotonda(voce.quantita);
    const perGiorni = q === null && voce.giornoDiFase !== null;

    const quanto = document.createElement('span');
    quanto.className = 'oggi-quanto';
    // Chi conta in giorni non ha una quantita': gli si dice a che punto
    // della passata e' arrivato.
    quanto.textContent = q !== null ? q : perGiorni ? `${voce.giornoDiFase}/${voce.giorniFase}` : '—';
    if (perGiorni) quanto.classList.add('piccolo');
    riga.appendChild(quanto);

    const testo = document.createElement('span');
    testo.className = 'oggi-testo';

    const materia = document.createElement('span');
    materia.className = 'oggi-materia';
    materia.textContent = voce.materia;
    testo.appendChild(materia);

    const dettaglio = document.createElement('span');
    dettaglio.className = 'oggi-dettaglio';
    dettaglio.textContent = q === null ? voce.fase : `${nomeUnita(voce.unita, q)} · ${voce.fase}`;
    testo.appendChild(dettaglio);

    riga.appendChild(testo);
    elOggiElenco.appendChild(riga);
  });

  elOggi.hidden = false;
}

/* ---------- La striscia delle materie ----------
   Una tessera per materia, stretta e verticale: si vede tutto in un
   colpo d'occhio e si scorre di lato quando sono tante. Il dettaglio,
   che e' la parte fitta di numeri, sta dentro la sua finestra. */

function fatteETotale(piano) {
  const fatte = (piano.fasi || []).reduce((s, f) => s + (f.fatte || 0), 0);
  const totale = (piano.fasi || []).reduce(
    (s, f) => s + (piano.unita === 'giorni' ? f.giorni : piano.quantita),
    0
  );
  return { fatte, totale };
}

/* La data dell'esame di questa materia, se c'e'. Prima si guarda fra
   gli esami della sessione (dove l'appello e' stato scelto), poi fra le
   date sciolte del calendario con lo stesso titolo. */
function dataEsameDi(piano) {
  const nome = (piano.materia || '').trim().toLowerCase();
  if (!nome) return null;

  const esame = esami.find((e) => e.nome.trim().toLowerCase() === nome);
  if (esame && esame.scelto) return esame.scelto.giorno;

  const voce = date
    .filter((d) => d.tipo === 'iscritta' || d.tipo === 'appello')
    .filter((d) => titoloData(d).trim().toLowerCase() === nome)
    .filter((d) => giorniMancanti(d.giorno) >= 0)
    .sort((a, b) => a.giorno.localeCompare(b.giorno))[0];

  return voce ? voce.giorno : null;
}

function dataLunga(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  });
}

/* Una tessera dice tre cose e basta: come si chiama, quando e' l'esame,
   e a che punto sei. Prima diceva "450 pagine" o "32 lezioni" o "9
   giorni" a seconda di come avevi contato quella materia, e le tessere
   non si somigliavano piu'. */
function creaTessera(piano) {
  const calcolo = calcolaPiano(piano, oggiIso());

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'materia-tessera';
  if (!calcolo.fattibile) card.classList.add('stretta');
  card.addEventListener('click', () => apriMateria(piano));

  const nome = document.createElement('span');
  nome.className = 'materia-tessera-nome';
  nome.textContent = piano.materia;
  card.appendChild(nome);

  const esame = document.createElement('span');
  esame.className = 'materia-tessera-esame';
  const giorno = dataEsameDi(piano);
  if (giorno) {
    const g = giorniMancanti(giorno);
    esame.textContent = `Esame ${dataLunga(giorno)}`;
    const manca = document.createElement('span');
    manca.className = 'materia-tessera-manca';
    manca.textContent = g === 0 ? 'oggi' : g === 1 ? 'domani' : `tra ${g} giorni`;
    esame.appendChild(manca);
  } else {
    esame.classList.add('senza');
    esame.textContent = '—';
  }
  card.appendChild(esame);

  const { fatte, totale } = fatteETotale(piano);

  const barra = document.createElement('span');
  barra.className = 'materia-tessera-barra';
  const pieno = document.createElement('span');
  pieno.style.width = totale > 0 ? `${Math.min((fatte / totale) * 100, 100)}%` : '0%';
  barra.appendChild(pieno);
  card.appendChild(barra);

  const piede = document.createElement('span');
  piede.className = 'materia-tessera-piede';
  piede.textContent = totale > 0 ? `${Math.round((fatte / totale) * 100)}% fatto` : 'da cominciare';
  card.appendChild(piede);

  return card;
}

/* ---------- Il dettaglio di una materia ----------
   Qui ci si arriva apposta, quindi qui stanno i numeri. Due cose che
   prima mancavano: le voci sono sempre le stesse tre (giorni, pagine,
   lezioni) con un trattino dove non si applicano, e si vede cosa hai
   gia' finito, non solo dove sei adesso. */

function rigaScheda(etichetta, valore) {
  const riga = document.createElement('div');
  riga.className = 'scheda-riga';

  const e = document.createElement('span');
  e.className = 'scheda-riga-etichetta';
  e.textContent = etichetta;
  riga.appendChild(e);

  const v = document.createElement('span');
  v.className = 'scheda-riga-valore';
  if (valore === null || valore === undefined || valore === '') {
    v.classList.add('senza');
    v.textContent = '—';
  } else {
    v.textContent = valore;
  }
  riga.appendChild(v);

  return riga;
}

/* Quanto materiale c'e', detto sempre con la stessa griglia. Le voci
   che non si applicano restano scritte, con un trattino: cosi' le
   materie si confrontano fra loro invece di avere ognuna la sua forma. */
function schedaMateria(piano, calcolo) {
  const box = document.createElement('div');
  box.className = 'scheda-materia';

  const giorno = dataEsameDi(piano);
  box.appendChild(rigaScheda('Esame', giorno ? dataLunga(giorno) : null));
  box.appendChild(rigaScheda('Giorni di studio', calcolo.giorniDisponibili));

  // Tutte e tre le misure, sempre scritte. Quella su cui si divide lo
  // studio porta un segno, cosi' si sa da dove esce il conto del giorno.
  misureDi(piano).forEach((m) => {
    const riga = rigaScheda(m.nome, m.quanto);
    if (m.quanto && m.chiave === piano.unita) {
      riga.classList.add('scheda-riga-scelta');
      const segno = document.createElement('span');
      segno.className = 'scheda-riga-segno';
      segno.textContent = 'divide lo studio';
      riga.querySelector('.scheda-riga-etichetta').appendChild(segno);
    }
    box.appendChild(riga);
  });


  return box;
}

/* Una passata: finita, in corso, o ancora da fare. L'unita' e' sempre
   scritta per esteso ("180 pagine su 450"): il vecchio "5/9" non
   diceva se erano giorni, pagine o volte. */
function rigaFase(piano, calcolo, fase) {
  const totale = piano.unita === 'giorni' ? fase.giorni : piano.quantita;
  const unita = piano.unita === 'giorni' ? 'giorni' : nomeUnita(piano.unita, totale);
  const finita = fase.fatte >= totale;
  const corrente = fase === calcolo.faseOggi;

  const riga = document.createElement('div');
  riga.className = 'passata' + (finita ? ' finita' : corrente ? ' corrente' : '');

  const segno = document.createElement('span');
  segno.className = 'passata-segno';
  segno.innerHTML = finita
    ? '<i class="ph-fill ph-check-circle" aria-hidden="true"></i>'
    : corrente
      ? '<i class="ph-fill ph-caret-circle-right" aria-hidden="true"></i>'
      : '<i class="ph ph-circle" aria-hidden="true"></i>';
  riga.appendChild(segno);

  const testo = document.createElement('div');
  testo.className = 'passata-testo';

  const nome = document.createElement('p');
  nome.className = 'passata-nome';
  nome.textContent = fase.nome;
  testo.appendChild(nome);

  const stato = document.createElement('p');
  stato.className = 'passata-stato';
  if (finita) {
    stato.textContent = `Fatta · ${totale} ${unita}`;
  } else if (fase.fatte > 0) {
    stato.textContent = `${fase.fatte} ${unita} su ${totale}`;
  } else {
    stato.textContent = `Da fare · ${totale} ${unita}`;
  }
  testo.appendChild(stato);

  // Cosa ripassare, se e' stato scritto: prima l'intervallo di pagine,
  // poi gli argomenti a mano.
  const cosa = [];
  if (fase.da_pagina && fase.a_pagina) cosa.push(`pagine ${fase.da_pagina}-${fase.a_pagina}`);
  if (fase.argomenti) cosa.push(fase.argomenti);

  if (cosa.length > 0) {
    const c = document.createElement('p');
    c.className = 'passata-cosa';
    c.textContent = cosa.join(' · ');
    testo.appendChild(c);
  }

  const quando = document.createElement('p');
  quando.className = 'passata-quando';
  const alGiorno =
    fase.alGiorno === null
      ? null
      : `${arrotonda(fase.alGiorno)} ${nomeUnita(piano.unita, arrotonda(fase.alGiorno))} al giorno`;
  quando.textContent = [
    fase.dal ? `${dataBreve(fase.dal)} - ${dataBreve(fase.al)}` : 'fuori dalla finestra',
    alGiorno,
  ]
    .filter(Boolean)
    .join(' · ');
  testo.appendChild(quando);

  riga.appendChild(testo);

  const barra = document.createElement('span');
  barra.className = 'passata-barra';
  const pieno = document.createElement('span');
  pieno.style.width = `${Math.min((fase.fatte / totale) * 100, 100)}%`;
  barra.appendChild(pieno);
  riga.appendChild(barra);

  const azioni = document.createElement('div');
  azioni.className = 'passata-azioni';

  const passo = fase.alGiorno === null ? 1 : Math.max(arrotonda(fase.alGiorno), 1);

  const meno = document.createElement('button');
  meno.type = 'button';
  meno.className = 'btn-piu';
  meno.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
  meno.setAttribute('aria-label', `Togli da ${fase.nome}`);
  meno.disabled = fase.fatte === 0;

  const piu = document.createElement('button');
  piu.type = 'button';
  piu.className = 'btn-piu';
  piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';
  piu.title = `Segna ${passo} ${nomeUnita(piano.unita, passo)} fatte`;
  piu.setAttribute('aria-label', `Segna una giornata di ${fase.nome}`);
  piu.disabled = fase.fatte >= totale;

  async function cambia(delta) {
    const nuovo = Math.min(Math.max(fase.fatte + delta, 0), totale);
    if (nuovo === fase.fatte) return;
    meno.disabled = true;
    piu.disabled = true;
    if (await aggiornaFatteFase(fase.id, nuovo)) {
      const vera = piano.fasi.find((f) => f.id === fase.id);
      if (vera) vera.fatte = nuovo;
      disegna();
      apriMateria(piano);
    } else {
      meno.disabled = false;
      piu.disabled = false;
    }
  }

  meno.addEventListener('click', () => cambia(-passo));
  piu.addEventListener('click', () => cambia(passo));

  azioni.append(meno, piu);
  riga.appendChild(azioni);

  return riga;
}

function apriMateria(piano) {
  if (!piano) return;
  materiaAperta = piano;
  const calcolo = calcolaPiano(piano, oggiIso());

  document.getElementById('materia-nome').textContent = piano.materia;

  const scheda = document.getElementById('materia-riassunto');
  scheda.innerHTML = '';
  scheda.appendChild(schedaMateria(piano, calcolo));

  const oggi = document.getElementById('materia-oggi');
  oggi.className = 'materia-oggi';
  oggi.innerHTML = '';

  if (!calcolo.fattibile) {
    oggi.classList.add('allarme');
    oggi.textContent =
      `Lo studio diviso cosi chiede ${calcolo.giorniRichiesti} giorni, ma nella finestra ce ne sono ` +
      `${calcolo.giorniDisponibili}. Accorcia una parte, allunga la finestra, o togli un giorno libero.`;
  } else if (calcolo.finito) {
    oggi.classList.add('spento');
    oggi.textContent = 'La finestra di questa materia e passata.';
  } else if (calcolo.faseOggi) {
    const q = calcolo.quantitaOggi === null ? null : arrotonda(calcolo.quantitaOggi);
    const t = document.createElement('p');
    t.className = 'materia-oggi-titolo';
    t.textContent = q === null ? calcolo.faseOggi.nome : `${q} ${nomeUnita(piano.unita, q)} oggi`;
    oggi.appendChild(t);

    const d = document.createElement('p');
    d.className = 'materia-oggi-quali';
    d.textContent = q === null ? 'Studia e basta.' : calcolo.faseOggi.nome;
    oggi.appendChild(d);
  } else if (calcolo.oggiELibero) {
    oggi.classList.add('spento');
    oggi.textContent = 'Oggi e uno dei giorni che ti sei lasciata libera.';
  } else {
    oggi.classList.add('spento');
    oggi.textContent = 'Oggi e fuori dalla finestra di questa materia.';
  }

  const elenco = document.getElementById('materia-fasi');
  elenco.innerHTML = '';
  elenco.className = 'passate-elenco';

  const titolo = document.createElement('p');
  titolo.className = 'passate-titolo';
  const fatte = calcolo.fasi.filter(
    (f) => f.fatte >= (piano.unita === 'giorni' ? f.giorni : piano.quantita)
  ).length;
  titolo.textContent = `${fatte} finite su ${calcolo.fasi.length}`;
  elenco.appendChild(titolo);

  calcolo.fasi.forEach((f) => elenco.appendChild(rigaFase(piano, calcolo, f)));

  const nota = document.getElementById('materia-nota');
  const esame = dataEsameDi(piano);
  if (esame && piano.fine > esame) {
    // La finestra di studio finisce dopo l'esame: non e' un errore, ma
    // e' quasi sempre una svista.
    nota.textContent =
      `L'esame e il ${dataLunga(esame)}, ma lo studio arriva fino al ${dataLunga(piano.fine)}. ` +
      'Se vuoi, accorcia la finestra fino al giorno dell esame.';
    nota.hidden = false;
  } else if (calcolo.fattibile && calcolo.avanzano > 0) {
    nota.textContent =
      calcolo.avanzano === 1
        ? 'Avanza un giorno prima della fine della finestra.'
        : `Avanzano ${calcolo.avanzano} giorni prima della fine della finestra.`;
    nota.hidden = false;
  } else {
    nota.hidden = true;
  }

  if (!finestraMateria.open) finestraMateria.showModal();
}

document.getElementById('chiudi-materia').addEventListener('click', () => finestraMateria.close());
document.getElementById('chiudi-materia-2').addEventListener('click', () => finestraMateria.close());
finestraMateria.addEventListener('click', (e) => {
  if (e.target === finestraMateria) finestraMateria.close();
});
finestraMateria.addEventListener('close', () => {
  // Se si sta passando alla finestra di modifica, la materia resta
  // segnata: ci si torna dopo aver salvato.
  if (!finestra.open) materiaAperta = null;
});

document.getElementById('modifica-materia').addEventListener('click', () => {
  const piano = materiaAperta;
  finestraMateria.close();
  apriFinestra(piano);
});

document.getElementById('elimina-materia').addEventListener('click', async () => {
  if (!materiaAperta) return;
  if (!window.confirm(`Eliminare l'organizzazione di ${materiaAperta.materia}?`)) return;

  const id = materiaAperta.id;
  if (await eliminaPiano(id)) {
    piani = piani.filter((p) => p.id !== id);
    finestraMateria.close();
    disegna();
  }
});

function disegna() {
  elStriscia.innerHTML = '';

  elConto.textContent =
    piani.length === 0 ? '' : `${piani.length} ${piani.length === 1 ? 'materia' : 'materie'}`;

  if (piani.length === 0) {
    elStriscia.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-path" aria-hidden="true"></i>
        <p>Nessuna materia organizzata. Comincia da quella che ti preoccupa di piu.</p>
      </div>
    `;
    mostraOggi();
    return;
  }

  piani.forEach((p) => elStriscia.appendChild(creaTessera(p)));
  mostraOggi();
}

/* ---------- Finestra ---------- */

function aggiungiRigaFase(preimpostata) {
  const riga = document.createElement('div');
  riga.className = 'riga-fase';
  // La riga si porta dietro l'id della passata gia' salvata e quanto e'
  // stato fatto, cosi' correggere il piano non azzera il lavoro.
  if (preimpostata?.id) riga.dataset.faseId = preimpostata.id;
  riga.dataset.fatte = preimpostata?.fatte ?? 0;

  const testa = document.createElement('div');
  testa.className = 'riga-fase-testa';

  const nome = document.createElement('input');
  nome.type = 'text';
  nome.placeholder = 'Es. Prima lettura';
  nome.required = true;
  nome.className = 'fase-nome-campo';
  nome.setAttribute('aria-label', 'Come si chiama questa parte dello studio');
  if (preimpostata?.nome) nome.value = preimpostata.nome;
  nome.addEventListener('input', aggiornaProposta);

  const giorni = document.createElement('input');
  giorni.type = 'number';
  giorni.min = '1';
  giorni.max = '365';
  giorni.required = true;
  giorni.placeholder = 'Giorni';
  giorni.className = 'fase-giorni-campo';
  giorni.setAttribute('aria-label', 'Quanti giorni');
  if (preimpostata?.giorni) giorni.value = preimpostata.giorni;
  giorni.addEventListener('input', aggiornaConto);

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'btn-piu';
  togli.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  togli.setAttribute('aria-label', 'Togli questa riga');
  togli.addEventListener('click', () => {
    riga.remove();
    if (!elRighe.querySelector('.riga-fase')) aggiungiRigaFase();
    aggiornaConto();
  });

  testa.append(nome, giorni, togli);
  riga.appendChild(testa);

  /* Cosa ripassare: facoltativo, e si apre solo se serve. Tenerlo
     sempre aperto raddoppiava l'altezza del modulo per un campo che
     spesso resta vuoto. */
  const dettagli = document.createElement('details');
  dettagli.className = 'fase-cosa';
  if (preimpostata?.argomenti || preimpostata?.da_pagina) dettagli.open = true;

  const riassunto = document.createElement('summary');
  riassunto.textContent = 'Cosa ripassare';
  dettagli.appendChild(riassunto);

  const dentro = document.createElement('div');
  dentro.className = 'fase-cosa-dentro';

  const da = document.createElement('input');
  da.type = 'number';
  da.min = '1';
  da.max = '20000';
  da.placeholder = 'Da pagina';
  da.className = 'fase-da';
  da.setAttribute('aria-label', 'Da pagina');
  if (preimpostata?.da_pagina) da.value = preimpostata.da_pagina;

  const a = document.createElement('input');
  a.type = 'number';
  a.min = '1';
  a.max = '20000';
  a.placeholder = 'A pagina';
  a.className = 'fase-a';
  a.setAttribute('aria-label', 'A pagina');
  if (preimpostata?.a_pagina) a.value = preimpostata.a_pagina;

  const argomenti = document.createElement('input');
  argomenti.type = 'text';
  argomenti.maxLength = 300;
  argomenti.placeholder = 'Oppure gli argomenti: capitoli 8-11, farmaci cardiovascolari';
  argomenti.className = 'fase-argomenti';
  argomenti.setAttribute('aria-label', 'Argomenti da ripassare');
  if (preimpostata?.argomenti) argomenti.value = preimpostata.argomenti;

  dentro.append(da, a, argomenti);
  dettagli.appendChild(dentro);
  riga.appendChild(dettagli);

  elRighe.appendChild(riga);
  aggiornaConto();
}

/* Quanti giorni di studio ci sono davvero nella finestra scelta, letti
   dal modulo mentre lo compili. Serve sia al conto sotto le passate sia
   alla proposta di come dividerle. */
function giorniDisponibiliNelModulo() {
  const liberi = [...document.querySelectorAll('#giorni-liberi input:checked')].length;
  const modo = form.querySelector('input[name="modo"]:checked')?.value;

  let giorni = null;
  if (modo === 'durata') {
    giorni = Number(document.getElementById('piano-durata').value) || 0;
  } else {
    const data = document.getElementById('piano-data').value;
    if (data) {
      giorni = Math.max(
        Math.round(
          (new Date(data + 'T00:00:00') - new Date(oggiIso() + 'T00:00:00')) / 86400000
        ),
        0
      );
    }
  }

  if (giorni === null) return null;
  return Math.round(giorni * ((7 - liberi) / 7));
}

function passateNelModulo() {
  return [...elRighe.querySelectorAll('.riga-fase')].map((riga) => ({
    nome: riga.querySelector('.fase-nome-campo').value.trim(),
    giorni: Number(riga.querySelector('.fase-giorni-campo').value) || 0,
  }));
}

/* La proposta si mostra solo se dice qualcosa di diverso da quello che
   c'e' gia' scritto: un banner che ripete il modulo e' solo rumore. */
function aggiornaProposta() {
  const box = document.getElementById('proposta');
  const disponibili = giorniDisponibiliNelModulo();

  if (!disponibili || disponibili < 2) {
    box.hidden = true;
    return;
  }

  const proposta = proponiPassate(disponibili);
  propostaCorrente = proposta;

  const adesso = passateNelModulo();
  const uguali =
    adesso.length === proposta.length &&
    adesso.every((f, i) => f.nome === proposta[i].nome && f.giorni === proposta[i].giorni);

  if (uguali) {
    box.hidden = true;
    return;
  }

  document.getElementById('proposta-titolo').textContent =
    `Con ${disponibili} giorni di studio potresti dividere cosi`;
  document.getElementById('proposta-righe').textContent = proposta
    .map((f) => `${f.nome} ${f.giorni}`)
    .join(' · ');

  box.hidden = false;
}

function applicaProposta() {
  if (!propostaCorrente) return;
  elRighe.innerHTML = '';
  propostaCorrente.forEach((f) => aggiungiRigaFase(f));
  aggiornaProposta();
}

/* Dice subito se le passate stanno nella finestra, mentre si scrive:
   scoprirlo dopo aver salvato sarebbe inutile. */
function aggiornaConto() {
  const chiesti = passateNelModulo().reduce((s, f) => s + f.giorni, 0);
  const el = document.getElementById('conto-fasi');
  const disponibili = giorniDisponibiliNelModulo();

  if (disponibili === null) {
    el.textContent = `In tutto chiedono ${chiesti} giorni.`;
    el.className = 'conto-fasi';
  } else {
    el.textContent = `In tutto chiedono ${chiesti} giorni di studio, nella finestra ce ne sono circa ${disponibili}.`;
    el.className = 'conto-fasi' + (chiesti > disponibili ? ' stretto' : '');
  }

  aggiornaProposta();
}

const NOMI_MISURA = { pagine: 'Pagine', lezioni: 'Lezioni', giorni: 'Giorni' };

/* Il menu offre solo le misure che hai davvero scritto: proporre
   "lezioni" quando le lezioni non ci sono porta solo a un errore dopo. */
function aggiornaMenuUnita() {
  const menu = document.getElementById('piano-unita');
  const prima = menu.value;

  const scritte = [
    ['pagine', document.getElementById('piano-pagine').value],
    ['lezioni', document.getElementById('piano-lezioni').value],
    ['giorni', document.getElementById('piano-giorni-materiale').value],
  ].filter(([, v]) => v.trim() !== '');

  menu.innerHTML = '';

  if (scritte.length === 0) {
    const vuota = document.createElement('option');
    vuota.value = '';
    vuota.textContent = 'Prima scrivi almeno una misura';
    menu.appendChild(vuota);
    menu.disabled = true;
  } else {
    menu.disabled = false;
    scritte.forEach(([chiave]) => {
      const o = document.createElement('option');
      o.value = chiave;
      o.textContent = NOMI_MISURA[chiave];
      menu.appendChild(o);
    });
    menu.value = scritte.some(([c]) => c === prima) ? prima : scritte[0][0];
  }

  document.getElementById('aiuto-unita').hidden = menu.value !== 'giorni';
  aggiornaConto();
}

function preparaFinestra() {
  const scelta = document.getElementById('giorni-liberi');
  scelta.innerHTML = '';

  NOMI_GIORNI.forEach((nome, i) => {
    const n = i + 1;
    const etichetta = document.createElement('label');
    etichetta.className = 'giorno-scelta';

    const casella = document.createElement('input');
    casella.type = 'checkbox';
    casella.name = 'liberi';
    casella.value = n;
    if (n === 7) casella.checked = true;
    casella.addEventListener('change', aggiornaConto);
    etichetta.appendChild(casella);

    const testo = document.createElement('span');
    testo.textContent = nome;
    etichetta.appendChild(testo);

    scelta.appendChild(etichetta);
  });

  /* Unita': l'etichetta e l'aiuto cambiano di conseguenza */
  // Si puo' dividere lo studio solo per una misura che hai scritto:
  // il menu si rifa' ogni volta che tocchi uno dei tre numeri.
  ['piano-pagine', 'piano-lezioni', 'piano-giorni-materiale'].forEach((id) => {
    document.getElementById(id).addEventListener('input', aggiornaMenuUnita);
  });

  /* Durata oppure data */
  form.querySelectorAll('input[name="modo"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const perData = radio.value === 'data' && radio.checked;
      document.getElementById('campo-durata').hidden = perData;
      document.getElementById('campo-data').hidden = !perData;
      aggiornaConto();
    });
  });

  document.getElementById('piano-durata').addEventListener('input', aggiornaConto);
  document.getElementById('piano-data').addEventListener('input', aggiornaConto);

  /* Scrivendo una materia che e' gia' in calendario, la data arriva
     sola: prima si guarda fra gli esami della sessione, poi fra le date
     sciolte, come fa la tessera. */
  document.getElementById('piano-materia').addEventListener('input', (e) => {
    const giorno = dataEsameDi({ materia: e.target.value });
    if (!giorno) return;
    const campo = document.getElementById('piano-data');
    if (!campo.value) campo.value = giorno;
    aggiornaConto();
  });
}

document.getElementById('aggiungi-fase').addEventListener('click', () => aggiungiRigaFase());
document.getElementById('usa-proposta').addEventListener('click', applicaProposta);

function scegliModo(quale) {
  form.querySelectorAll('input[name="modo"]').forEach((r) => {
    r.checked = r.value === quale;
  });
  document.getElementById('campo-durata').hidden = quale !== 'durata';
  document.getElementById('campo-data').hidden = quale !== 'data';
}

/* Una sola finestra per creare e per correggere: cambiano il titolo, il
   bottone e cosa c'e' scritto dentro. */
function apriFinestra(piano) {
  inModifica = piano || null;
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  elRighe.innerHTML = '';

  const titolo = document.getElementById('finestra-titolo-piano');
  const bottone = document.getElementById('piano-salva');

  if (piano) {
    titolo.textContent = piano.materia;
    bottone.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Salva le modifiche';

    document.getElementById('piano-materia').value = piano.materia;
    document.getElementById('piano-pagine').value = piano.pagine ?? '';
    document.getElementById('piano-lezioni').value = piano.lezioni ?? '';
    document.getElementById('piano-giorni-materiale').value = piano.giorni_materiale ?? '';
    aggiornaMenuUnita();
    document.getElementById('piano-unita').value = piano.unita;
    document.getElementById('aiuto-unita').hidden = piano.unita !== 'giorni';

    // Di una materia gia' avviata si mostra la data vera di fine: e' il
    // dato che lei riconosce. "Fra tot giorni" resta disponibile, ma li
    // conta da oggi e quindi fa ripartire la finestra.
    scegliModo('data');
    // Il campo si chiama "Giorno dell'esame": se il calendario ne ha
    // uno per questa materia, e' quello che va mostrato, non la fine
    // della finestra che potrebbe essere rimasta indietro.
    document.getElementById('piano-data').value = dataEsameDi(piano) || piano.fine;

    const liberi = piano.giorni_liberi || [];
    document.querySelectorAll('#giorni-liberi input').forEach((c) => {
      c.checked = liberi.includes(Number(c.value));
    });

    (piano.fasi || []).forEach((f) => aggiungiRigaFase(f));
    if (!elRighe.querySelector('.riga-fase')) aggiungiRigaFase();
  } else {
    titolo.textContent = 'Una materia';
    bottone.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Crea';

    // Prima la finestra e i giorni liberi, poi le passate: la proposta
    // si calcola su quei numeri, e generarla prima voleva dire proporre
    // subito qualcosa di diverso da quello che si era appena scritto.
    document.querySelectorAll('#giorni-liberi input').forEach((c) => {
      c.checked = Number(c.value) === 7;
    });
    aggiornaMenuUnita();
    scegliModo('durata');

    // Si parte gia' divisa: e' quasi sempre la divisione giusta, e resta
    // comunque modificabile riga per riga.
    const proposta = proponiPassate(giorniDisponibiliNelModulo() || 0);
    if (proposta.length > 0) proposta.forEach((f) => aggiungiRigaFase(f));
    else aggiungiRigaFase();
  }

  document.getElementById('nota-modifica').hidden = !piano;

  aggiornaConto();
  finestra.showModal();
}

document.getElementById('apri-nuovo').addEventListener('click', () => apriFinestra(null));

document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});
// Chiudere senza salvare non deve lasciare la finestra "agganciata" al
// piano di prima: la volta dopo si tornerebbe a correggere quello.
finestra.addEventListener('close', () => {
  inModifica = null;
  if (materiaAperta && !finestraMateria.open) {
    apriMateria(piani.find((p) => p.id === materiaAperta.id));
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await salvaMateria();
  } catch (errore) {
    esito.className = 'esito-form ko';
    esito.textContent = `Qualcosa e andato storto: ${errore.message}`;
    console.error(errore);
  }
});

async function salvaMateria() {
  const liberi = [...document.querySelectorAll('#giorni-liberi input:checked')].map((c) =>
    Number(c.value)
  );

  if (liberi.length === 7) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Se sono liberi tutti i giorni non resta niente su cui distribuire.';
    return;
  }

  const modo = form.querySelector('input[name="modo"]:checked').value;
  let fine;

  if (modo === 'durata') {
    const durata = Number(document.getElementById('piano-durata').value);
    if (!durata || durata < 2) {
      esito.className = 'esito-form ko';
      esito.textContent = 'Dai almeno due giorni.';
      return;
    }
    const d = new Date(oggiIso() + 'T00:00:00');
    d.setDate(d.getDate() + durata);
    fine = d.toISOString().slice(0, 10);
  } else {
    fine = document.getElementById('piano-data').value;
    if (!fine || fine <= oggiIso()) {
      esito.className = 'esito-form ko';
      esito.textContent = 'La data deve essere nel futuro.';
      return;
    }
  }

  const numero = (el) => (el && el.value.trim() ? Number(el.value) : null);

  const fasi = [...elRighe.querySelectorAll('.riga-fase')].map((riga) => ({
    id: riga.dataset.faseId ? Number(riga.dataset.faseId) : null,
    nome: riga.querySelector('.fase-nome-campo').value.trim(),
    giorni: Number(riga.querySelector('.fase-giorni-campo').value),
    fatte: Number(riga.dataset.fatte) || 0,
    da_pagina: numero(riga.querySelector('.fase-da')),
    a_pagina: numero(riga.querySelector('.fase-a')),
    argomenti: riga.querySelector('.fase-argomenti').value.trim() || null,
  }));

  const intervalloStorto = fasi.find(
    (f) => (f.da_pagina === null) !== (f.a_pagina === null) || (f.da_pagina && f.a_pagina < f.da_pagina)
  );
  if (intervalloStorto) {
    esito.className = 'esito-form ko';
    esito.textContent = `In "${intervalloStorto.nome || 'una delle righe'}" l'intervallo di pagine non torna: servono sia la prima sia l'ultima, e l'ultima non puo' venire prima.`;
    return;
  }

  if (fasi.some((f) => !f.nome || !f.giorni)) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Manca il nome o i giorni in una delle righe.';
    return;
  }

  const pagine = numero(document.getElementById('piano-pagine'));
  const lezioni = numero(document.getElementById('piano-lezioni'));
  const giorniMateriale = numero(document.getElementById('piano-giorni-materiale'));

  if (pagine === null && lezioni === null && giorniMateriale === null) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Scrivi almeno una misura: le pagine, le lezioni, o i giorni che ti prende.';
    return;
  }

  const unita = document.getElementById('piano-unita').value;
  const scelta = { pagine, lezioni, giorni: giorniMateriale }[unita];
  if (!scelta) {
    esito.className = 'esito-form ko';
    esito.textContent = `Hai scelto di dividere lo studio per ${unita}, ma quel numero non l'hai scritto.`;
    return;
  }

  const dati = {
    materia: document.getElementById('piano-materia').value.trim(),
    unita,
    pagine,
    lezioni,
    giorni_materiale: giorniMateriale,
    fine,
    giorni_liberi: liberi,
  };

  if (inModifica) {
    esito.className = 'esito-form attesa';
    esito.textContent = 'Salvataggio';

    // Con "fra tot giorni" la finestra riparte da oggi: i giorni te li
    // dai adesso, non a partire da quando avevi creato il piano.
    dati.inizio = modo === 'durata' ? oggiIso() : inModifica.inizio;

    const salvato = await aggiornaPiano(inModifica.id, dati, fasi);

    if (!salvato) {
      esito.className = 'esito-form ko';
      esito.textContent = `Non sono riuscita a salvare le modifiche. ${ultimoErroreDb() || ''}`.trim();
      return;
    }

    piani = piani.map((p) => (p.id === salvato.id ? salvato : p));
    piani.sort((a, b) => a.fine.localeCompare(b.fine));
    inModifica = null;

    await allineaEsame(dati.materia, modo === 'data' ? fine : null);

    finestra.close();
    disegna();
    // Si era arrivati qui dal dettaglio: ci si torna, aggiornato.
    if (materiaAperta) apriMateria(piani.find((p) => p.id === salvato.id));
    return;
  }

  esito.className = 'esito-form attesa';
  esito.textContent = 'Creazione';

  dati.inizio = oggiIso();
  const salvato = await inserisciPiano(dati, fasi);

  if (!salvato) {
    esito.className = 'esito-form ko';
    esito.textContent = `Non sono riuscita a creare la materia. ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  piani.push(salvato);
  piani.sort((a, b) => a.fine.localeCompare(b.fine));

  await allineaEsame(dati.materia, modo === 'data' ? fine : null);

  finestra.close();
  disegna();
}

/* Scritta la data d'esame mentre organizzi lo studio, quell'esame deve
   comparire anche nel calendario: sono la stessa cosa, e vederla in un
   posto solo e' il modo migliore per dimenticarsela nell'altro. */
async function allineaEsame(materia, giorno) {
  if (!giorno) return;

  esito.className = 'esito-form attesa';
  esito.textContent = 'Aggiorno il calendario';

  const { esito: come } = await assicuraEsameDiMateria(materia, giorno);

  if (come === 'errore') {
    console.error('Non sono riuscita ad allineare il calendario');
    return;
  }

  // Le date e gli esami vanno riletti, altrimenti la tessera continua a
  // dire che l'esame non c'e'.
  [date, esami] = await Promise.all([getDateEsame(), getEsami()]);
}

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    [piani, date, esami] = await Promise.all([getPiani(), getDateEsame(), getEsami()]);

    preparaFinestra();
    disegna();

    elScheletro.remove();
    elPiani.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
