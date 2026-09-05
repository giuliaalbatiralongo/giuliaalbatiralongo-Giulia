import { supabase } from './db.js?v=8';

/* Autenticazione e profilo.
   Il profilo esiste solo se l'utente ha riscattato un codice di invito:
   chi si registra senza codice resta senza profilo e viene rimandato
   alla schermata di attivazione. */

export async function getSessione() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfilo() {
  const { data: datiUtente } = await supabase.auth.getUser();
  const utente = datiUtente.user;
  if (!utente) return null;

  const { data, error } = await supabase
    .from('profili')
    .select('id, nome, ruolo')
    .eq('id', utente.id)
    .maybeSingle();

  if (error) {
    console.error('Errore nel caricamento del profilo:', error);
    return null;
  }
  if (!data) return null;

  return { ...data, email: utente.email };
}

export async function accedi(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, errore: traduciErrore(error) } : { ok: true };
}

export async function registrati(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, errore: traduciErrore(error) };
  // Se la conferma via email e' attiva, qui non c'e' ancora una sessione.
  return { ok: true, sessioneAttiva: Boolean(data.session) };
}

export async function riscattaInvito(codice, nome) {
  const { data, error } = await supabase.rpc('riscatta_invito', {
    p_codice: codice,
    p_nome: nome,
  });

  if (error) {
    console.error('Errore nel riscatto dell invito:', error);
    return { ok: false, errore: 'Non sono riuscita a verificare il codice. Riprova.' };
  }
  return data;
}

export async function aggiornaNome(nome) {
  const { data: datiUtente } = await supabase.auth.getUser();
  if (!datiUtente.user) return false;

  const { error } = await supabase
    .from('profili')
    .update({ nome })
    .eq('id', datiUtente.user.id);

  if (error) {
    console.error('Errore nel salvataggio del nome:', error);
    return false;
  }
  return true;
}

export async function esci() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

/* Protezione delle pagine: chi non ha fatto accesso finisce al login,
   chi e' entrato ma non ha ancora attivato il profilo torna
   alla schermata del codice di invito. */
export async function proteggiPagina() {
  const sessione = await getSessione();
  if (!sessione) {
    window.location.replace('login.html');
    return null;
  }

  const profilo = await getProfilo();
  if (!profilo) {
    window.location.replace('login.html?attiva=1');
    return null;
  }

  mostraProfiloInSidebar(profilo);
  return profilo;
}

function mostraProfiloInSidebar(profilo) {
  const bottone = document.querySelector('.profilo-btn');
  if (!bottone) return;

  const nome = bottone.querySelector('.profilo-nome');
  const nota = bottone.querySelector('.profilo-nota');
  if (nome) nome.textContent = profilo.nome || 'Profilo';
  if (nota) nota.textContent = profilo.ruolo === 'admin' ? 'Amministratrice' : 'Studente';

  // Da bottone inerte a link vero verso la pagina del profilo.
  const link = document.createElement('a');
  link.href = 'profilo.html';
  link.className = 'profilo-btn';
  link.innerHTML = bottone.innerHTML;
  bottone.replaceWith(link);
}

function traduciErrore(error) {
  const messaggio = (error.message || '').toLowerCase();

  if (messaggio.includes('invalid login credentials')) {
    return 'Email o password non corrette.';
  }
  if (messaggio.includes('email not confirmed')) {
    return 'Devi prima confermare la registrazione dal link che trovi nella tua email.';
  }
  if (messaggio.includes('user already registered')) {
    return 'Esiste già un account con questa email. Prova ad accedere.';
  }
  if (messaggio.includes('password should be at least')) {
    return 'La password deve avere almeno 6 caratteri.';
  }
  if (messaggio.includes('rate limit') || messaggio.includes('too many')) {
    return 'Troppi tentativi ravvicinati. Aspetta un minuto e riprova.';
  }
  return error.message;
}
