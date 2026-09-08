import {
  getCasiInAttesa,
  getMaterialiInAttesa,
  getDateEsame,
  getPiani,
  studioDiOggi,
  calcolaPiano,
  nomeUnita,
  giorniMancanti,
  nomeTipoData,
  titoloData,
} from './db.js?v=12384483';
import { proteggiPagina } from './auth.js?v=18118483';
import { preparaGiro } from './giro.js';

const elScheletro = document.getElementById('scheletro');
const elGriglia = document.getElementById('griglia');
const elData = document.getElementById('oggi-data');
const elSaluto = document.getElementById('saluto');
const elOggiCorpo = document.getElementById('oggi-corpo');
const elTessere = document.getElementById('tessere-grandi');
const elScadenzeElenco = document.getElementById('scadenze-elenco');
const elMaterieElenco = document.getElementById('materie-elenco');
const elAttesa = document.getElementById('attesa');
const elAttesaElenco = document.getElementById('attesa-elenco');

function plurale(n, uno, molti) {
  return `${n} ${n === 1 ? uno : molti}`;
}

function arrotonda(n) {
  return Math.ceil(n - 1e-9);
}

function oggiIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${g}`;
}

/* Il saluto cambia con l'ora. Non e' decorazione: aprire l'app alle
   sette di sera e leggere "buongiorno" fa sembrare che nessuno stia
   guardando. */
function saluto(nome) {
  const ora = new Date().getHours();
  const parte = ora < 13 ? 'Buongiorno' : ora < 19 ? 'Buon pomeriggio' : 'Buonasera';
  return nome ? `${parte}, ${nome}` : parte;
}

function dataDiOggi() {
  const d = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/* ---------- Cosa studi oggi ----------
   E' la domanda che si fa aprendo l'app, quindi sta in cima e in
   grande. Ogni riga e' una cosa da fare oggi, con il numero davanti:
   quaranta pagine, tre lezioni. Il numero e' l'informazione, il resto e'
   contorno. */

function rigaOggi({ numero, unita, titolo, sotto, indirizzo, azione }) {
  const riga = document.createElement('a');
  riga.className = 'oggi-voce';
  riga.href = indirizzo;

  const cifra = document.createElement('span');
  cifra.className = 'oggi-voce-cifra';

  const n = document.createElement('strong');
  n.textContent = numero;
  cifra.appendChild(n);

  if (unita) {
    const u = document.createElement('span');
    u.textContent = unita;
    cifra.appendChild(u);
  }
  riga.appendChild(cifra);

  const testo = document.createElement('span');
  testo.className = 'oggi-voce-testo';

  const t = document.createElement('span');
  t.className = 'oggi-voce-titolo';
  t.textContent = titolo;
  testo.appendChild(t);

  const s = document.createElement('span');
  s.className = 'oggi-voce-sotto';
  s.textContent = sotto;
  testo.appendChild(s);

  riga.appendChild(testo);

  const fine = document.createElement('span');
  fine.className = 'oggi-voce-azione';
  fine.textContent = azione;
  riga.appendChild(fine);

  return riga;
}

function mostraOggi(piani, date) {
  const oggi = oggiIso();
  elOggiCorpo.innerHTML = '';
  let quante = 0;

  /* Prima le date di oggi: se l'esame e' stamattina, viene prima di
     qualunque programma di studio. */
  date
    .filter((d) => d.giorno === oggi)
    .forEach((d) => {
      elOggiCorpo.appendChild(
        rigaOggi({
          numero: 'Oggi',
          unita: null,
          titolo: titoloData(d),
          sotto: nomeTipoData(d.tipo),
          indirizzo: 'calendario.html',
          azione: 'Calendario',
        })
      );
      quante += 1;
    });

  studioDiOggi(piani, oggi).forEach((voce) => {
    const q = voce.quantita === null ? null : arrotonda(voce.quantita);
    // Chi conta in giorni non ha una quantita': gli si dice a che punto
    // della passata e' arrivato, che e' comunque un numero.
    const perGiorni = q === null && voce.giornoDiFase !== null;
    elOggiCorpo.appendChild(
      rigaOggi({
        numero: q !== null ? q : perGiorni ? voce.giornoDiFase : '—',
        unita: q !== null ? nomeUnita(voce.unita, q) : perGiorni ? `di ${voce.giorniFase}` : null,
        titolo: voce.materia,
        sotto: voce.fase,
        indirizzo: 'piano.html',
        azione: 'Segna',
      })
    );
    quante += 1;
  });

  if (quante > 0) return;

  /* Vuoto non vuol dire in colpa: si dice cosa manca per riempirlo. */
  const vuoto = document.createElement('div');
  vuoto.className = 'oggi-vuoto';

  const t = document.createElement('p');
  t.className = 'oggi-vuoto-titolo';
  const p = document.createElement('p');
  p.className = 'oggi-vuoto-testo';
  const a = document.createElement('a');
  a.className = 'btn';

  if (piani.length === 0) {
    t.textContent = 'Non hai ancora organizzato niente.';
    p.textContent =
      'Dimmi una materia, quanto materiale c\'è e quanto tempo hai: da domani trovi qui quante pagine fare, già divise.';
    a.href = 'piano.html';
    a.innerHTML = '<i class="ph ph-path" aria-hidden="true"></i> Organizza una materia';
  } else {
    t.textContent = 'Oggi sei libera.';
    p.textContent =
      'Nessuna delle tue materie cade oggi: o è un giorno che ti sei tenuta, o le finestre non sono ancora cominciate.';
    a.href = 'quiz.html';
    a.innerHTML = '<i class="ph ph-cards" aria-hidden="true"></i> Fai due quiz';
  }

  vuoto.append(t, p, a);
  elOggiCorpo.appendChild(vuoto);
}

/* ---------- Le due tessere ----------
   Solo le due cose che si aprono davvero mentre si studia: dov'e' il
   materiale e cosa hanno chiesto ai colleghi. Grandi, per prenderle al
   volo anche col pollice. */

function tesseraGrande(voce) {
  const a = document.createElement('a');
  a.className = 'tessera-grande';
  a.href = voce.indirizzo;

  const icona = document.createElement('span');
  icona.className = 'tessera-grande-icona';
  icona.innerHTML = `<i class="ph ${voce.icona}" aria-hidden="true"></i>`;
  a.appendChild(icona);

  const nome = document.createElement('span');
  nome.className = 'tessera-grande-nome';
  nome.textContent = voce.nome;
  a.appendChild(nome);

  return a;
}

/* Solo il nome e il collegamento: i conteggi e le descrizioni li ha
   tolti Giulia, facevano confusione senza aggiungere niente. */
function mostraTessere() {
  [
    { nome: 'Materiali', indirizzo: 'materiali.html', icona: 'ph-folder' },
    { nome: 'Domande esami', indirizzo: 'domande.html', icona: 'ph-exam' },
  ].forEach((v) => elTessere.appendChild(tesseraGrande(v)));
}

/* ---------- Le tue scadenze ---------- */

function mostraScadenze(date) {
  const future = date.filter((d) => giorniMancanti(d.giorno) >= 0).slice(0, 4);
  elScadenzeElenco.innerHTML = '';

  if (future.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-vuoto';
    vuoto.textContent =
      'Nessuna data segnata. Appelli, tirocini e consegne stanno nel calendario.';
    elScadenzeElenco.appendChild(vuoto);
    return;
  }

  future.forEach((voce) => {
    const riga = document.createElement('a');
    riga.className = 'scadenza';
    riga.href = 'calendario.html';

    const g = giorniMancanti(voce.giorno);

    const quando = document.createElement('span');
    quando.className = 'scadenza-quando';
    if (g === 0) {
      quando.textContent = 'oggi';
      quando.classList.add('adesso');
    } else if (g === 1) {
      quando.textContent = 'domani';
    } else {
      const n = document.createElement('strong');
      n.textContent = g;
      quando.appendChild(n);
      quando.append('giorni');
    }
    riga.appendChild(quando);

    const testo = document.createElement('span');
    testo.className = 'scadenza-testo';

    const nome = document.createElement('span');
    nome.className = 'scadenza-nome';
    nome.textContent = titoloData(voce);
    testo.appendChild(nome);

    const meta = document.createElement('span');
    meta.className = 'scadenza-meta';
    const data = new Date(voce.giorno + 'T00:00:00');
    meta.textContent = `${nomeTipoData(voce.tipo)} · ${data.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })}`;
    testo.appendChild(meta);

    riga.appendChild(testo);

    const filo = document.createElement('span');
    filo.className = 'scadenza-filo';
    filo.style.background = `var(--tipo-${voce.tipo})`;
    riga.appendChild(filo);

    elScadenzeElenco.appendChild(riga);
  });
}

/* ---------- Come ti sei organizzata ----------
   Non un voto: solo dove sta ogni materia dentro la sua finestra. */

function mostraMaterie(piani) {
  elMaterieElenco.innerHTML = '';

  if (piani.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-vuoto';
    vuoto.textContent =
      'Nessuna materia organizzata. Si parte da quanto materiale c\'è e quanto tempo hai.';
    elMaterieElenco.appendChild(vuoto);
    return;
  }

  piani.slice(0, 4).forEach((piano) => {
    const calcolo = calcolaPiano(piano, oggiIso());

    const riga = document.createElement('a');
    riga.className = 'materia-riga';
    riga.href = 'piano.html';

    const testa = document.createElement('span');
    testa.className = 'materia-riga-testa';

    const nome = document.createElement('span');
    nome.className = 'materia-riga-nome';
    nome.textContent = piano.materia;
    testa.appendChild(nome);

    const quando = document.createElement('span');
    quando.className = 'materia-riga-quando';
    const restano = giorniMancanti(piano.fine);
    quando.textContent =
      restano < 0 ? 'finita' : restano === 0 ? 'ultimo giorno' : `${restano} g`;
    testa.appendChild(quando);

    riga.appendChild(testa);

    const barra = document.createElement('span');
    barra.className = 'materia-riga-barra';
    const fatte = (piano.fasi || []).reduce((s, f) => s + (f.fatte || 0), 0);
    const totale = (piano.fasi || []).reduce(
      (s, f) => s + (piano.unita === 'giorni' ? f.giorni : piano.quantita),
      0
    );
    const pieno = document.createElement('span');
    pieno.style.width = totale > 0 ? `${Math.min((fatte / totale) * 100, 100)}%` : '0%';
    barra.appendChild(pieno);
    riga.appendChild(barra);

    const meta = document.createElement('span');
    meta.className = 'materia-riga-meta';
    meta.textContent = calcolo.fattibile
      ? `${piano.quantita} ${nomeUnita(piano.unita, piano.quantita)}`
      : 'Lo studio diviso cosi non ci sta nella finestra';
    if (!calcolo.fattibile) meta.classList.add('stretta');
    riga.appendChild(meta);

    elMaterieElenco.appendChild(riga);
  });
}

/* ---------- Coda di revisione, solo per l'admin ---------- */

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
  elData.textContent = dataDiOggi();
  elSaluto.textContent = saluto(profilo.nome);

  try {
    const [date, piani] = await Promise.all([getDateEsame(), getPiani()]);

    mostraOggi(piani, date);
    mostraTessere();
    mostraScadenze(date);
    mostraMaterie(piani);

    elScheletro.remove();
    elGriglia.hidden = false;

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

// Il giro guidato della prima volta: decide da se' se c'e' da fare qualcosa.
preparaGiro();
