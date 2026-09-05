import {
  accedi,
  registrati,
  riscattaInvito,
  reinviaConferma,
  accediConGoogle,
  nomeSuggerito,
  getSessione,
  getProfilo,
  esci,
} from './auth.js?v=5';

const viste = {
  accedi: document.getElementById('vista-accedi'),
  registrati: document.getElementById('vista-registrati'),
  conferma: document.getElementById('vista-conferma'),
  attiva: document.getElementById('vista-attiva'),
};
const elEsito = document.getElementById('esito');
let emailInAttesa = '';

function mostraVista(nome) {
  Object.entries(viste).forEach(([chiave, elemento]) => {
    elemento.hidden = chiave !== nome;
  });
  elEsito.textContent = '';
  elEsito.className = 'esito-form';
}

function messaggio(testo, tipo) {
  elEsito.className = `esito-form ${tipo}`;
  if (tipo === 'ko') {
    elEsito.innerHTML = `<i class="ph-fill ph-x-circle" aria-hidden="true"></i> ${testo}`;
  } else if (tipo === 'ok') {
    elEsito.innerHTML = `<i class="ph-fill ph-check-circle" aria-hidden="true"></i> ${testo}`;
  } else {
    elEsito.textContent = testo;
  }
}

/* ---------- Cambio vista ---------- */

document.getElementById('vai-registrati').addEventListener('click', () => mostraVista('registrati'));
document.getElementById('vai-accedi').addEventListener('click', () => mostraVista('accedi'));
document.getElementById('conferma-vai-accedi').addEventListener('click', () => mostraVista('accedi'));
document.getElementById('esci-attiva').addEventListener('click', () => esci());

document.querySelectorAll('[data-google]').forEach((bottone) => {
  bottone.addEventListener('click', async () => {
    messaggio('Apertura di Google in corso', 'attesa');
    const risultato = await accediConGoogle();
    if (!risultato.ok) messaggio(risultato.errore, 'ko');
  });
});

document.getElementById('btn-reinvia').addEventListener('click', async (e) => {
  e.target.disabled = true;
  messaggio('Invio in corso', 'attesa');

  const risultato = await reinviaConferma(emailInAttesa);

  if (risultato.ok) {
    messaggio('Nuovo link inviato. Apri l ultima email ricevuta.', 'ok');
  } else {
    messaggio(risultato.errore, 'ko');
  }
  e.target.disabled = false;
});

/* ---------- Accedi ---------- */

document.getElementById('form-accedi').addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(e.target);
  messaggio('Accesso in corso', 'attesa');

  const esitoAccesso = await accedi(dati.get('email'), dati.get('password'));
  if (!esitoAccesso.ok) {
    messaggio(esitoAccesso.errore, 'ko');
    return;
  }

  const profilo = await getProfilo();
  if (profilo) {
    window.location.href = 'index.html';
  } else {
    mostraVista('attiva');
    messaggio('Manca solo il codice di invito per attivare il profilo.', 'attesa');
  }
});

/* ---------- Registrati ---------- */

document.getElementById('form-registrati').addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(e.target);
  messaggio('Creazione account in corso', 'attesa');

  const esitoRegistrazione = await registrati(dati.get('email'), dati.get('password'));
  if (!esitoRegistrazione.ok) {
    messaggio(esitoRegistrazione.errore, 'ko');
    return;
  }

  if (!esitoRegistrazione.sessioneAttiva) {
    emailInAttesa = dati.get('email');
    document.getElementById('email-inviata').textContent = emailInAttesa;
    mostraVista('conferma');
    return;
  }

  mostraVista('attiva');
  messaggio('Account creato. Ora attiva il profilo con il codice di invito.', 'attesa');
});

/* ---------- Attivazione ---------- */

document.getElementById('form-attiva').addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(e.target);
  messaggio('Verifica del codice in corso', 'attesa');

  const risultato = await riscattaInvito(dati.get('codice'), dati.get('nome'));
  if (!risultato.ok) {
    messaggio(risultato.errore, 'ko');
    return;
  }

  messaggio('Profilo attivato.', 'ok');
  window.location.href = 'index.html';
});

/* ---------- Stato iniziale ---------- */

async function avvia() {
  const sessione = await getSessione();

  if (!sessione) {
    mostraVista('accedi');
    return;
  }

  const profilo = await getProfilo();
  if (profilo) {
    window.location.replace('index.html');
    return;
  }

  // Chi entra con Google ha gia' un nome: lo proponiamo, resta modificabile.
  const campoNome = document.getElementById('attiva-nome');
  if (!campoNome.value) campoNome.value = await nomeSuggerito();

  mostraVista('attiva');
  if (new URLSearchParams(window.location.search).has('attiva')) {
    messaggio('Il tuo account non ha ancora un profilo attivo. Serve il codice di invito.', 'attesa');
  }
}

avvia();
