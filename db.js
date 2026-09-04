import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// La "publishable key" e' pensata per stare nel codice pubblico: la sicurezza
// vera e' data dalle policy di Row Level Security impostate su Supabase.
const SUPABASE_URL = 'https://sxeqniswoybjftkscwyp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z63kjtRjfEV5SC15wK4hNA_z69Pg1z0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getCasiClinici() {
  const { data, error } = await supabase
    .from('casi_clinici')
    .select('*')
    .order('id', { ascending: true });

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
  }
}
