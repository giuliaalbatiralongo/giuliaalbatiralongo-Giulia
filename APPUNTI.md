# Appunti di Akesis

Cose decise, cose rimaste aperte, cose da fare quando sara' il momento.
Questo file esiste perche' le conversazioni finiscono e i file restano:
quando riprendiamo il lavoro, si riparte da qui.

---

> Gli spunti per le prossime funzioni stanno in `IDEE.md`, insieme a
> cosa fanno le piattaforme concorrenti e a cosa sbagliano.
> L'ordine di lavoro delle sette idee scelte sta in `PIANO.md`.

## Che cosa e' Akesis (deciso il 5 settembre)

Akesis **non e' un sito di quiz**. E' lo strumento che ti accompagna
all'universita': ci carichi il materiale, ci progetti lo studio, ci
organizzi la sessione, ci vedi le date e gli impegni. L'amico
universitario, non il registro dei voti.

**Rifatta una seconda volta il 5 settembre.** La prima versione diceva
le cose giuste ma sembrava un menu: sei schede uguali sotto il titolo
"Cosa trovi qui", cioe' la barra laterale disegnata due volte. Giulia
l'ha giudicata acerba.

La seconda versione parte dalle domande che si fa lei aprendo l'app:
*cosa devo studiare oggi, dov'e' il materiale, ho del tempo libero,
come avevo organizzato gli esami, ho delle scadenze.* Ogni pezzo della
pagina risponde a una di quelle, in quell'ordine di urgenza:

- **In cima**, la data e il saluto. Niente piu' lastra viola: mangiava
  mezzo schermo per una frase, e sopra non ci stava niente di utile
- **"Cosa studi oggi"** e' l'unico blocco con il fondo d'accento e i
  numeri grandi. Ci finiscono dentro, in quest'ordine: le date di oggi,
  quanto studiare per ogni materia, i casi da ripassare. Se e' vuoto,
  invita invece di rimproverare
- **Due tessere grandi e verticali**, Materiali e Domande esami: le sole
  due cose che si aprono davvero mentre si studia. Comode da prendere
  col pollice
- **L'invito ai quiz** e' una striscia a parte, con il bordo
  tratteggiato: "Quiz? Se ti avanzano dieci minuti". **Non e' un compito
  del giorno.** Deciso da Giulia il 6 settembre: lo studio universitario
  si misura in pagine e lezioni, non in quiz, quindi i casi da ripassare
  sono usciti da "Cosa studi oggi"
- Quiz e Test SSM non stanno piu' nel corpo della home: restano nel menu
- **A destra**, **Prossimamente** con quanti giorni mancano (non la data:
  "fra 12 giorni" si capisce a colpo d'occhio, "17 settembre" no) e
  **Organizzazione** con le materie e la loro barra. I titoli sono questi
  perche' "Le tue scadenze" metteva ansia
- Chi conta in **giorni** non ha una quantita' giornaliera: al posto del
  numero vede a che punto della passata e' ("8 di 9"). Prima usciva un
  puntino, che sembrava un guasto

Dalla prima versione discende comunque:

- Niente pulsante "Inizia una sessione" in evidenza: la sessione di quiz
  e' una delle sei cose che si possono fare, non *la* cosa
- Via le tessere con i numeri, via "A che punto sei", via "Tempo di
  studio". Aprire l'app non deve mettere ansia
- Al loro posto un saluto che cambia con l'ora e una riga che conta cosa
  ci si e' costruiti dentro ("Qui dentro ci sono 3 documenti, 14 domande
  d'esame e 10 casi clinici. Tutto roba che ti sei costruita.")
- Sei schede di sezione: Calendario, Organizzazione studio, Materiali,
  Domande esami, Quiz, Test SSM
- A lato le sole cose utili adesso: lo studio di oggi, gli impegni in
  arrivo, e per l'admin la coda di revisione

I numeri non sono spariti: stanno nelle Statistiche, dove uno ci va
quando li vuole vedere, invece di trovarseli in faccia all'apertura.

### Due trappole trovate rifacendo la home

**`.pannello a { display: flex }`** e' piu' specifica di una classe
sola, quindi mangiava il `display: block` delle righe nuove dentro i
pannelli. E' la terza volta che una regola larga ne batte una mirata
(le altre due: `[hidden]` e il doppio `.pannello`). Le regole della
colonna destra ora partono tutte da `.pannello`, ed e' scritto perche'.

**Il grigio chiaro `--testo-3` non arrivava al minimo di leggibilita'**
(AA, 4.5:1) su nessuno dei tre fondi: 3.03:1 sul piu' chiaro. E' il
colore dei conteggi, delle date e dei sottotitoli, cioe' di mezza app.
Scurito a `#6b6f7d` (chiaro) e schiarito a `#8c909c` (scuro). Aggiunto
anche `--accento-su-tenue`, perche' al buio il viola sul suo stesso
fondo tenue si fermava a 4.38:1.

### I quiz, a che servono

Gli esami di medicina qui sono orali. I quiz quindi non sono una prova:
servono a tenere la mente allenata in un ritaglio di tempo e a capire se
una cosa la si sa davvero. Il sottotitolo della pagina lo dice.

### Domande d'esame: chi ha fatto la domanda

Le domande sono quelle uscite davvero agli esami, chieste dai professori.
Da oggi si puo' segnare **quale professore** ha fatto una certa domanda,
e possono essere piu' d'uno: la tabella `domanda_professori` tiene una
riga per coppia domanda-professore, con un indice unico su
`(domanda_id, lower(trim(professore)))` perche' "Rossi" e " rossi " sono
la stessa persona. Ognuno puo' togliere solo i nomi che ha messo lui
(l'admin puo' togliere tutto). Il resto del contesto va nelle note, che
restano libere.

### La lista delle cose da fare vive dentro Akesis

C'e' una pagina **Suggerimenti** (voce nel menu, sotto "Altro"). Dentro
c'e' tutto quello che vorremmo che Akesis facesse e non fa ancora,
diviso in quattro stati: da fare, in lavorazione, fatto, messo da parte.

La tabella `suggerimenti` la scrivono tutti e la leggono tutti: un'idea
gia' proposta si vede, e non la si riscrive daccapo. Ognuno cambia lo
stato o cancella solo i propri (l'admin tutti). L'autore lo scrive il
database con un trigger, quindi nessuno puo' firmare un'idea col nome di
un altro: verificato impersonando l'account di prova.

E' stata riempita con le voci che stavano qui e in `PIANO.md`. **Questo
file resta il posto dove sta il perche'**: le pagine di Akesis dicono
cosa manca, gli appunti dicono cosa va deciso prima di costruirlo.

## Da fare quando sara' il momento

### Simulatore per il test SSM

**Chiesto da Giulia il 5 settembre 2026.** La pagina segnaposto esiste
gia' (`ssm.html`, voce "Test SSM" nel menu) ma e' ferma di proposito.

L'idea: raccogliere le domande dei concorsi di specializzazione degli
anni passati e permettere di esercitarsi con lo stesso formato della
prova vera.

Perche' e' ferma: non c'e' ancora il materiale. Giulia ha detto
esplicitamente che le domande non ci sono e che non ha ancora in mente
cosa metterci dentro.

Da decidere prima di costruirla:

- Da dove arrivano le domande e come si caricano, una alla volta o a blocchi
- Se una simulazione rispetta tempi e punteggio del concorso, oppure serve
  solo ad allenarsi
- Se conservare i risultati di ogni simulazione per vedere l'andamento
- Se le domande restano divise per anno, per materia, o per entrambe

**Ricordarglielo** quando ci sara' materiale da caricare, o quando si
cerchera' la prossima cosa da costruire.

---

### Ripasso a intervalli: cosa manca

La scala c'e' (1, 3, 7, 16, 35, 75 giorni) e il calcolo lo fa il
database. Restano aperte:

- Il tetto giornaliero e' fisso a 20 casi. Andrebbe deciso da Giulia,
  non da me.
- Non c'e' modo di dire "questo caso lo so gia', non me lo riproporre".
- Gli intervalli sono uguali per tutti. FSRS li adatterebbe alla persona,
  ma serve molto piu' storico di quello che abbiamo.

### Il calendario: cliccare un giorno

Cliccando un giorno si apre una **finestra** con dentro quello che c'e'
segnato, e ogni evento ha Modifica ed Elimina. In fondo "Aggiungi un
evento", gia' col giorno scelto. Prima era un riquadro sotto al
calendario e non si poteva correggere niente: si eliminava e si
rifaceva.

Due finestre non stanno aperte insieme: quella del giorno si chiude
quando si apre quella della data, e torna da sola quando questa si
chiude, salvata o annullata che sia.

Un appello appeso a un esame non si corregge da qui: la finestra lo
dice e rimanda alla scheda dell'esame. Due strade per la stessa cosa
sono un modo sicuro di creare disallineamenti.

### Organizzazione studio: come si vede adesso

**Rifatta il 6 settembre.** Giulia: "la schermata che si apre mi sembra
troppo confusionaria". Ogni materia era una scheda a tutta larghezza con
dentro la tabella delle passate, i ritmi, le barre e i tasti piu/meno;
tre materie facevano un muro di numeri tutti dello stesso peso.

Adesso:

- In cima **Oggi**, solo le materie e quanto tocca oggi
- Sotto, **una tessera stretta e verticale per materia**: nome, quanto
  materiale, cosa tocca oggi in evidenza, la barra, la percentuale e i
  giorni che restano. Niente altro
- La striscia **scorre di lato** quando le materie sono tante, invece di
  allungare la pagina: il primo colpo d'occhio resta uguale con tre
  materie o con dieci
- Il dettaglio, cioe' la parte fitta di numeri, sta **nella finestra
  della materia**: ci si va apposta, non ci si inciampa. Da li' anche
  Modifica ed Elimina

Sulla tessera c'e' la **percentuale**, non `fatte/totale`: tre passate su
450 pagine fanno 1350, ma nessuno ragiona cosi'. I numeri esatti stanno
nel dettaglio.

### Organizzazione studio: come ragiona adesso

Non piu' esami e lezioni, ma **una materia per volta**: quanto materiale
c'e' (450 pagine, 35 lezioni, oppure "mi prende 15 giorni"), in quanto
tempo, diviso in **passate**. Ogni passata rifa' tutto il materiale nei
giorni che le spettano: per questo le ripetizioni sono piu' fitte della
prima lettura, non perche' si legga piu' in fretta.

Esempio di Giulia, verificato: 450 pagine in un mese, 10 giorni di
prima lettura piu' 7 e 7 di ripetizioni, danno 45 pagine al giorno nella
prima e 64 in ciascuna delle altre.

Con l'unita' "giorni" non si calcola nessuna quantita' giornaliera: quel
modo di contare serve proprio a chi non conta.

**Modificare un piano si puo'** (bottone "Modifica" sulla scheda). Le
passate gia' salvate si aggiornano invece di essere rifatte da zero,
quindi quello che si e' gia' segnato come fatto resta. Se il materiale si
accorcia, il fatto viene limitato al nuovo totale. Aprendo la finestra si
vede la data vera di fine: scegliendo "fra tot giorni" la finestra
riparte da oggi, ed e' scritto nella finestra stessa.

Aperte:

- Le passate non si possono riordinare dopo
- La conversione dal modello precedente ha portato un piano solo
  ("Farmaco 2", 32 lezioni, 7 gennaio): era quello che c'era nel
  database al momento

### Scegliere l'appello: FATTO il 6 settembre

L'universita' propone piu' date per lo stesso esame e Giulia si presenta
a una. Nel calendario c'e' ora **La tua sessione**, sopra al mese: una
scheda per esame, con la data scelta e il conto alla rovescia, oppure
"3 appelli, da scegliere".

Tre decisioni sue, prese con una domanda diretta:

1. **Un esame e' un oggetto vero** (tabella `esami`), non un
   raggruppamento per nome. Crei l'esame, poi ci appendi le date. Un
   passaggio in piu', ma "Farma 2" e "Farmacologia 2" non possono
   scollegarsi.
2. **Gli appelli scartati spariscono dal calendario.** La regola sta in
   un punto solo (`getDateEsame` marca ogni data con `daMostrare`) e la
   applicano tutti: mese, Prossimamente, home, esportazione.
   **Dal 6 settembre spariscono anche dalla scheda dell'esame**: deciso
   l'appello si vede solo quello, il resto sta dietro a "Cambia
   appello". Giulia: "una volta scelto, devo vedere solo quello,
   altrimenti si fa confusione".
3. **Nessun legame automatico con l'organizzazione studio.** Scegliere
   l'appello non sposta la fine del piano: restano due cose separate,
   come ha chiesto lei.

Dettagli che discendono da queste:

- L'appello scelto cambia `tipo` da `appello` a `iscritta`, cosi' nel
  mese prende il colore di "Esame". Ripremerlo toglie la scelta e lo
  riporta ad appello: serve quando l'appello salta
- Il riquadro in fondo al calendario si chiama **Prossimamente** (non
  piu' "In arrivo"), e il conto alla rovescia sta in una pastiglia gia'
  scritta per esteso: "tra 12 giorni", "domani", "oggi". Prima era un
  numero nudo che aveva bisogno di una riga di spiegazione sotto al
  riquadro. Quella riga non c'e' piu'
- Due controlli stanno nel database, non nel browser: l'autore lo scrive
  un trigger, e un secondo trigger rifiuta un `appello_scelto` che non
  appartiene a quell'esame. Verificato impersonando l'account di prova
- Eliminando un esame se ne vanno le sue date (`on delete cascade`): una
  chiamata sola, non due che possono fallire a meta'

### Guasti trovati per strada (6 settembre)

- **`creaIcs` era usato ma mai importato** in `calendario.js`: il
  pulsante Esporta lanciava un errore appena premuto. Nessuna prova se
  ne accorgeva perche' succede solo al clic
- **Lo spazio sotto la testata** stava sul sottotitolo. Con tre pulsanti
  che vanno a capo, il sottotitolo non e' piu' l'ultima cosa della riga
  e la sezione seguente ci finiva addosso. Lo spazio ora appartiene alla
  testata

### La visione: bacheca piu' elenco di disponibili

Giulia ha spiegato dove vuole arrivare. In futuro, forse, un sistema
vendibile a studenti di qualunque universita' e corso di laurea. Adesso,
due cose distinte:

1. Una **bacheca di confronto**, dove si chiedono consigli sulla
   preparazione degli esami
2. Un **elenco di persone disponibili**, gratuitamente o a pagamento, ad
   aiutare a pianificare la sessione

Ha scartato l'idea intermedia (il piano condiviso da far commentare).

**Fatto:** l'oggetto sessione, che era il tassello mancante a monte.
Il suo esempio era "devo fare questi esami, le date sono queste": il
piano a un esame solo non bastava.

**Da chiedere prima di costruire l'elenco dei disponibili:**

- Se il denaro passa dentro Akesis o si accorda fuori. Cambia tutto:
  fatturazione, condizioni d'uso, chi risponde se qualcuno non paga
- Come si sa chi ha gia' dato un esame. Autodichiarato (semplice, e fra
  colleghi basta) oppure ricavato dal calendario (debole)
- Come avviene il contatto: messaggi dentro Akesis, oppure una richiesta
  che chi aiuta accetta e poi ci si sente fuori

### Ripasso pre-esame: SOSPESO per decisione di Giulia

Gemini aveva proposto: nei 14 giorni prima di un esame, dare priorita' ai
casi di quella materia dove si sbaglia di piu'. Giulia ha risposto
"lascia in sospeso che ci torniamo dopo, e da approfondire".

**Non e' stato costruito.** Il nodo da sciogliere: quel meccanismo
combatte con il ripasso a intervalli, che calcola quando rivedere un
caso. Scavalcarlo proprio prima dell'esame fa saltare il calcolo nel
momento in cui conta di piu', e dopo l'esame lascia tutto il resto
arretrato. Le tre strade erano: modalita' separata, coda scavalcata,
oppure mista.

Serve anche un campo materia vero sulle date del calendario: oggi il
titolo e' testo libero, quindi "Farma 2" non si lega a "Farmacologia 2".

### Sincronizzazione vera del calendario

L'esportazione `.ics` c'e' ma e' una fotografia: aggiungendo una data,
il calendario del telefono non lo sa. Per la sincronizzazione vera
servirebbe un indirizzo a cui Google e Apple si abbonano, cioe' una
funzione lato server e un indirizzo segreto che vale come chiave
permanente sul calendario di quella persona. Da valutare se ne vale la
pena.

### Calendario: cosa resta da decidere

Il calendario c'e' (griglia del mese, prossime date con conto alla
rovescia, appelli, esami a cui si e' iscritti, scadenze). Le date nascono
private, con una spunta per renderle visibili a tutti.

Copre anche tirocini, lezioni singole e preappelli, e il titolo puo'
restare vuoto. Ogni categoria ha il suo colore.

**Sul codice colore.** Contraddice la regola dell'accento unico che
avevamo bloccato: e' stata una scelta esplicita di Giulia. I sei colori
sono stati verificati con lo strumento della skill dei grafici (banda di
luminosita', saturazione, separazione per daltonismo, contrasto), con
valori distinti per chiaro e scuro. L'ordine in `TIPI_DATA` e' quello
verificato: **non va cambiato senza rifare la verifica**. "Altro" resta
senza colore di proposito.

Aperte:

- Giulia ha detto "io decido" quali colori: oggi la corrispondenza fra
  categoria e colore e' fissa. Renderla scegliibile e' possibile, ma
  vanno offerti solo i sei colori verificati
- Non si puo' ancora **modificare** una data: si elimina e si riscrive
- Nessun promemoria: la data si vede solo aprendo Akesis
- Le date condivise le puo' aggiungere chiunque. Se un giorno saranno
  tante, servira' capire chi puo' condividere e chi corregge gli errori

### Statistiche: cosa manca

La sezione Statistiche c'e' (tempo per sezione su 14 giorni, scala dei
ripassi, ripassi in arrivo, accuratezza per materia, contributi).
Restano aperte:

- Il conteggio del tempo sui **Materiali**: il database lo prevede gia'
  e la tabella lo mostra, ma nessuna pagina lo registra ancora. Va
  aggiunto a `materiali.js` se Giulia lo vuole
- Un obiettivo giornaliero, se lo vuole
- Un confronto fra periodi (questa settimana contro la scorsa)

## Aperte, in attesa di una decisione di Giulia

### Quanto semplificare le statistiche

Giulia ha detto che le statistiche vanno bene, ma che le farebbe "molto
meno articolate": tempo di utilizzo dell'app, tempo sui quiz, e basta.
Poi pero' ha lasciato "Dove vai peggio" e si e' ricreduta sul conteggio
del materiale caricato ("come non detto"). Restano cinque grafici. Da
chiederle quali tenere davvero prima di togliere qualcosa: una volta
tolto un grafico, il dato smette di accumularsi solo se si toglie anche
la registrazione, e quella conviene lasciarla comunque.

### Interrogazione nelle domande d'esame

Le domande arrivano una alla volta. Scelta fatta senza chiedere, per
somiglianza con l'orale vero. Se Giulia preferisce vederle tutte in
elenco, e' una modifica breve.

### Materiale protetto da chiave

Chi conosce la chiave puo' passarla a chiunque: protegge dagli sguardi
occasionali, non da una condivisione voluta. Chi ha fatto accesso puo'
anche provare chiavi a ripetizione: il calcolo e' lento di proposito,
quindi tentare a caso e' impraticabile, ma un blocco dopo N tentativi
sbagliati non c'e'. Da aggiungere se Giulia lo vuole.

---

## Come si collauda

C'e' una copia di prova che gira in locale con un database finto, in
`scratchpad/`. Si rifa' con `rifai-prova.sh` **dopo ogni modifica**,
altrimenti si collauda roba vecchia. Le suite:

- `prova.mjs` - home, organizzazione studio, suggerimenti (due altezze
  di schermo, perche' un bug si vedeva solo su schermo alto)
- `sessione.mjs` - esami e appelli
- `giorno.mjs` - la finestra di un giorno nel calendario e la striscia
  delle materie
- `sweep.mjs` - tutte le pagine si aprono senza errori
- `contrasto.mjs` - leggibilita' del testo, chiaro e scuro

I dati di prova si calcolano da oggi (i giorni liberi compresi):
scriverli fissi faceva passare o fallire le prove a seconda del giorno
della settimana.

---

## Da fare nel pannello Supabase (serve Giulia, non si puo' fare da qui)

- **Site URL** ancora impostato su `http://localhost:3000`. Va portato a
  `https://giuliaalbatiralongo.github.io/giuliaalbatiralongo-Giulia/`,
  altrimenti i link di conferma via email puntano nel vuoto.
- **Protezione password compromesse** disattivata. E' una spunta che
  confronta le password scelte con quelle finite in fughe di dati note.

---

## Dati di prova ancora in giro

Giulia ha detto di **riempire pure di dati finti** per poter provare le
cose ("tanto poi bisognera' togliere tutto per inserire quelle vere").
Tutto quello che ho aggiunto io porta la scritta `[prova]` nelle note,
tranne i piani, che non hanno un campo dove metterla.

**Quello che ha creato lei, e che non va toccato:**

- L'esame `Farmacologia 2` (nota: "Esame orale. Lungo, si passa da due
  docenti") con i suoi tre appelli
- La data `Inizio lezioni medicina`
- I piani `Farmaco 2` (32 lezioni) e `Gastroenterologia` (450 pagine)
- I 6 materiali, le 14 domande, i 10 casi clinici

**Quello che ho aggiunto io, da togliere quando lo dice:**

```sql
delete from date_esame where note like '%[prova]%';
delete from esami where note like '%[prova]%';
delete from piani where id = 6;  -- "Anatomia patologica", contato in giorni
```

L'ordine conta: prima le date, poi gli esami (le date appese a un esame
se ne andrebbero comunque in cascata, ma quelle sciolte no).

Restano da togliere, quando lo dira' lei:

- Account `prova.studente@akesis.test` (profilo "Prova01")
- 14 domande d'esame inventate e le loro note
- 4 proposte di materiale in coda di revisione, senza file vero dietro
- Il materiale "Prova 1" e il PDF "CORSIE"
- I 17 suggerimenti che ho scritto io nella pagina Suggerimenti

**Nota sui trigger:** riempire da SQL richiede di spegnere i trigger che
scrivono `autore := auth.uid()` (nullo fuori dal browser) e riaccenderli
subito dopo. Vale per `esami`, `date_esame`, `piani`, `suggerimenti`.

---

## Regole di lavoro concordate

- Spiegare i concetti prima di usarli nel codice
- Andare per passi piccoli, ognuno verificabile a schermo
- Chiedere invece di decidere da soli, quando la scelta e' sua
- Niente trattini lunghi, niente emoji, niente etichette colorate
- Un solo colore d'accento, nessuna sfumatura
- Alzare il numero di versione (`?v=`) di **ogni** riferimento a un file
  condiviso che cambia: e' stata la fonte piu' frequente di guasti
