import { supabase } from './db.js?v=9';

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

// Dove deve tornare l'utente dopo aver cliccato il link nell'email.
// Calcolato dall'indirizzo corrente, cosi' funziona sia in locale sia
// sul sito pubblicato senza doverlo scrivere a mano.
export function urlConferma() {
  return new URL('conferma.html', window.location.href).href;
}

export async function registrati(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: urlConferma() },
  });
  if (error) return { ok: false, errore: traduciErrore(error) };
  // Se la conferma via email e' attiva, qui non c'e' ancora una sessione.
  return { ok: true, sessioneAttiva: Boolean(data.session) };
}

/* Accesso con Google. Il codice di invito resta obbligatorio: entrare
   con Google crea l'account ma non il profilo, quindi si finisce
   ugualmente sulla schermata di attivazione. */
export async function accediConGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: urlConferma() },
  });

  if (error) {
    console.error('Errore accesso con Google:', error);
    return {
      ok: false,
      errore:
        'Accesso con Google non disponibile. Va prima configurato nel pannello Supabase.',
    };
  }
  return { ok: true };
}

// Google fornisce gia' il nome dell'account: lo proponiamo come
// suggerimento, restando modificabile prima della conferma.
export async function nomeSuggerito() {
  const { data } = await supabase.auth.getUser();
  const meta = data.user?.user_metadata || {};
  return meta.full_name || meta.name || '';
}

// Ogni nuovo invio invalida il link precedente: e' il motivo per cui
// registrarsi due volte fa fallire il primo link ricevuto.
export async function reinviaConferma(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: urlConferma() },
  });

  if (error) return { ok: false, errore: traduciErrore(error) };
  return { ok: true };
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

/* Il nome non si cambia: viene scelto una volta sola in fase di
   attivazione ed e' bloccato anche da un trigger sul database. */

export async function cambiaPassword(passwordAttuale, passwordNuova) {
  const { data: datiUtente } = await supabase.auth.getUser();
  const email = datiUtente.user?.email;
  if (!email) return { ok: false, errore: 'Sessione non valida. Esci e rientra.' };

  // Prima verifichiamo la password attuale: senza questo controllo
  // chiunque trovasse il browser aperto potrebbe cambiarla.
  const { error: erroreVerifica } = await supabase.auth.signInWithPassword({
    email,
    password: passwordAttuale,
  });

  if (erroreVerifica) {
    return { ok: false, errore: 'La password attuale non è corretta.' };
  }

  const { error } = await supabase.auth.updateUser({ password: passwordNuova });

  if (error) {
    return { ok: false, errore: traduciErrore(error) };
  }
  return { ok: true };
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
  adeguaInterfacciaAlRuolo(profilo);
  return profilo;
}

/* Nasconde a chi non e' amministratrice le parti riservate. Non e' una
   misura di sicurezza da sola: le regole vere stanno sul database, che
   rifiuta comunque le operazioni non consentite. Serve a non mostrare
   comandi che poi non funzionerebbero. */
function adeguaInterfacciaAlRuolo(profilo) {
  const admin = profilo.ruolo === 'admin';
  document.querySelectorAll('[data-solo-admin]').forEach((elemento) => {
    elemento.hidden = !admin;
  });
  document.body.dataset.ruolo = profilo.ruolo;
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
  if (messaggio.includes('should be different from the old password')) {
    return 'La nuova password deve essere diversa da quella attuale.';
  }
  if (messaggio.includes('rate limit') || messaggio.includes('too many')) {
    return 'Troppi tentativi ravvicinati. Aspetta un minuto e riprova.';
  }
  if (messaggio.includes('after') && messaggio.includes('seconds')) {
    return 'Hai chiesto un invio da poco. Aspetta un minuto e riprova.';
  }
  if (messaggio.includes('otp_expired') || messaggio.includes('expired')) {
    return 'Il link è scaduto o è stato sostituito da uno più recente.';
  }
  return error.message;
}

/* Traduce gli errori che Supabase mette nell'indirizzo quando il link
   di conferma non va a buon fine. */
export function leggiErroreDaUrl() {
  const parametri = new URLSearchParams(window.location.hash.slice(1));
  const codice = parametri.get('error_code') || parametri.get('error');
  if (!codice) return null;

  if (codice.includes('expired')) {
    return 'Il link di conferma è scaduto, oppure ne è stato inviato uno più recente che ha sostituito questo.';
  }
  if (codice.includes('access_denied')) {
    return 'Il link non è più valido. Di solito succede quando se ne riceve un altro dopo.';
  }
  return parametri.get('error_description') || 'Il link di conferma non è valido.';
}
