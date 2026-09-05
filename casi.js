import { getCasiClinici } from './db.js?v=8';
import { iconaPerMateria } from './materie.js?v=3';
import { proteggiPagina } from './auth.js?v=2';

const ETICHETTE_STATO = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

function creaOpzioni(caso) {
  const ul = document.createElement('ul');
  ul.className = 'caso-opzioni';

  [
    { lettera: 'a', testo: caso.opzione_a },
    { lettera: 'b', testo: caso.opzione_b },
    { lettera: 'c', testo: caso.opzione_c },
    { lettera: 'd', testo: caso.opzione_d },
  ].forEach((opz) => {
    const li = document.createElement('li');
    if (opz.lettera === caso.risposta_corretta) li.className = 'giusta';

    const lettera = document.createElement('span');
    lettera.className = 'opzione-lettera';
    lettera.textContent = opz.lettera.toUpperCase();
    li.appendChild(lettera);
    li.appendChild(document.createTextNode(opz.testo));

    ul.appendChild(li);
  });

  return ul;
}

function creaCaso(caso) {
  const mai = caso.stato === 'nuovo';

  const dettagli = document.createElement('details');
  dettagli.className = 'caso-riga';

  const riepilogo = document.createElement('summary');

  const testo = document.createElement('span');
  testo.className = 'caso-riga-testo';
  testo.textContent = caso.vignetta;
  riepilogo.appendChild(testo);

  const lato = document.createElement('div');
  lato.className = 'caso-riga-lato';

  const stato = document.createElement('span');
  stato.className = `stato stato-${caso.stato}`;
  stato.textContent = ETICHETTE_STATO[caso.stato] || caso.stato;
  lato.appendChild(stato);

  const freccia = document.createElement('i');
  freccia.className = 'ph ph-caret-down caso-riga-freccia';
  freccia.setAttribute('aria-hidden', 'true');
  lato.appendChild(freccia);

  riepilogo.appendChild(lato);
  dettagli.appendChild(riepilogo);

  const contenitore = document.createElement('div');
  contenitore.className = 'caso-dettaglio' + (mai ? ' velato' : '');

  const contenuto = document.createElement('div');
  contenuto.className = 'caso-dettaglio-contenuto';

  const vignetta = document.createElement('p');
  vignetta.className = 'caso-dettaglio-testo';
  vignetta.textContent = caso.vignetta;
  contenuto.appendChild(vignetta);

  const domanda = document.createElement('p');
  domanda.className = 'caso-dettaglio-testo caso-dettaglio-domanda';
  domanda.textContent = caso.domanda;
  contenuto.appendChild(domanda);

  contenuto.appendChild(creaOpzioni(caso));

  const spiegazione = document.createElement('p');
  spiegazione.className = 'caso-spiegazione';
  spiegazione.textContent = caso.spiegazione;
  contenuto.appendChild(spiegazione);

  contenitore.appendChild(contenuto);

  if (mai) {
    const velo = document.createElement('div');
    velo.className = 'velo';

    const nota = document.createElement('p');
    nota.className = 'velo-nota';
    nota.textContent = 'Non hai ancora affrontato questo caso nel quiz.';
    velo.appendChild(nota);

    const bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.className = 'btn btn-neutro';
    bottone.innerHTML = '<i class="ph ph-eye" aria-hidden="true"></i> Mostra comunque';
    bottone.addEventListener('click', () => {
      contenitore.classList.remove('velato');
      velo.remove();
    });
    velo.appendChild(bottone);

    contenitore.appendChild(velo);
  }

  dettagli.appendChild(contenitore);
  return dettagli;
}

function creaGruppoMateria(nome, casiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const testata = document.createElement('div');
  testata.className = 'gruppo-materia-testata';

  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(nome)}`;
  icona.setAttribute('aria-hidden', 'true');
  testata.appendChild(icona);

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  testata.appendChild(h3);

  div.appendChild(testata);

  const argomenti = [...new Set(casiMateria.map((c) => c.argomento || 'Generale'))].sort();
  argomenti.forEach((argomento) => {
    const blocco = document.createElement('div');
    blocco.className = 'gruppo-argomento';

    const h4 = document.createElement('h4');
    h4.textContent = argomento;
    blocco.appendChild(h4);

    const contenitore = document.createElement('div');
    contenitore.className = 'elenco';
    casiMateria
      .filter((c) => (c.argomento || 'Generale') === argomento)
      .forEach((caso) => contenitore.appendChild(creaCaso(caso)));
    blocco.appendChild(contenitore);

    div.appendChild(blocco);
  });

  return div;
}

async function avvia() {
  const elScheletro = document.getElementById('scheletro');
  const contenitore = document.getElementById('casi');

  try {
    const casi = await getCasiClinici();

    if (casi.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-folder-open" aria-hidden="true"></i>
          <p>Non hai ancora nessun caso salvato.</p>
          <a class="btn" href="aggiungi.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi il primo caso</a>
        </div>
      `;
      return;
    }

    elScheletro.remove();

    const materie = [...new Set(casi.map((c) => c.materia))].sort();
    materie.forEach((nome) => {
      contenitore.appendChild(creaGruppoMateria(nome, casi.filter((c) => c.materia === nome)));
    });
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
