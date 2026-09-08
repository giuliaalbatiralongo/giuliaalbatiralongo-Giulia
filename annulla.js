/* La striscia "Annulla" che compare dopo una cancellazione.

   Il cestino e' la rete solida, ma andarci e' un giro: nella maggior
   parte dei casi uno se ne accorge subito, un secondo dopo il clic. Qui
   c'e' il tasto per rimettere le cose com'erano senza spostarsi.

   Sparisce da sola dopo qualche secondo. Non e' un avviso da leggere:
   se non ti serve, deve andarsene. */

import { annullaEliminazione } from './db.js?v=21901172';

const DURATA = 8000;
let striscia = null;
let timer = null;

function crea() {
  const box = document.createElement('div');
  box.className = 'annulla-striscia';
  box.setAttribute('role', 'status');
  box.hidden = true;

  const testo = document.createElement('span');
  testo.className = 'annulla-testo';
  box.appendChild(testo);

  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'annulla-tasto';
  tasto.textContent = 'Annulla';
  box.appendChild(tasto);

  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'annulla-chiudi';
  chiudi.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  chiudi.setAttribute('aria-label', 'Chiudi');
  chiudi.addEventListener('click', nascondi);
  box.appendChild(chiudi);

  document.body.appendChild(box);
  return { box, testo, tasto };
}

function nascondi() {
  if (!striscia) return;
  clearTimeout(timer);
  striscia.box.classList.remove('dentro');
  // Si aspetta che finisca di scivolare via, poi si toglie di mezzo:
  // `hidden` subito la farebbe sparire di scatto.
  setTimeout(() => { if (striscia) striscia.box.hidden = true; }, 200);
}

/* `cosa` e' quello che si e' buttato ("l'esame Farmacologia II"),
   `gesto` quello che torna da elimina*(), `poi` cosa rifare a schermo
   quando si annulla. */
export function offriAnnulla(cosa, gesto, poi) {
  if (!gesto) return;
  if (!striscia) striscia = crea();

  striscia.testo.textContent = `${cosa} e nel cestino.`;

  const tasto = striscia.tasto.cloneNode(true);
  striscia.tasto.replaceWith(tasto);
  striscia.tasto = tasto;

  tasto.addEventListener('click', async () => {
    tasto.disabled = true;
    tasto.textContent = 'Rimetto a posto...';
    const fatto = await annullaEliminazione(gesto);
    nascondi();
    if (fatto && poi) await poi();
  });

  striscia.box.hidden = false;
  // Un giro di orologio prima di aggiungere la classe, altrimenti il
  // browser non ha ancora disegnato l'elemento e non anima niente.
  requestAnimationFrame(() => striscia.box.classList.add('dentro'));

  clearTimeout(timer);
  timer = setTimeout(nascondi, DURATA);
}
