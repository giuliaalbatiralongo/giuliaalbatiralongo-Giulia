import { proteggiPagina, cambiaPassword, esci } from './auth.js?v=18118483';
import { getIscritti } from './db.js';

const elNome = document.getElementById('dato-nome');
const elEmail = document.getElementById('dato-email');
const elRuolo = document.getElementById('dato-ruolo');
const elEsito = document.getElementById('esito');
const form = document.getElementById('form-password');

document.getElementById('btn-esci').addEventListener('click', () => esci());

function messaggio(testo, tipo) {
  elEsito.className = `esito-form ${tipo}`;
  if (tipo === 'ok') {
    elEsito.innerHTML = `<i class="ph-fill ph-check-circle" aria-hidden="true"></i> ${testo}`;
  } else if (tipo === 'ko') {
    elEsito.innerHTML = `<i class="ph-fill ph-x-circle" aria-hidden="true"></i> ${testo}`;
  } else {
    elEsito.textContent = testo;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(form);
  const nuova = dati.get('nuova');

  if (nuova !== dati.get('conferma')) {
    messaggio('Le due nuove password non coincidono.', 'ko');
    return;
  }

  messaggio('Aggiornamento in corso', 'attesa');

  const risultato = await cambiaPassword(dati.get('attuale'), nuova);

  if (risultato.ok) {
    messaggio('Password aggiornata. La userai al prossimo accesso.', 'ok');
    form.reset();
  } else {
    messaggio(risultato.errore, 'ko');
  }
});

async function avvia() {
  const profilo = await proteggiPagina();
  if (!profilo) return;

  elNome.textContent = profilo.nome || '-';
  elEmail.textContent = profilo.email || '-';
  elRuolo.textContent = profilo.ruolo === 'admin' ? 'Amministratrice' : 'Studente';

  if (profilo.ruolo === 'admin') await mostraIscritti();
}

/* ---------- Chi si e' iscritto ----------
   Serve a sapere chi sta entrando in Akesis senza doverlo chiedere in
   giro. Sono nomi ed email di persone vere: la pagina li mostra, ma a
   negarli a chi non e' amministratrice e' il database. */

function quando(iso) {
  if (!iso) return 'mai';
  const giorni = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (giorni <= 0) return 'oggi';
  if (giorni === 1) return 'ieri';
  if (giorni < 30) return `${giorni} giorni fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function mostraIscritti() {
  const dove = document.getElementById('iscritti');
  const gente = await getIscritti();

  if (gente.length === 0) {
    dove.innerHTML = '<p class="blocco-nota">Non sono riuscita a leggere gli iscritti.</p>';
    return;
  }

  const conto = document.createElement('p');
  conto.className = 'iscritti-conto';
  conto.textContent = `${gente.length} ${gente.length === 1 ? 'persona' : 'persone'}`;
  dove.appendChild(conto);

  gente.forEach((persona) => {
    const riga = document.createElement('div');
    riga.className = 'iscritto';

    const testi = document.createElement('div');
    testi.className = 'iscritto-testi';

    const nome = document.createElement('p');
    nome.className = 'iscritto-nome';
    nome.textContent = persona.nome || 'senza nome';
    if (persona.ruolo === 'admin') {
      const segno = document.createElement('span');
      segno.className = 'iscritto-segno';
      segno.textContent = 'amministratrice';
      nome.appendChild(segno);
    }
    testi.appendChild(nome);

    const email = document.createElement('p');
    email.className = 'iscritto-email';
    email.textContent = persona.email;
    testi.appendChild(email);
    riga.appendChild(testi);

    const quandi = document.createElement('div');
    quandi.className = 'iscritto-quando';

    const ultimo = document.createElement('p');
    ultimo.className = 'iscritto-ultimo';
    ultimo.textContent = `visto ${quando(persona.ultimo_accesso)}`;
    quandi.appendChild(ultimo);

    const iscritto = document.createElement('p');
    iscritto.className = 'iscritto-dal';
    iscritto.textContent = `iscritto ${quando(persona.iscritto_il)}`;
    quandi.appendChild(iscritto);

    // Un'email non confermata vuol dire che il link non l'ha ancora
    // aperto: e' la spiegazione piu' probabile di "non riesco a entrare".
    if (!persona.email_confermata) {
      const avviso = document.createElement('p');
      avviso.className = 'iscritto-avviso';
      avviso.textContent = 'email non confermata';
      quandi.appendChild(avviso);
    }

    riga.appendChild(quandi);
    dove.appendChild(riga);
  });
}

avvia();
