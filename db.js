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
