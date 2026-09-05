import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// La "publishable key" e' pensata per stare nel codice pubblico: la sicurezza
// vera e' data dalle policy di Row Level Security impostate su Supabase.
const SUPABASE_URL = 'https://sxeqniswoybjftkscwyp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z63kjtRjfEV5SC15wK4hNA_z69Pg1z0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getCasiClinici(materia) {
  let query = supabase.from('casi_clinici').select('*').order('id', { ascending: true });

  if (materia) {
    query = query.eq('materia', materia);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Errore nel caricamento dei casi:', error);
    return [];
  }
  return data;
}

export async function aggiornaStatoCaso(id, nuovoStato) {
  const { error } = await supabase
    .from('casi_clinici')
    .update({ stato: nuovoStato })
    .eq('id', id);

  if (error) {
    console.error("Errore nell'aggiornamento dello stato:", error);
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
    .insert([{ ...metadati, url: datiUrl.publicUrl }]);

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
    .insert([{ caso_id: casoId, materia, corretta, sessione }]);

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
