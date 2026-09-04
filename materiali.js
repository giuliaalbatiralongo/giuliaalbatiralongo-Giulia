import { getMateriali } from './db.js?v=6';
import { iconaPerMateria } from './materie.js?v=1';

function creaVoceMateriale(materiale) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'vignetta-breve';
  testo.textContent = materiale.titolo + (materiale.argomento ? ` — ${materiale.argomento}` : '');
  li.appendChild(testo);

  const link = document.createElement('a');
  link.href = materiale.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'link-cambia';
  link.textContent = 'Apri PDF ↗';
  li.appendChild(link);

  return li;
}

function creaGruppoMateria(nome, materialiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const header = document.createElement('div');
  header.className = 'gruppo-materia-header';

  const icona = iconaPerMateria(nome);
  const spanIcona = document.createElement('span');
  spanIcona.className = `materia-icona piccola ${icona.classe}`;
  spanIcona.textContent = icona.emoji;
  header.appendChild(spanIcona);

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  header.appendChild(h3);

  div.appendChild(header);

  const ul = document.createElement('ul');
  materialiMateria.forEach((m) => ul.appendChild(creaVoceMateriale(m)));
  div.appendChild(ul);

  return div;
}

async function mostraMateriali() {
  const statoEl = document.getElementById('stato-caricamento');
  const contenitoreEl = document.getElementById('materiali');

  try {
    const materiali = await getMateriali();

    if (materiali.length === 0) {
      statoEl.textContent = 'Nessun materiale ancora caricato. Usa "+ Carica materiale" per aggiungerne uno.';
      return;
    }

    statoEl.remove();

    const materieUniche = [...new Set(materiali.map((m) => m.materia))].sort();
    materieUniche.forEach((nome) => {
      const materialiMateria = materiali.filter((m) => m.materia === nome);
      contenitoreEl.appendChild(creaGruppoMateria(nome, materialiMateria));
    });
  } catch (errore) {
    statoEl.textContent = 'Errore nel caricamento: ' + errore.message;
    console.error(errore);
  }
}

mostraMateriali();
