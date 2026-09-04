import { getCasiClinici } from './db.js?v=5';

const ETICHETTE_STATO = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

function creaVoceCaso(caso) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'vignetta-breve';
  testo.textContent = caso.vignetta;
  li.appendChild(testo);

  const pill = document.createElement('span');
  pill.className = `pill pill-${caso.stato}`;
  pill.textContent = ETICHETTE_STATO[caso.stato] || caso.stato;
  li.appendChild(pill);

  return li;
}

function creaGruppoMateria(nome, casiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  div.appendChild(h3);

  const ul = document.createElement('ul');
  casiMateria.forEach((caso) => ul.appendChild(creaVoceCaso(caso)));
  div.appendChild(ul);

  return div;
}

async function mostraCasi() {
  const statoEl = document.getElementById('stato-caricamento');
  const contenitoreEl = document.getElementById('casi');

  try {
    const casi = await getCasiClinici();

    if (casi.length === 0) {
      statoEl.textContent = 'Nessun caso trovato nel database. Aggiungine uno da "+ Aggiungi" per iniziare.';
      return;
    }

    statoEl.remove();

    const materieUniche = [...new Set(casi.map((c) => c.materia))].sort();
    materieUniche.forEach((nome) => {
      const casiMateria = casi.filter((c) => c.materia === nome);
      contenitoreEl.appendChild(creaGruppoMateria(nome, casiMateria));
    });
  } catch (errore) {
    statoEl.textContent = 'Errore nel caricamento: ' + errore.message;
    console.error(errore);
  }
}

mostraCasi();
