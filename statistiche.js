import {
  getCasiClinici,
  getRisposte,
  getTempoStudio,
  getMieiContributi,
  calcolaStatistiche,
  accuratezzaPerMateria,
  tempoPerGiorno,
  sommaPerSezione,
  formattaDurata,
  casiDaRipassareOggi,
} from './db.js?v=22';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elTutto = document.getElementById('statistiche');

const SEZIONI = [
  { chiave: 'quiz', nome: 'Quiz' },
  { chiave: 'domande', nome: "Domande d'esame" },
  { chiave: 'materiali', nome: 'Materiali' },
];

const GIORNI_GRAFICO = 14;

/* Un solo colore in tutta la pagina, come nel resto di Akesis. Per
   distinguere le sezioni non uso tre tinte ma tre grafici affiancati:
   ognuno ha una serie sola, quindi non serve nessuna legenda ne' una
   tavolozza da verificare. */

/* ---------- Pezzi riutilizzabili ---------- */

function tessera(valore, etichetta, icona, indirizzo) {
  const el = document.createElement(indirizzo ? 'a' : 'div');
  el.className = 'tessera';
  if (indirizzo) el.href = indirizzo;

  const badge = document.createElement('span');
  badge.className = 'tessera-icona';
  const i = document.createElement('i');
  i.className = `ph ${icona}`;
  i.setAttribute('aria-hidden', 'true');
  badge.appendChild(i);
  el.appendChild(badge);

  const v = document.createElement('p');
  v.className = 'tessera-valore';
  v.textContent = valore;
  el.appendChild(v);

  const e = document.createElement('p');
  e.className = 'tessera-etichetta';
  e.textContent = etichetta;
  el.appendChild(e);

  return el;
}

/* Barre verticali. Ogni barra e' raggiungibile da tastiera e dice il suo
   valore: senza, il grafico sarebbe leggibile solo a occhio. */
function graficoBarre(voci, massimo, descrizione, asse = 'ogni') {
  const blocco = document.createElement('div');

  const grafico = document.createElement('div');
  grafico.className = 'grafico-barre';
  grafico.setAttribute('role', 'img');
  grafico.setAttribute('aria-label', descrizione);

  voci.forEach((voce) => {
    const colonna = document.createElement('div');
    colonna.className = 'barra-colonna';
    colonna.tabIndex = 0;
    colonna.title = voce.titolo;
    colonna.setAttribute('aria-label', voce.titolo);

    const pista = document.createElement('span');
    pista.className = 'barra-pista';

    const piena = document.createElement('span');
    piena.className = 'barra-piena' + (voce.valore === 0 ? ' vuota' : '');
    // Le barre non nulle non scendono mai sotto i 2px: una barra
    // invisibile si confonde con un giorno senza dati.
    const altezza = massimo > 0 && voce.valore > 0
      ? Math.max((voce.valore / massimo) * 100, 3)
      : 0;
    piena.style.height = `${altezza}%`;
    pista.appendChild(piena);

    colonna.appendChild(pista);

    // Con quattordici colonne l'etichetta non ci sta: gli estremi vanno
    // su una riga a parte, sotto, dove hanno spazio per intero.
    if (asse === 'ogni') {
      const etichetta = document.createElement('span');
      etichetta.className = 'barra-etichetta';
      etichetta.textContent = voce.etichetta;
      colonna.appendChild(etichetta);
    }

    grafico.appendChild(colonna);
  });

  blocco.appendChild(grafico);

  if (asse === 'estremi') {
    const riga = document.createElement('div');
    riga.className = 'grafico-asse';

    const primo = document.createElement('span');
    primo.textContent = voci[0]?.etichetta || '';
    riga.appendChild(primo);

    const ultimo = document.createElement('span');
    ultimo.textContent = voci[voci.length - 1]?.etichetta || '';
    riga.appendChild(ultimo);

    blocco.appendChild(riga);
  }

  return blocco;
}

function barreOrizzontali(voci, descrizione) {
  const lista = document.createElement('div');
  lista.className = 'barre-orizzontali';
  lista.setAttribute('role', 'img');
  lista.setAttribute('aria-label', descrizione);

  voci.forEach((voce) => {
    const riga = document.createElement('div');
    riga.className = 'barra-riga';

    const nome = document.createElement('span');
    nome.className = 'barra-riga-nome';
    nome.textContent = voce.nome;
    riga.appendChild(nome);

    const pista = document.createElement('span');
    pista.className = 'barra-riga-pista';
    const piena = document.createElement('span');
    piena.className = 'barra-riga-piena';
    piena.style.width = `${voce.percentuale}%`;
    pista.appendChild(piena);
    riga.appendChild(pista);

    const valore = document.createElement('span');
    valore.className = 'barra-riga-valore';
    valore.textContent = voce.valore;
    riga.appendChild(valore);

    const dettaglio = document.createElement('span');
    dettaglio.className = 'barra-riga-dettaglio';
    dettaglio.textContent = voce.dettaglio || '';
    riga.appendChild(dettaglio);

    lista.appendChild(riga);
  });

  return lista;
}

function tabella(intestazioni, righe) {
  const testa = document.createElement('thead');
  const rigaTesta = document.createElement('tr');
  intestazioni.forEach((h, i) => {
    const th = document.createElement('th');
    th.textContent = h;
    if (i > 0) th.className = 'a-destra';
    rigaTesta.appendChild(th);
  });
  testa.appendChild(rigaTesta);

  const corpo = document.createElement('tbody');
  righe.forEach((r) => {
    const tr = document.createElement('tr');
    r.forEach((cella, i) => {
      const td = document.createElement('td');
      td.textContent = cella;
      if (i > 0) td.className = 'a-destra cifra';
      tr.appendChild(td);
    });
    corpo.appendChild(tr);
  });

  return [testa, corpo];
}

function scriviTabella(elemento, intestazioni, righe) {
  elemento.innerHTML = '';
  tabella(intestazioni, righe).forEach((parte) => elemento.appendChild(parte));
}

/* ---------- Tempo di studio ---------- */

function mostraTempo(tempo) {
  const perGiorno = tempoPerGiorno(tempo, GIORNI_GRAFICO);

  // Scala condivisa fra i tre grafici: altrimenti mezz'ora di materiali
  // sembrerebbe alta quanto tre ore di quiz.
  const massimo = Math.max(
    ...perGiorno.flatMap((g) => SEZIONI.map((s) => g[s.chiave])),
    1
  );

  const contenitore = document.getElementById('grafici-tempo');
  contenitore.innerHTML = '';

  SEZIONI.forEach((sezione) => {
    const blocco = document.createElement('div');
    blocco.className = 'piccolo-grafico';

    const titolo = document.createElement('p');
    titolo.className = 'piccolo-grafico-titolo';
    titolo.textContent = sezione.nome;
    blocco.appendChild(titolo);

    const totale = perGiorno.reduce((s, g) => s + g[sezione.chiave], 0);
    const somma = document.createElement('p');
    somma.className = 'piccolo-grafico-somma';
    somma.textContent = totale > 0 ? formattaDurata(totale) : 'niente';
    blocco.appendChild(somma);

    const voci = perGiorno.map((g, i) => ({
      valore: g[sezione.chiave],
      // Solo il primo e l'ultimo giorno hanno l'etichetta: quattordici
      // date di fila non si leggono.
      etichetta:
        i === 0 || i === perGiorno.length - 1
          ? g.data.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
          : '',
      titolo: `${g.data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}: ${
        g[sezione.chiave] > 0 ? formattaDurata(g[sezione.chiave]) : 'niente'
      }`,
    }));

    blocco.appendChild(
      graficoBarre(voci, massimo, `${sezione.nome}, ultimi ${GIORNI_GRAFICO} giorni`, 'estremi')
    );
    contenitore.appendChild(blocco);
  });

  document.getElementById('tempo-periodo').textContent = `Ultimi ${GIORNI_GRAFICO} giorni`;

  /* Tabella dei totali */
  const oggi = new Date().toISOString().slice(0, 10);
  const seiGiorniFa = new Date();
  seiGiorniFa.setDate(seiGiorniFa.getDate() - 6);
  const limiteSettimana = seiGiorniFa.toISOString().slice(0, 10);

  const totOggi = sommaPerSezione(tempo.filter((r) => r.giorno === oggi));
  const totSettimana = sommaPerSezione(tempo.filter((r) => r.giorno >= limiteSettimana));
  const totMese = sommaPerSezione(tempo);

  const righe = SEZIONI.map((s) => [
    s.nome,
    formattaDurata(totOggi[s.chiave] || 0),
    formattaDurata(totSettimana[s.chiave] || 0),
    formattaDurata(totMese[s.chiave] || 0),
  ]);

  const somma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  righe.push([
    'Tutto',
    formattaDurata(somma(totOggi)),
    formattaDurata(somma(totSettimana)),
    formattaDurata(somma(totMese)),
  ]);

  scriviTabella(
    document.getElementById('tabella-tempo'),
    ['Sezione', 'Oggi', '7 giorni', '30 giorni'],
    righe
  );

  return somma(totSettimana);
}

/* ---------- La scala dei ripassi ---------- */

const INTERVALLI = [1, 3, 7, 16, 35, 75];

function mostraScala(casi) {
  const conta = [0, 0, 0, 0, 0, 0, 0]; // indice 0 = mai visti
  casi.forEach((c) => {
    const p = c.prossimoRipasso ? c.passo || 0 : 0;
    conta[p] += 1;
  });

  const massimo = Math.max(...conta, 1);

  const voci = conta.map((valore, passo) => ({
    valore,
    etichetta: passo === 0 ? 'mai' : `${INTERVALLI[passo - 1]}g`,
    titolo:
      passo === 0
        ? `${valore} casi mai visti`
        : `${valore} casi al passo ${passo}, tornano ogni ${INTERVALLI[passo - 1]} giorni`,
  }));

  const contenitore = document.getElementById('grafico-scala');
  contenitore.innerHTML = '';
  contenitore.appendChild(
    graficoBarre(voci, massimo, 'Distribuzione dei casi sulla scala dei ripassi')
  );

  const consolidati = conta.slice(4).reduce((a, b) => a + b, 0);
  document.getElementById('nota-scala').textContent =
    conta[0] === casi.length
      ? 'Nessun caso ancora avviato. Comincia una sessione di quiz.'
      : `${consolidati} casi hanno superato le due settimane di intervallo. ` +
        `${conta[0]} non li hai ancora visti.`;
}

/* ---------- Ripassi in arrivo ---------- */

function mostraArrivo(casi) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const giorni = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(oggi);
    d.setDate(d.getDate() + i);
    giorni.push({ data: d, chiave: d.toISOString().slice(0, 10), quanti: 0 });
  }

  const scaduti = casiDaRipassareOggi(casi, Infinity).length;
  giorni[0].quanti = scaduti;

  casi.forEach((c) => {
    if (!c.prossimoRipasso || c.prossimoRipasso <= giorni[0].chiave) return;
    const voce = giorni.find((g) => g.chiave === c.prossimoRipasso);
    if (voce) voce.quanti += 1;
  });

  const massimo = Math.max(...giorni.map((g) => g.quanti), 1);

  const voci = giorni.map((g, i) => ({
    valore: g.quanti,
    etichetta: i === 0 ? 'oggi' : g.data.toLocaleDateString('it-IT', { weekday: 'narrow' }),
    titolo:
      i === 0
        ? `Oggi: ${g.quanti} casi`
        : `${g.data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}: ${g.quanti} casi`,
  }));

  const contenitore = document.getElementById('grafico-arrivo');
  contenitore.innerHTML = '';
  contenitore.appendChild(graficoBarre(voci, massimo, 'Casi in scadenza nei prossimi sette giorni'));

  const settimana = giorni.reduce((s, g) => s + g.quanti, 0);
  document.getElementById('nota-arrivo').textContent =
    settimana === 0
      ? 'Niente in programma questa settimana.'
      : `${settimana} ripassi in programma nei prossimi sette giorni.`;
}

/* ---------- Accuratezza per materia ---------- */

function mostraMaterie(risposte) {
  const per = accuratezzaPerMateria(risposte);
  const contenitore = document.getElementById('grafico-materie');
  const nota = document.getElementById('nota-materie');
  contenitore.innerHTML = '';

  if (per.length === 0) {
    contenitore.innerHTML =
      '<p class="blocco-vuoto">Servono almeno cinque risposte in una materia perche la percentuale voglia dire qualcosa.</p>';
    nota.textContent = '';
    return;
  }

  contenitore.appendChild(
    barreOrizzontali(
      per.map((m) => ({
        nome: m.materia,
        percentuale: m.accuratezza,
        valore: `${m.accuratezza}%`,
        dettaglio: `${m.corrette}/${m.totale}`,
      })),
      'Percentuale di risposte esatte per materia'
    )
  );

  nota.textContent =
    per.length === 1
      ? 'Le altre materie non hanno ancora abbastanza risposte.'
      : `La materia piu debole e ${per[0].materia}.`;
}

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    const [casi, risposte, tempo, contributi] = await Promise.all([
      getCasiClinici(),
      getRisposte(),
      getTempoStudio(30),
      getMieiContributi(),
    ]);

    const statistiche = calcolaStatistiche(risposte);
    const settimana = mostraTempo(tempo);

    const consolidati = casi.filter((c) => c.stato === 'consolidato').length;
    const inScadenza = casiDaRipassareOggi(casi, Infinity).length;

    const elTessere = document.getElementById('tessere');
    elTessere.innerHTML = '';
    [
      tessera(formattaDurata(settimana), 'Studio negli ultimi 7 giorni', 'ph-hourglass'),
      tessera(
        statistiche.accuratezza === null ? '0' : `${statistiche.accuratezza}%`,
        statistiche.accuratezza === null ? 'Risposte date' : 'Risposte esatte',
        'ph-target',
        'sessione.html'
      ),
      tessera(`${consolidati}/${casi.length}`, 'Casi consolidati', 'ph-check-circle', 'casi.html'),
      tessera(String(inScadenza), 'In scadenza oggi', 'ph-clock-counter-clockwise', 'sessione.html'),
    ].forEach((t) => elTessere.appendChild(t));

    mostraScala(casi);
    mostraArrivo(casi);
    mostraMaterie(risposte);

    scriviTabella(
      document.getElementById('tabella-contributi'),
      ['Cosa', 'Quanti'],
      [
        ['Casi clinici scritti', contributi.casi],
        ["Domande d'esame aggiunte", contributi.domande],
        ['Note sulle domande', contributi.note],
        ['Materiali caricati', contributi.materiali],
        ['Sessioni di quiz', statistiche.sessioni],
        ['Risposte date', statistiche.totale],
      ]
    );

    elScheletro.remove();
    elTutto.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
