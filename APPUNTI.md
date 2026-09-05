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

Da questa decisione discende come e' fatta la home:

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

### Prossimo pezzo del calendario: scegliere l'appello

Giulia lo ha descritto e va costruito **nel calendario**, non qui:
l'universita' propone piu' date per ogni esame, e lei sceglie a quale
appello presentarsi (Farmacologia il 7 gennaio, Gastro il secondo
appello il 18, e cosi' via). Le date le inserira' lei a mano.

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

## Da fare nel pannello Supabase (serve Giulia, non si puo' fare da qui)

- **Site URL** ancora impostato su `http://localhost:3000`. Va portato a
  `https://giuliaalbatiralongo.github.io/giuliaalbatiralongo-Giulia/`,
  altrimenti i link di conferma via email puntano nel vuoto.
- **Protezione password compromesse** disattivata. E' una spunta che
  confronta le password scelte con quelle finite in fughe di dati note.

---

## Dati di prova ancora in giro

Giulia ha chiesto di **non cancellare niente** finche' non lo dice lei.
Quando lo dira', da togliere:

- Account `prova.studente@akesis.test` (profilo "Prova01")
- 14 domande d'esame inventate e le loro note
- 4 proposte di materiale in coda di revisione, senza file vero dietro
- Il materiale "Prova 1" e il PDF "CORSIE"

---

## Regole di lavoro concordate

- Spiegare i concetti prima di usarli nel codice
- Andare per passi piccoli, ognuno verificabile a schermo
- Chiedere invece di decidere da soli, quando la scelta e' sua
- Niente trattini lunghi, niente emoji, niente etichette colorate
- Un solo colore d'accento, nessuna sfumatura
- Alzare il numero di versione (`?v=`) di **ogni** riferimento a un file
  condiviso che cambia: e' stata la fonte piu' frequente di guasti
