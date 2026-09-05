import { getCasiClinici } from './db.js?v=6';
import { iconaPerMateria } from './materie.js?v=3';

const ETICHETTE_STATO = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

function creaVoceCaso(caso) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'elenco-testo';
  testo.textContent = caso.vignetta;
  li.appendChild(testo);

  const stato = document.createElement('span');
  stato.className = `stato stato-${caso.stato}`;
  stato.textContent = ETICHETTE_STATO[caso.stato] || caso.stato;
  li.appendChild(stato);

  return li;
}

function creaGruppoArgomento(nome, casiArgomento) {
  const div = document.createElement('div');
  div.className = 'gruppo-argomento';

  const h4 = document.createElement('h4');
  h4.textContent = nome;
  div.appendChild(h4);

  const ul = document.createElement('ul');
  ul.className = 'elenco';
  casiArgomento.forEach((caso) => ul.appendChild(creaVoceCaso(caso)));
  div.appendChild(ul);

  return div;
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
    const casiArgomento = casiMateria.filter((c) => (c.argomento || 'Generale') === argomento);
    div.appendChild(creaGruppoArgomento(argomento, casiArgomento));
  });

  return div;
}

async function mostraCasi() {
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

mostraCasi();
