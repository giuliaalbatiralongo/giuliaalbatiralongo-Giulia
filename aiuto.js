/* Il pulsante "Aiuto", in basso a destra su ogni pagina.

   Serve a chi apre Akesis e non sa cosa deve fare -- e a chi il giro
   guidato l'ha saltato, o l'ha fatto un mese fa e non se lo ricorda
   piu'. Sta sempre nello stesso posto proprio perche' chi e' perso non
   deve mettersi a cercare anche l'aiuto.

   Non ha niente di particolare dentro, ed e' voluto: tre voci, e la
   prima e' rifare la spiegazione. Un aiuto pieno di roba e' un secondo
   posto in cui perdersi.

   Si attacca da `menu.js`, che gira su ogni pagina dopo l'accesso: cosi'
   non serve toccare venti file, e le pagine di accesso e conferma --
   dove un pulsante di aiuto non avrebbe senso -- non lo prendono. */

import { PASSI, rivediIlGiro } from './giro.js';

const CHIAVE_APERTO = 'akesis-aiuto-aperto';

function chiudiPannello() {
  document.querySelectorAll('.aiuto-pannello, .aiuto-fondo').forEach((e) => e.remove());
  const tasto = document.querySelector('.aiuto-tasto');
  if (tasto) tasto.setAttribute('aria-expanded', 'false');
}

/* Cosa c'e' in ogni sezione, senza rifare tutto il giro: sono gli
   stessi testi delle tappe, che cosi' non si scrivono due volte e non
   possono discordare. */
function elencoSezioni() {
  const box = document.createElement('div');
  box.className = 'aiuto-sezioni';

  // Una tappa per pagina: "Come si comincia" ripete Organizzazione studio.
  const viste = new Set();
  PASSI.forEach((passo) => {
    if (viste.has(passo.pagina)) return;
    viste.add(passo.pagina);

    const riga = document.createElement('a');
    riga.className = 'aiuto-sezione';
    riga.href = passo.pagina;

    const nome = document.createElement('p');
    nome.className = 'aiuto-sezione-nome';
    nome.textContent = passo.titolo;
    riga.appendChild(nome);

    const testo = document.createElement('p');
    testo.className = 'aiuto-sezione-testo';
    testo.textContent = passo.testo;
    riga.appendChild(testo);

    box.appendChild(riga);
  });
  return box;
}

function apriPannello() {
  chiudiPannello();

  const fondo = document.createElement('div');
  fondo.className = 'aiuto-fondo';
  fondo.addEventListener('click', chiudiPannello);
  document.body.appendChild(fondo);

  const pannello = document.createElement('div');
  pannello.className = 'aiuto-pannello';
  pannello.setAttribute('role', 'dialog');
  pannello.setAttribute('aria-label', 'Aiuto');

  const titolo = document.createElement('p');
  titolo.className = 'aiuto-titolo';
  titolo.textContent = 'Come posso aiutarti?';
  pannello.appendChild(titolo);

  const voci = document.createElement('div');
  voci.className = 'aiuto-voci';

  const rifai = document.createElement('button');
  rifai.type = 'button';
  rifai.className = 'aiuto-voce';
  rifai.innerHTML = '<i class="ph ph-hand-waving" aria-hidden="true"></i>';
  rifai.append('Spiegami di nuovo com’è fatta Akesis');
  rifai.addEventListener('click', () => { chiudiPannello(); rivediIlGiro(); });
  voci.appendChild(rifai);

  const cosa = document.createElement('button');
  cosa.type = 'button';
  cosa.className = 'aiuto-voce';
  cosa.setAttribute('aria-expanded', 'false');
  cosa.innerHTML = '<i class="ph ph-compass" aria-hidden="true"></i>';
  cosa.append('Cosa trovo in ogni sezione');
  voci.appendChild(cosa);

  const sezioni = elencoSezioni();
  sezioni.hidden = true;
  cosa.addEventListener('click', () => {
    sezioni.hidden = !sezioni.hidden;
    cosa.setAttribute('aria-expanded', String(!sezioni.hidden));
  });

  const chiedi = document.createElement('a');
  chiedi.className = 'aiuto-voce';
  chiedi.href = 'suggerimenti.html';
  chiedi.innerHTML = '<i class="ph ph-chat-circle-dots" aria-hidden="true"></i>';
  chiedi.append('Non trovo quello che mi serve');
  voci.appendChild(chiedi);

  pannello.appendChild(voci);
  pannello.appendChild(sezioni);

  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'btn btn-neutro btn-piccolo aiuto-chiudi';
  chiudi.textContent = 'Chiudi';
  chiudi.addEventListener('click', chiudiPannello);
  pannello.appendChild(chiudi);

  document.body.appendChild(pannello);
  document.querySelector('.aiuto-tasto').setAttribute('aria-expanded', 'true');
  rifai.focus();
}

export function preparaAiuto() {
  if (document.querySelector('.aiuto-tasto')) return;

  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'aiuto-tasto';
  tasto.setAttribute('aria-expanded', 'false');
  tasto.setAttribute('aria-label', 'Aiuto');
  tasto.innerHTML = '<i class="ph ph-question" aria-hidden="true"></i>';
  tasto.append('Aiuto');

  tasto.addEventListener('click', () => {
    const aperto = document.querySelector('.aiuto-pannello');
    if (aperto) chiudiPannello();
    else apriPannello();
  });

  document.body.appendChild(tasto);

  // Esc chiude, come tutte le altre finestre del sito.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudiPannello();
  });

  try { sessionStorage.removeItem(CHIAVE_APERTO); } catch (e) { /* pazienza */ }
}
