import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// La "publishable key" e' pensata per stare nel codice pubblico: la sicurezza
// vera e' data dalle policy di Row Level Security impostate su Supabase.
const SUPABASE_URL = 'https://sxeqniswoybjftkscwyp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z63kjtRjfEV5SC15wK4hNA_z69Pg1z0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let idUtenteInCache = null;

async function idUtente() {
  if (idUtenteInCache) return idUtenteInCache;
  const { data } = await supabase.auth.getUser();
  idUtenteInCache = data.user?.id || null;
  return idUtenteInCache;
}

/* I casi sono condivisi, l'avanzamento no: le due cose vivono in tabelle
   separate e vengono unite qui. Le regole del database fanno gia' vedere
   a ciascuno solo il proprio avanzamento. */
export async function getCasiClinici(materia, opzioni = {}) {
  const { includiInAttesa = false } = opzioni;

  let query = supabase.from('casi_clinici').select('*').order('id', { ascending: true });
  if (materia) query = query.eq('materia', materia);
  if (!includiInAttesa) query = query.eq('pubblicazione', 'pubblicato');

  const { data: casi, error } = await query;

  if (error) {
    console.error('Errore nel caricamento dei casi:', error);
    return [];
  }

  const { data: avanzamenti } = await supabase.from('avanzamento').select('caso_id, stato');
  const mappa = new Map((avanzamenti || []).map((a) => [a.caso_id, a.stato]));

  return casi.map((caso) => ({ ...caso, stato: mappa.get(caso.id) || 'nuovo' }));
}

/* Casi proposti dagli studenti, in attesa di revisione. Le regole del
   database li mostrano solo all'amministratrice e a chi li ha scritti. */
export async function getCasiInAttesa() {
  const { data, error } = await supabase
    .from('casi_clinici')
    .select('*')
    .eq('pubblicazione', 'in_attesa')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore nel caricamento delle proposte:', error);
    return [];
  }
  return data;
}

export async function approvaCaso(id) {
  const { error } = await supabase
    .from('casi_clinici')
    .update({ pubblicazione: 'pubblicato' })
    .eq('id', id);

  if (error) {
    console.error('Errore nell approvazione del caso:', error);
    return false;
  }
  return true;
}

export async function eliminaCaso(id) {
  const { error } = await supabase.from('casi_clinici').delete().eq('id', id);

  if (error) {
    console.error('Errore nell eliminazione del caso:', error);
    return false;
  }
  return true;
}

export async function aggiornaStatoCaso(casoId, nuovoStato) {
  const utente = await idUtente();
  if (!utente) return false;

  const { error } = await supabase.from('avanzamento').upsert(
    { utente, caso_id: casoId, stato: nuovoStato, aggiornato_il: new Date().toISOString() },
    { onConflict: 'utente,caso_id' }
  );

  if (error) {
    console.error("Errore nell'aggiornamento dell avanzamento:", error);
    return false;
  }
  return true;
}

export async function inserisciCaso(caso) {
  const { error } = await supabase
    .from('casi_clinici')
    .insert([caso]);

  if (error) {
    console.error('Errore nel salvataggio del caso:', error);
    return false;
  }
  return true;
}

export async function getMateriali(materia) {
  let query = supabase.from('materiali').select('*').order('created_at', { ascending: false });

  if (materia) {
    query = query.eq('materia', materia);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Errore nel caricamento dei materiali:', error);
    return [];
  }
  return data;
}

export async function caricaMateriale(file, metadati) {
  const percorsoFile = `${Date.now()}-${file.name}`;

  const { error: erroreUpload } = await supabase.storage.from('dispense').upload(percorsoFile, file);

  if (erroreUpload) {
    console.error('Errore nel caricamento del file:', erroreUpload);
    return false;
  }

  const { data: datiUrl } = supabase.storage.from('dispense').getPublicUrl(percorsoFile);

  const { error: erroreInserimento } = await supabase
    .from('materiali')
    .insert([
      {
        ...metadati,
        url: datiUrl.publicUrl,
        dimensione: file.size,
        autore: await idUtente(),
      },
    ]);

  if (erroreInserimento) {
    console.error('Errore nel salvataggio del materiale:', erroreInserimento);
    return false;
  }
  return true;
}

/* ---------- Domande d'esame ---------- */

export async function getDomandeEsame() {
  const { data, error } = await supabase
    .from('domande_esame')
    .select('*')
    .order('volte', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Errore nel caricamento delle domande:', error);
    return [];
  }
  return data;
}

export async function inserisciDomandaEsame(domanda) {
  const { error } = await supabase.from('domande_esame').insert([domanda]);

  if (error) {
    console.error('Errore nel salvataggio della domanda:', error);
    return false;
  }
  return true;
}

// Incrementa il contatore leggendo il valore corrente e riscrivendolo.
// Con una sola persona che scrive va bene; se in futuro l'app diventa
// multiutente conviene spostare l'incremento in una funzione lato database.
export async function incrementaVolte(id, volteAttuali) {
  const { error } = await supabase
    .from('domande_esame')
    .update({ volte: volteAttuali + 1 })
    .eq('id', id);

  if (error) {
    console.error('Errore nell aggiornamento del conteggio:', error);
    return false;
  }
  return true;
}

export async function aggiornaNoteDomanda(id, note) {
  const { error } = await supabase
    .from('domande_esame')
    .update({ note })
    .eq('id', id);

  if (error) {
    console.error('Errore nel salvataggio delle note:', error);
    return false;
  }
  return true;
}

/* ---------- Tracker delle risposte ----------
   Ogni risposta data nel quiz viene registrata come riga singola.
   Da queste righe ricaviamo accuratezza, numero di sessioni e
   andamento nel tempo: senza lo storico l'andamento non esisterebbe. */

export async function registraRisposta({ casoId, materia, corretta, sessione }) {
  const { error } = await supabase
    .from('risposte')
    .insert([{ caso_id: casoId, materia, corretta, sessione, utente: await idUtente() }]);

  if (error) {
    console.error('Errore nel salvataggio della risposta:', error);
    return false;
  }
  return true;
}

export async function getRisposte() {
  const { data, error } = await supabase
    .from('risposte')
    .select('corretta, sessione, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore nel caricamento delle risposte:', error);
    return [];
  }
  return data;
}

// Riassume le risposte in numeri pronti da mostrare. L'andamento
// confronta le ultime 20 risposte con le 20 precedenti: e' una misura
// grezza ma onesta, e non richiede una finestra temporale fissa.
export function calcolaStatistiche(risposte) {
  const totale = risposte.length;

  if (totale === 0) {
    return { totale: 0, corrette: 0, accuratezza: null, sessioni: 0, andamento: null };
  }

  const corrette = risposte.filter((r) => r.corretta).length;
  const accuratezza = Math.round((corrette / totale) * 100);
  const sessioni = new Set(risposte.map((r) => r.sessione).filter(Boolean)).size;

  let andamento = null;
  if (totale >= 10) {
    const finestra = Math.min(20, Math.floor(totale / 2));
    const recenti = risposte.slice(-finestra);
    const precedenti = risposte.slice(-finestra * 2, -finestra);

    if (precedenti.length > 0) {
      const accRecenti = (recenti.filter((r) => r.corretta).length / recenti.length) * 100;
      const accPrecedenti = (precedenti.filter((r) => r.corretta).length / precedenti.length) * 100;
      andamento = {
        delta: Math.round(accRecenti - accPrecedenti),
        recenti: Math.round(accRecenti),
        finestra,
      };
    }
  }

  return { totale, corrette, accuratezza, sessioni, andamento };
}
