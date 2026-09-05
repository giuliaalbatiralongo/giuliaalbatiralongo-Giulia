import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// La "publishable key" e' pensata per stare nel codice pubblico: la sicurezza
// vera e' data dalle policy di Row Level Security impostate su Supabase.
export const SUPABASE_URL = 'https://sxeqniswoybjftkscwyp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Z63kjtRjfEV5SC15wK4hNA_z69Pg1z0';

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

  const { data: avanzamenti } = await supabase
    .from('avanzamento')
    .select('caso_id, stato, passo, prossimo_ripasso');

  const mappa = new Map((avanzamenti || []).map((a) => [a.caso_id, a]));

  return casi.map((caso) => {
    const a = mappa.get(caso.id);
    return {
      ...caso,
      stato: a?.stato || 'nuovo',
      passo: a?.passo || 0,
      prossimoRipasso: a?.prossimo_ripasso || null,
    };
  });
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

/* Registra il ripasso di un caso. La nuova data e il nuovo stato li
   calcola il database: la scala degli intervalli non deve dipendere da
   quello che gira nel browser. */
export async function registraRipasso(casoId, corretta) {
  const { data, error } = await supabase.rpc('registra_ripasso', {
    p_caso_id: casoId,
    p_corretta: corretta,
  });

  if (error) {
    console.error('Errore nel salvataggio del ripasso:', error);
    return null;
  }
  return data;
}

/* I casi in scadenza oggi o gia' scaduti, dal piu' arretrato.

   Il tetto serve a non ritrovarsi davanti duecento casi dopo due
   settimane di pausa: e' il motivo per cui la gente abbandona questi
   sistemi. Meglio venti scelti bene che un numero che scoraggia. */
export function casiDaRipassareOggi(casi, tetto = 20) {
  const oggi = new Date().toISOString().slice(0, 10);

  return casi
    .filter((c) => c.prossimoRipasso && c.prossimoRipasso <= oggi)
    .sort((a, b) => a.prossimoRipasso.localeCompare(b.prossimoRipasso))
    .slice(0, tetto);
}

export function casiMaiVisti(casi) {
  return casi.filter((c) => !c.prossimoRipasso);
}

/* "domani", "fra 3 giorni", "il 12 ottobre" */
export function quandoTorna(giorni) {
  if (giorni === 1) return 'domani';
  if (giorni <= 10) return `fra ${giorni} giorni`;

  const data = new Date();
  data.setDate(data.getDate() + giorni);
  return `il ${data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`;
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

const ARCHIVIO = 'dispense';

/* Il nome di chi ha caricato, per mostrarlo accanto ai documenti. */
async function nomiAutori(elencoId) {
  const unici = [...new Set(elencoId.filter(Boolean))];
  if (unici.length === 0) return new Map();

  const { data } = await supabase.from('profili').select('id, nome').in('id', unici);
  return new Map((data || []).map((p) => [p.id, p.nome]));
}

/* Non chiediamo mai la colonna chiave_hash: al sito basta sapere se un
   documento e' protetto, e quello lo dice ha_chiave. */
const CAMPI_MATERIALE =
  'id, materia, argomento, titolo, tipo, percorso, dimensione, autore, pubblicazione, ha_chiave, created_at';

export async function getMateriali(materia, opzioni = {}) {
  const { includiInAttesa = false } = opzioni;

  let query = supabase
    .from('materiali')
    .select(CAMPI_MATERIALE)
    .order('created_at', { ascending: false });

  if (materia) query = query.eq('materia', materia);
  if (!includiInAttesa) query = query.eq('pubblicazione', 'pubblicato');

  const { data, error } = await query;

  if (error) {
    console.error('Errore nel caricamento dei materiali:', error);
    return [];
  }

  const [nomi, mio] = await Promise.all([nomiAutori(data.map((m) => m.autore)), idUtente()]);
  const { data: sblocchi } = await supabase.from('sblocchi_materiale').select('materiale_id');
  const gia = new Set((sblocchi || []).map((s) => s.materiale_id));

  return data.map((materiale) => ({
    ...materiale,
    autoreNome: nomi.get(materiale.autore) || 'Sconosciuto',
    mio: materiale.autore === mio,
    // Chi l'ha caricato non deve inserire la chiave che ha scelto lui.
    sbloccato: !materiale.ha_chiave || gia.has(materiale.id) || materiale.autore === mio,
  }));
}

/* L'archivio e' privato: ogni apertura passa da un link firmato che vale
   un'ora. Se la persona non ne ha diritto, Supabase rifiuta di crearlo. */
export async function linkMateriale(percorso) {
  const { data, error } = await supabase.storage
    .from(ARCHIVIO)
    .createSignedUrl(percorso, 3600);

  if (error) {
    console.error('Errore nella creazione del link:', error);
    return null;
  }
  return data.signedUrl;
}

/* Un link per volta costa una chiamata a testa: per un elenco li
   chiediamo tutti insieme. Chi non ha diritto a un file semplicemente
   non riceve il suo link, senza far fallire gli altri. */
export async function linkMateriali(percorsi) {
  const puliti = percorsi.filter(Boolean);
  if (puliti.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(ARCHIVIO)
    .createSignedUrls(puliti, 3600);

  if (error) {
    console.error('Errore nella creazione dei link:', error);
    return new Map();
  }

  return new Map(
    (data || [])
      .filter((voce) => voce.signedUrl && !voce.error)
      .map((voce) => [voce.path, voce.signedUrl])
  );
}

export async function sbloccaMateriale(id, chiave) {
  const { data, error } = await supabase.rpc('sblocca_materiale', {
    p_materiale_id: id,
    p_chiave: chiave,
  });

  if (error) {
    console.error('Errore nello sblocco del materiale:', error);
    return { ok: false, errore: 'Non sono riuscita a verificare la chiave. Riprova.' };
  }
  return data;
}

/* Prima il file, poi la registrazione. L'autore, lo stato di pubblicazione
   e l'impronta della chiave li decide il database: qui non si possono
   forzare. */
export async function caricaMateriale(file, metadati) {
  const utente = await idUtente();
  if (!utente) return { ok: false, errore: 'Sessione scaduta. Esci e rientra.' };

  const nomePulito = file.name.replace(/[^\w.\- ]+/g, '_');
  const percorso = `${utente}/${Date.now()}-${nomePulito}`;

  const { error: erroreArchivio } = await supabase.storage.from(ARCHIVIO).upload(percorso, file);

  if (erroreArchivio) {
    console.error('Errore nel caricamento del file:', erroreArchivio);
    return { ok: false, errore: 'Non sono riuscita a caricare il file.' };
  }

  const { data, error } = await supabase.rpc('registra_materiale', {
    p_percorso: percorso,
    p_titolo: metadati.titolo,
    p_materia: metadati.materia,
    p_argomento: metadati.argomento,
    p_tipo: metadati.tipo,
    p_dimensione: file.size,
    p_chiave: metadati.chiave || null,
  });

  // Se la scheda non si salva, il file resta li' a occupare spazio
  // senza comparire da nessuna parte: meglio toglierlo subito.
  if (error || !data?.ok) {
    await supabase.storage.from(ARCHIVIO).remove([percorso]);
    console.error('Errore nel salvataggio del materiale:', error || data);
    return { ok: false, errore: data?.errore || 'Non sono riuscita a salvare il materiale.' };
  }

  return data;
}

export async function getMaterialiInAttesa() {
  const { data, error } = await supabase
    .from('materiali')
    .select(CAMPI_MATERIALE)
    .eq('pubblicazione', 'in_attesa')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore nel caricamento dei materiali in attesa:', error);
    return [];
  }

  const nomi = await nomiAutori(data.map((m) => m.autore));
  return data.map((m) => ({ ...m, autoreNome: nomi.get(m.autore) || 'Sconosciuto' }));
}

export async function approvaMateriale(id) {
  const { error } = await supabase
    .from('materiali')
    .update({ pubblicazione: 'pubblicato' })
    .eq('id', id);

  if (error) {
    console.error('Errore nell approvazione del materiale:', error);
    return false;
  }
  return true;
}

/* Prima la scheda, poi il file: se togliessimo prima il file, un errore
   sulla scheda lascerebbe un documento che compare ma non si apre. */
export async function eliminaMateriale(id, percorso) {
  const { error } = await supabase.from('materiali').delete().eq('id', id);

  if (error) {
    console.error('Errore nell eliminazione del materiale:', error);
    return false;
  }

  if (percorso) await supabase.storage.from(ARCHIVIO).remove([percorso]);
  return true;
}

/* ---------- Domande d'esame ---------- */

export async function getDomandeEsame(materia) {
  let query = supabase
    .from('domande_esame')
    .select('*')
    .order('volte', { ascending: false })
    .order('created_at', { ascending: false });

  if (materia) query = query.eq('materia', materia);

  const { data, error } = await query;

  if (error) {
    console.error('Errore nel caricamento delle domande:', error);
    return [];
  }

  // Quante note ha ciascuna domanda: serve a scrivere "2 note" sul
  // pulsante senza dover caricare il testo di tutte in anticipo.
  const [{ data: note }, { data: professori }] = await Promise.all([
    supabase.from('note_domanda').select('domanda_id'),
    supabase.from('domanda_professori').select('id, domanda_id, professore, autore'),
  ]);

  const conteggio = new Map();
  (note || []).forEach((n) => {
    conteggio.set(n.domanda_id, (conteggio.get(n.domanda_id) || 0) + 1);
  });

  const mio = await idUtente();
  const perDomanda = new Map();
  (professori || []).forEach((p) => {
    const elenco = perDomanda.get(p.domanda_id) || [];
    elenco.push({ ...p, mio: p.autore === mio });
    perDomanda.set(p.domanda_id, elenco);
  });

  return data.map((domanda) => ({
    ...domanda,
    quanteNote: conteggio.get(domanda.id) || 0,
    professori: (perDomanda.get(domanda.id) || []).sort((a, b) =>
      a.professore.localeCompare(b.professore)
    ),
  }));
}

export async function inserisciDomandaEsame(domanda) {
  const { nota, ...campi } = domanda;

  const { data, error } = await supabase
    .from('domande_esame')
    .insert([campi])
    .select('id')
    .single();

  if (error) {
    console.error('Errore nel salvataggio della domanda:', error);
    return false;
  }

  // La nota iniziale, se c'e', diventa la prima nota della domanda.
  if (nota && nota.trim()) await aggiungiNota(data.id, nota);

  return true;
}

/* L'incremento lo fa il database: se due persone premono il pulsante
   nello stesso momento, prima veniva contata una sola volta. */
export async function incrementaVolte(id) {
  const { data, error } = await supabase.rpc('incrementa_volte', { p_id: id });

  if (error) {
    console.error('Errore nell aggiornamento del conteggio:', error);
    return null;
  }
  return data;
}

/* ---------- Note delle domande ----------
   Piu' persone possono annotare la stessa domanda: ognuna scrive la
   propria, nessuno sovrascrive quella di un altro. */

export async function getNoteDomanda(domandaId) {
  const { data, error } = await supabase
    .from('note_domanda')
    .select('id, testo, autore, created_at')
    .eq('domanda_id', domandaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore nel caricamento delle note:', error);
    return [];
  }

  const [nomi, mio] = await Promise.all([nomiAutori(data.map((n) => n.autore)), idUtente()]);

  return data.map((nota) => ({
    ...nota,
    autoreNome: nomi.get(nota.autore) || 'Sconosciuto',
    mia: nota.autore === mio,
  }));
}

export async function aggiungiNota(domandaId, testo) {
  const { data, error } = await supabase
    .from('note_domanda')
    .insert([{ domanda_id: domandaId, testo: testo.trim() }])
    .select('id, testo, autore, created_at')
    .single();

  if (error) {
    console.error('Errore nel salvataggio della nota:', error);
    return null;
  }
  return data;
}

/* ---------- Professori che hanno fatto una domanda ---------- */

export async function aggiungiProfessore(domandaId, professore) {
  const { data, error } = await supabase
    .from('domanda_professori')
    .insert([{ domanda_id: domandaId, professore: professore.trim() }])
    .select('id, professore, autore')
    .single();

  if (error) {
    // Il vincolo di unicita' scatta se quel professore c'e' gia'.
    if (error.code === '23505') {
      return { ok: false, errore: 'Questo professore e gia segnato su questa domanda.' };
    }
    console.error('Errore nel salvataggio del professore:', error);
    return { ok: false, errore: 'Non sono riuscita a salvare.' };
  }

  return { ok: true, voce: { ...data, mio: true } };
}

export async function togliProfessore(id) {
  const { error } = await supabase.from('domanda_professori').delete().eq('id', id);

  if (error) {
    console.error('Errore nella rimozione del professore:', error);
    return false;
  }
  return true;
}

export async function eliminaNota(id) {
  const { error } = await supabase.from('note_domanda').delete().eq('id', id);

  if (error) {
    console.error('Errore nell eliminazione della nota:', error);
    return false;
  }
  return true;
}

/* ---------- Calendario ---------- */

/* L'ordine conta: e' quello con cui la tavolozza dei colori e' stata
   verificata, tinte vicine tenute lontane fra loro. Cambiarlo senza
   rifare la verifica rischia di rendere due categorie indistinguibili
   a chi ha problemi di percezione dei colori.

   "Altro" resta senza colore di proposito: e' l'assenza di categoria, e
   un grigio in mezzo a sei tinte non passerebbe comunque i controlli. */
export const TIPI_DATA = [
  { chiave: 'iscritta', nome: 'Esame', icona: 'ph-seal-check' },
  { chiave: 'appello', nome: 'Appello', icona: 'ph-calendar-blank' },
  { chiave: 'preappello', nome: 'Preappello', icona: 'ph-calendar-plus' },
  { chiave: 'tirocinio', nome: 'Tirocinio', icona: 'ph-first-aid-kit' },
  { chiave: 'lezione', nome: 'Lezione', icona: 'ph-chalkboard-simple' },
  { chiave: 'scadenza', nome: 'Scadenza', icona: 'ph-hourglass-medium' },
  { chiave: 'altro', nome: 'Altro', icona: 'ph-dot-outline' },
];

export function tipoData(chiave) {
  return TIPI_DATA.find((t) => t.chiave === chiave) || TIPI_DATA[TIPI_DATA.length - 1];
}

export function nomeTipoData(chiave) {
  return tipoData(chiave).nome;
}

/* Il titolo puo' mancare: per un tirocinio spesso basta il tipo. */
export function titoloData(voce) {
  return voce.materia || nomeTipoData(voce.tipo);
}

export async function getDateEsame() {
  const { data, error } = await supabase
    .from('date_esame')
    .select('*')
    .order('giorno', { ascending: true })
    .order('ora', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Errore nel caricamento delle date:', error);
    return [];
  }

  const [nomi, mio] = await Promise.all([nomiAutori(data.map((d) => d.autore)), idUtente()]);

  return data.map((d) => ({
    ...d,
    autoreNome: nomi.get(d.autore) || 'Sconosciuto',
    mia: d.autore === mio,
  }));
}

export async function inserisciDataEsame(voce) {
  const { data, error } = await supabase.from('date_esame').insert([voce]).select('*').single();

  if (error) {
    console.error('Errore nel salvataggio della data:', error);
    return null;
  }
  return data;
}

export async function eliminaDataEsame(id) {
  const { error } = await supabase.from('date_esame').delete().eq('id', id);

  if (error) {
    console.error('Errore nell eliminazione della data:', error);
    return false;
  }
  return true;
}

/* Quanti giorni mancano. I numeri negativi vogliono dire che e' passata. */
export function giorniMancanti(giorno) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const data = new Date(giorno + 'T00:00:00');
  return Math.round((data - oggi) / 86400000);
}

/* "oggi", "domani", "fra 12 giorni", "il 4 novembre", "3 giorni fa" */
export function contoAllaRovescia(giorno) {
  const g = giorniMancanti(giorno);

  if (g === 0) return 'oggi';
  if (g === 1) return 'domani';
  if (g === -1) return 'ieri';
  if (g < 0) return `${Math.abs(g)} giorni fa`;
  if (g <= 30) return `fra ${g} giorni`;

  const data = new Date(giorno + 'T00:00:00');
  return `il ${data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`;
}

/* ---------- Esportazione del calendario ---------- */

/* Un file .ics e' una fotografia: se aggiungi una data domani, il
   calendario del telefono non lo sa. Per una sincronizzazione vera
   servirebbe un indirizzo a cui abbonarsi, e quell'indirizzo sarebbe
   una chiave permanente sul proprio calendario. */
function scappaIcs(testo) {
  return String(testo || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Lo standard vuole righe di massimo 75 ottetti, spezzate con uno spazio.
function piegaRiga(riga) {
  if (riga.length <= 73) return riga;
  const pezzi = [riga.slice(0, 73)];
  let resto = riga.slice(73);
  while (resto.length > 72) {
    pezzi.push(' ' + resto.slice(0, 72));
    resto = resto.slice(72);
  }
  pezzi.push(' ' + resto);
  return pezzi.join('\r\n');
}

function timbroUtc(data) {
  return data.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function creaIcs(date) {
  const righe = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Akesis//Calendario//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Akesis',
  ];

  const adesso = timbroUtc(new Date());

  date.forEach((voce) => {
    const senzaTrattini = voce.giorno.replace(/-/g, '');
    righe.push('BEGIN:VEVENT');
    righe.push(`UID:akesis-${voce.id}@akesis`);
    righe.push(`DTSTAMP:${adesso}`);

    if (voce.ora) {
      // Senza fuso orario dichiarato l'ora vale come locale, che e'
      // quello che serve: un esame alle 9 e' alle 9 dove sei tu.
      const ora = voce.ora.slice(0, 5).replace(':', '');
      righe.push(`DTSTART:${senzaTrattini}T${ora}00`);
      const fine = new Date(`${voce.giorno}T${voce.ora}`);
      fine.setHours(fine.getHours() + 2);
      const oraFine = `${String(fine.getHours()).padStart(2, '0')}${String(
        fine.getMinutes()
      ).padStart(2, '0')}`;
      righe.push(`DTEND:${senzaTrattini}T${oraFine}00`);
    } else {
      // Evento di giornata intera: la fine e' il giorno dopo.
      const dopo = new Date(voce.giorno + 'T00:00:00');
      dopo.setDate(dopo.getDate() + 1);
      const m = String(dopo.getMonth() + 1).padStart(2, '0');
      const g = String(dopo.getDate()).padStart(2, '0');
      righe.push(`DTSTART;VALUE=DATE:${senzaTrattini}`);
      righe.push(`DTEND;VALUE=DATE:${dopo.getFullYear()}${m}${g}`);
    }

    // Senza titolo, titoloData restituisce gia' il nome del tipo: ripeterlo
    // fra parentesi darebbe "Tirocinio (Tirocinio)".
    const titolo = titoloData(voce);
    const tipo = nomeTipoData(voce.tipo);
    const riepilogo = titolo === tipo ? titolo : `${titolo} (${tipo})`;
    righe.push(piegaRiga(`SUMMARY:${scappaIcs(riepilogo)}`));
    if (voce.luogo) righe.push(piegaRiga(`LOCATION:${scappaIcs(voce.luogo)}`));
    if (voce.note) righe.push(piegaRiga(`DESCRIPTION:${scappaIcs(voce.note)}`));
    righe.push('END:VEVENT');
  });

  righe.push('END:VCALENDAR');
  return righe.join('\r\n');
}

/* ---------- Organizzazione dello studio ---------- */

export const UNITA = [
  { chiave: 'pagine', nome: 'Pagine', singolare: 'pagina', plurale: 'pagine' },
  { chiave: 'lezioni', nome: 'Lezioni', singolare: 'lezione', plurale: 'lezioni' },
  { chiave: 'giorni', nome: 'Giorni', singolare: 'giorno', plurale: 'giorni' },
];

export function nomeUnita(chiave, quante) {
  const u = UNITA.find((x) => x.chiave === chiave) || UNITA[0];
  return quante === 1 ? u.singolare : u.plurale;
}

/* Le fasi che si propongono di partenza: sono quelle che Giulia ha
   descritto, una lettura e due ripassi sempre piu' rapidi. */
export const FASI_PROPOSTE = [
  { nome: 'Prima lettura', giorni: 10 },
  { nome: 'Prima ripetizione', giorni: 7 },
  { nome: 'Seconda ripetizione', giorni: 7 },
];

export async function getPiani() {
  const { data, error } = await supabase
    .from('piani')
    .select('*, fasi:piano_fasi(*)')
    .order('fine', { ascending: true });

  if (error) {
    console.error('Errore nel caricamento dei piani:', error);
    return [];
  }

  return data.map((p) => ({ ...p, fasi: (p.fasi || []).sort((a, b) => a.ordine - b.ordine) }));
}

export async function inserisciPiano(piano, fasi) {
  const { data, error } = await supabase.from('piani').insert([piano]).select('*').single();

  if (error) {
    console.error('Errore nel salvataggio del piano:', error);
    return null;
  }

  const righe = fasi.map((f, i) => ({ ...f, piano_id: data.id, ordine: i + 1 }));
  const { data: salvate, error: erroreFasi } = await supabase
    .from('piano_fasi')
    .insert(righe)
    .select('*');

  // Un piano senza fasi non dice niente: se le fasi non entrano, si
  // toglie anche lui invece di restare monco.
  if (erroreFasi) {
    console.error('Errore nel salvataggio delle fasi:', erroreFasi);
    await supabase.from('piani').delete().eq('id', data.id);
    return null;
  }

  return { ...data, fasi: salvate.sort((a, b) => a.ordine - b.ordine) };
}

export async function aggiornaFatteFase(id, fatte) {
  const { error } = await supabase.from('piano_fasi').update({ fatte }).eq('id', id);

  if (error) {
    console.error('Errore nell aggiornamento della fase:', error);
    return false;
  }
  return true;
}

export async function eliminaPiano(id) {
  const { error } = await supabase.from('piani').delete().eq('id', id);

  if (error) {
    console.error('Errore nell eliminazione del piano:', error);
    return false;
  }
  return true;
}

function giorniDiStudio(dal, al, giorniLiberi) {
  const liberi = new Set((giorniLiberi || []).map(Number));
  const giorni = [];

  const cursore = new Date(dal + 'T00:00:00');
  const fine = new Date(al + 'T00:00:00');

  while (cursore < fine) {
    const settimana = cursore.getDay() === 0 ? 7 : cursore.getDay();
    if (!liberi.has(settimana)) {
      const m = String(cursore.getMonth() + 1).padStart(2, '0');
      const g = String(cursore.getDate()).padStart(2, '0');
      giorni.push(`${cursore.getFullYear()}-${m}-${g}`);
    }
    cursore.setDate(cursore.getDate() + 1);
  }

  return giorni;
}

/* Il piano di una materia.

   Le fasi occupano i giorni utili in fila, nell'ordine in cui sono
   scritte. Ogni fase rifa' tutto il materiale nei giorni che le
   spettano: e' per questo che le ripetizioni sono piu' fitte della
   prima lettura, non perche' si legga piu' in fretta.

   Con l'unita' "giorni" non si calcola nessuna quantita' giornaliera:
   quel modo di contare serve proprio a chi non conta. */
export function calcolaPiano(piano, oggiIso) {
  const oggi = oggiIso || new Date().toISOString().slice(0, 10);
  const tutti = giorniDiStudio(piano.inizio, piano.fine, piano.giorni_liberi);
  const aQuantita = piano.unita !== 'giorni';

  let posizione = 0;
  const fasi = (piano.fasi || []).map((fase) => {
    const suoi = tutti.slice(posizione, posizione + fase.giorni);
    posizione += fase.giorni;

    return {
      ...fase,
      giorniVeri: suoi,
      dal: suoi[0] || null,
      al: suoi[suoi.length - 1] || null,
      // La quantita' per giorno e' quella della fase: ogni fase rifa'
      // tutto il materiale nei giorni che ha.
      alGiorno: aQuantita && suoi.length > 0 ? piano.quantita / suoi.length : null,
      completa: suoi.length === fase.giorni,
    };
  });

  const richiesti = fasi.reduce((s, f) => s + f.giorni, 0);
  const avanzano = tutti.length - richiesti;

  const faseOggi = fasi.find((f) => f.giorniVeri.includes(oggi)) || null;
  const oggiELibero = !tutti.includes(oggi) && oggi >= piano.inizio && oggi < piano.fine;

  return {
    fasi,
    giorniDisponibili: tutti.length,
    giorniRichiesti: richiesti,
    avanzano,
    // Non ci sta se le fasi chiedono piu' giorni di quelli disponibili.
    fattibile: avanzano >= 0,
    faseOggi,
    oggiELibero,
    quantitaOggi: faseOggi && faseOggi.alGiorno !== null ? faseOggi.alGiorno : null,
    finito: oggi >= piano.fine,
  };
}

/* Cosa tocca oggi, su tutte le materie insieme. Non si sommano
   quantita' di unita' diverse: quaranta pagine e tre lezioni non fanno
   quarantatre di niente. */
export function studioDiOggi(piani, oggiIso) {
  const oggi = oggiIso || new Date().toISOString().slice(0, 10);

  return piani
    .map((piano) => ({ piano, calcolo: calcolaPiano(piano, oggi) }))
    .filter((v) => v.calcolo.faseOggi)
    .map((v) => ({
      materia: v.piano.materia,
      unita: v.piano.unita,
      fase: v.calcolo.faseOggi.nome,
      quantita: v.calcolo.quantitaOggi,
    }));
}

/* ---------- Interesse per i servizi non ancora attivi ---------- */

export async function getMioInteresse() {
  const { data, error } = await supabase.from('interesse_servizi').select('servizio, nota');

  if (error) {
    console.error('Errore nel caricamento degli interessi:', error);
    return [];
  }
  return data;
}

export async function lasciaInteresse(servizio, nota) {
  const utente = await idUtente();
  if (!utente) return false;

  const { error } = await supabase
    .from('interesse_servizi')
    .insert([{ utente, servizio, nota: nota || null }]);

  if (error) {
    console.error('Errore nel salvataggio dell interesse:', error);
    return false;
  }
  return true;
}

export async function ritiraInteresse(servizio) {
  const { error } = await supabase.from('interesse_servizi').delete().eq('servizio', servizio);

  if (error) {
    console.error('Errore nel ritiro dell interesse:', error);
    return false;
  }
  return true;
}

/* ---------- Tempo di studio ---------- */

/* Quanto tempo per sezione, dal giorno indicato a oggi. Le regole del
   database restituiscono soltanto le righe di chi sta chiedendo. */
export async function getTempoStudio(daGiorni = 30) {
  const da = new Date();
  da.setDate(da.getDate() - daGiorni);

  const { data, error } = await supabase
    .from('tempo_studio')
    .select('sezione, giorno, secondi')
    .gte('giorno', da.toISOString().slice(0, 10))
    .order('giorno', { ascending: false });

  if (error) {
    console.error('Errore nel caricamento del tempo:', error);
    return [];
  }
  return data;
}

/* Somma i secondi per sezione in un insieme di righe. */
export function sommaPerSezione(righe) {
  const totali = {};
  righe.forEach((r) => {
    totali[r.sezione] = (totali[r.sezione] || 0) + r.secondi;
  });
  return totali;
}

/* "1 h 20 min", "45 min", "meno di un minuto". Niente secondi: su un
   tempo di studio non aggiungono nulla. */
export function formattaDurata(secondi) {
  if (!secondi || secondi < 60) return 'meno di un minuto';

  const minuti = Math.round(secondi / 60);
  if (minuti < 60) return `${minuti} min`;

  const ore = Math.floor(minuti / 60);
  const resto = minuti % 60;
  return resto === 0 ? `${ore} h` : `${ore} h ${resto} min`;
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
    .select('materia, corretta, sessione, created_at')
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
/* Quanto ha messo dentro questa persona. I conteggi arrivano dal
   database senza scaricare le righe: servono solo i numeri. */
export async function getMieiContributi() {
  const utente = await idUtente();
  if (!utente) return { casi: 0, domande: 0, note: 0, materiali: 0 };

  const conta = async (tabella) => {
    const { count, error } = await supabase
      .from(tabella)
      .select('*', { count: 'exact', head: true })
      .eq('autore', utente);
    if (error) {
      console.error(`Errore nel conteggio di ${tabella}:`, error);
      return 0;
    }
    return count || 0;
  };

  const [casi, domande, note, materiali] = await Promise.all([
    conta('casi_clinici'),
    conta('domande_esame'),
    conta('note_domanda'),
    conta('materiali'),
  ]);

  return { casi, domande, note, materiali };
}

/* Accuratezza per materia, dalla piu' debole. Sotto le cinque risposte
   la percentuale non dice niente, quindi la materia resta fuori. */
export function accuratezzaPerMateria(risposte, minimo = 5) {
  const per = new Map();

  risposte.forEach((r) => {
    const nome = r.materia || 'Senza materia';
    const voce = per.get(nome) || { materia: nome, totale: 0, corrette: 0 };
    voce.totale += 1;
    if (r.corretta) voce.corrette += 1;
    per.set(nome, voce);
  });

  return [...per.values()]
    .filter((v) => v.totale >= minimo)
    .map((v) => ({ ...v, accuratezza: Math.round((v.corrette / v.totale) * 100) }))
    .sort((a, b) => a.accuratezza - b.accuratezza);
}

/* Il tempo per giorno e per sezione, in una mappa comoda da disegnare:
   giorno -> { quiz, domande, materiali }. */
export function tempoPerGiorno(righe, giorni = 14) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const elenco = [];
  for (let i = giorni - 1; i >= 0; i -= 1) {
    const d = new Date(oggi);
    d.setDate(d.getDate() - i);
    const chiave = d.toISOString().slice(0, 10);
    elenco.push({ giorno: chiave, data: d, quiz: 0, domande: 0, materiali: 0, totale: 0 });
  }

  const indice = new Map(elenco.map((v) => [v.giorno, v]));

  righe.forEach((r) => {
    const voce = indice.get(r.giorno);
    if (!voce) return;
    if (voce[r.sezione] !== undefined) voce[r.sezione] += r.secondi;
    voce.totale += r.secondi;
  });

  return elenco;
}

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
