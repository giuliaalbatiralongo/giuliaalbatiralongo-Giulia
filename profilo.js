import { proteggiPagina, cambiaPassword, esci } from './auth.js?v=6';

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
}

avvia();
