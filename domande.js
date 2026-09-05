import { getDomandeEsame, incrementaVolte, aggiornaNoteDomanda } from './db.js?v=9';
import { iconaPerMateria } from './materie.js?v=3';
import { proteggiPagina } from './auth.js?v=5';

function etichettaVolte(n) {
  return n === 1 ? 'chiesta 1 volta' : `chiesta ${n} volte`;
}

function creaCardDomanda(domanda) {
  const card = document.createElement('article');
  card.className = 'domanda-card';

  /* Testata: testo della domanda e contatore */
  const testata = document.createElement('div');
  testata.className = 'domanda-testata';

  const blocco = document.createElement('div');
  const testo = document.createElement('p');
  testo.className = 'domanda-testo';
  testo.textContent = domanda.domanda;
  blocco.appendChild(testo);

  if (domanda.argomento) {
    const argomento = document.createElement('p');
    argomento.className = 'domanda-argomento';
    argomento.textContent = domanda.argomento;
    blocco.appendChild(argomento);
  }
  testata.appendChild(blocco);

  const conteggio = document.createElement('div');
  conteggio.className = 'domanda-conteggio';

  const valore = document.createElement('span');
  valore.className = 'conteggio-valore';
  valore.textContent = etichettaVolte(domanda.volte);
  conteggio.appendChild(valore);

  const piu = document.createElement('button');
  piu.type = 'button';
  piu.className = 'btn-piu';
  piu.title = 'Segnala che è stata chiesta di nuovo';
  piu.setAttribute('aria-label', 'Segnala che è stata chiesta di nuovo');
  piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';

  let volte = domanda.volte;
  piu.addEventListener('click', async () => {
    piu.disabled = true;
    const ok = await incrementaVolte(domanda.id, volte);
    if (ok) {
      volte += 1;
      valore.textContent = etichettaVolte(volte);
    }
    piu.disabled = false;
  });
  conteggio.appendChild(piu);

  testata.appendChild(conteggio);
  card.appendChild(testata);

  /* Note: si salvano quando esci dal campo */
  const note = document.createElement('div');
  note.className = 'domanda-note';

  const etichetta = document.createElement('div');
  etichetta.className = 'domanda-note-etichetta';
  const testoEtichetta = document.createElement('span');
  testoEtichetta.textContent = 'Note';
  etichetta.appendChild(testoEtichetta);

  const salvata = document.createElement('span');
  salvata.className = 'nota-salvata';
  salvata.textContent = 'Salvato';
  etichetta.appendChild(salvata);
  note.appendChild(etichetta);

  const campo = document.createElement('textarea');
  campo.rows = 2;
  campo.placeholder = 'Cosa chiede di preciso, come rispondere, riferimenti';
  campo.value = domanda.note || '';
  note.appendChild(campo);

  let ultimoSalvato = campo.value;
  campo.addEventListener('blur', async () => {
    if (campo.value === ultimoSalvato) return;
    const ok = await aggiornaNoteDomanda(domanda.id, campo.value);
    if (ok) {
      ultimoSalvato = campo.value;
      salvata.classList.add('visibile');
      setTimeout(() => salvata.classList.remove('visibile'), 1600);
    }
  });

  card.appendChild(note);
  return card;
}

function creaGruppoMateria(nome, domandeMateria) {
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

  domandeMateria.forEach((d) => div.appendChild(creaCardDomanda(d)));

  return div;
}

async function avvia() {
  const elScheletro = document.getElementById('scheletro');
  const contenitore = document.getElementById('domande');

  try {
    const domande = await getDomandeEsame();

    if (domande.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-exam" aria-hidden="true"></i>
          <p>Nessuna domanda d'esame raccolta finora.</p>
          <a class="btn" href="aggiungi-domanda.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi la prima domanda</a>
        </div>
      `;
      return;
    }

    elScheletro.remove();

    const materie = [...new Set(domande.map((d) => d.materia))].sort();
    materie.forEach((nome) => {
      contenitore.appendChild(creaGruppoMateria(nome, domande.filter((d) => d.materia === nome)));
    });
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
