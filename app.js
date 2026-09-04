import { getCasiClinici } from './db.js?v=4';

async function mostraCasi() {
  const statoEl = document.getElementById('stato-caricamento');
  const listaEl = document.getElementById('casi');

  const casi = await getCasiClinici();

  if (casi.length === 0) {
    statoEl.textContent = 'Nessun caso trovato nel database. Aggiungine uno da Supabase per iniziare.';
    return;
  }

  statoEl.remove();

  casi.forEach((caso) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${caso.materia}</strong> — ${caso.vignetta} <em>(stato: ${caso.stato})</em>`;
    listaEl.appendChild(li);
  });
}

mostraCasi();
