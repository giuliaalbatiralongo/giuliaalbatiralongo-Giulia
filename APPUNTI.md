# Appunti di Akesis

Cose decise, cose rimaste aperte, cose da fare quando sara' il momento.
Questo file esiste perche' le conversazioni finiscono e i file restano:
quando riprendiamo il lavoro, si riparte da qui.

---

> Gli spunti per le prossime funzioni stanno in `IDEE.md`, insieme a
> cosa fanno le piattaforme concorrenti e a cosa sbagliano.
> L'ordine di lavoro delle sette idee scelte sta in `PIANO.md`.

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

### Frase di apertura in home

Ora dice "Tutto quello che studi, in un posto solo." Giulia ha chiesto
qualcosa di breve e d'impatto, e ha precisato che **Akesis non nasce solo
per i casi clinici**. La frase attuale e' volutamente ampia. Se non
convince, se ne provano altre: la spiegazione lunga di cosa sia Akesis
andra' comunque da un'altra parte, non nel banner.

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
