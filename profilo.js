import { proteggiPagina, aggiornaNome, esci } from './auth.js?v=1';

const elNome = document.getElementById('nome');
const elEmail = document.getElementById('dato-email');
const elRuolo = document.getElementById('dato-ruolo');
const elEsito = document.getElementById('esito');

document.getElementById('btn-esci').addEventListener('click', () => esci());

document.getElementById('form-profilo').addEventListener('submit', async (e) => {
  e.preventDefault();

  elEsito.className = 'esito-form attesa';
  elEsito.textContent = 'Salvataggio in corso';

  const salvato = await aggiornaNome(elNome.value.trim());

  if (salvato) {
    elEsito.className = 'esito-form ok';
    elEsito.innerHTML = '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Nome aggiornato.';
    const nomeSidebar = document.querySelector('.profilo-nome');
    if (nomeSidebar) nomeSidebar.textContent = elNome.value.trim() || 'Profilo';
  } else {
    elEsito.className = 'esito-form ko';
    elEsito.innerHTML = '<i class="ph-fill ph-x-circle" aria-hidden="true"></i> Non sono riuscita a salvare il nome.';
  }
});

async function avvia() {
  const profilo = await proteggiPagina();
  if (!profilo) return;

  elNome.value = profilo.nome || '';
  elEmail.textContent = profilo.email || '-';
  elRuolo.textContent = profilo.ruolo === 'admin' ? 'Amministratrice' : 'Studente';
}

avvia();
