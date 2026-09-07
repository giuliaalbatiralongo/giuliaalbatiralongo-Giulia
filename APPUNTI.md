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

## Il piano di lavoro di Giulia (7 settembre)

Mandate tutte insieme: *"Queste idee ora le sviluppiamo passo passo.
Intanto te le mando."* Quindi qui stanno per intero, in ordine di
lavorazione, e si spuntano una alla volta.

### E. Il menu di fianco, sfoltito (7 settembre)

Due passaggi nello stesso giorno. Prima Quiz, Statistiche e Test SSM
sotto una voce sola; poi Giulia ha rifatto lo schema per intero, ed e'
questo che vale:

**Quattro voci sempre in vista**, quelle di ogni giorno:
Home, Calendario, Libretto, Organizzazione studio.

**Tre gruppi che si aprono**, per il resto:

| Gruppo | Dentro |
|---|---|
| Materiale | Materiali, Quiz, Domande esami |
| Valutazioni | Test SSM, Statistiche, Revisione |
| Altro | Servizi, Suggerimenti |

Chiusi, il menu e' **sette righe** invece di dodici. Le vecchie
etichette STUDIO / GESTIONE / ALTRO se ne sono andate: erano scritte
che occupavano una riga senza portare da nessuna parte, e adesso i
gruppi veri fanno il loro lavoro.

Ogni gruppo si apre **da solo quando ci sei dentro**, figli compresi
(carica-materiale sta sotto Materiali, casi e sessione sotto Quiz,
aggiungi-domanda sotto Domande esami). Il capogruppo si segna in
grassetto senza rubare il colore pieno alla pagina dove ti trovi
davvero: due cose accese allo stesso modo si contendono l'occhio.

Revisione tiene il suo `data-solo-admin`: chi non e' admin vede il
gruppo Valutazioni con due voci invece di tre.

**Su schermo stretto i gruppi si sciolgono.** Sotto gli 820px la barra
diventa una striscia di sole icone in orizzontale: li' una tendina non
ha senso, quindi i capigruppo spariscono e le loro voci entrano in fila
con le altre. Due cose imparate facendolo:

- `display: contents` su un `<details>` **non basta** per appiattirlo:
  il browser ci mette dentro un contenitore suo che resta in mezzo e le
  voci si impilano. Il gruppo deve diventare lui stesso una riga
  (`display: flex`)
- un `<details>` chiuso **il CSS non lo riapre**: il contenuto lo
  nasconde il browser per conto suo e nessuna regola ci arriva. Ad
  aprirli sotto gli 820px ci pensa `menu.js`, che ricorda lo stato e lo
  rimette tornando largo

**Perche' `menu.js` esiste.** Quella funzione era dentro `auth.js`, e il
collaudo non la vedeva: nei collaudi `auth.js` viene sostituito da un
finto, quindi il codice vero non veniva mai eseguito. Stessa trappola
dei piani e della modifica. Adesso sta in un modulo suo che **il finto
importa davvero**: se si rompe li', si rompe anche nel collaudo.

`menu.mjs` gira su **tutte** le pagine lette dalla cartella, non su un
elenco scritto a mano, e controlla anche la versione stretta.

**Da confermare:** Giulia nell'elenco ha scritto "Libretto Esami". Il
nome per esteso l'aveva pero' lasciato scegliere a me, e la voce e'
rimasta **Libretto**. Se lo rivuole lungo e' una parola.

### G. Il cestino (7 settembre)

Giulia ha cancellato un esame per sbaglio: *"non posso perdere tutto
quello che faccio se clicco le cose per sbaglio"*.

**Cancellare non toglie piu' la riga: le mette sopra una data.** Le
pagine leggono solo le righe senza quella data, il cestino solo quelle
che ce l'hanno. Dopo **trenta giorni** si cancella davvero, e lo
svuotamento dei vecchi si fa aprendo il cestino: non c'e' nessuno che
gira di notte, e va bene cosi'.

Ci finisce dentro **tutto quello che si cancella**: esami, date del
calendario, materie dell'organizzazione, casi clinici, domande d'esame,
materiali, suggerimenti. Restano cancellazioni vere solo i pezzi interni
di una modifica (le passate di un piano che si riscrivono, le note di
una domanda): non sono "cose cancellate", sono parti di un salvataggio.

`eliminato_con` tiene insieme quello che se n'e' andato **nello stesso
gesto**: un esame e le sue date se ne vanno insieme e insieme tornano.
Prima le date se le portava via il database (`on delete cascade`) e non
sarebbero mai tornate.

**Due reti, non una:**

1. la **striscia "Annulla"** che compare subito dopo, in basso, e sparisce
   da sola dopo otto secondi. Prende il caso vero -- te ne accorgi un
   secondo dopo il clic -- senza doverti spostare
2. il **cestino** vero e proprio, sotto "Altro", con Ripristina su ogni
   voce e "Svuota il cestino"

**Le freccette avanti/indietro non ci sono, ed e' una scelta.** Akesis e'
fatto di pagine separate che scrivono su un database condiviso: una
freccia potrebbe disfare una cancellazione, ma non un voto scritto, un
piano rifatto, o una data spostata dal telefono mentre eri sul portatile.
Sarebbe una freccia che a volte funziona e a volte no, che e' peggio di
non averla. Detto a Giulia, che ha scelto cestino + Annulla.

**Il file di un materiale non si cancella** quando la scheda va nel
cestino: una scheda che torna senza il suo file sarebbe tornata morta.

Nel finto database il cestino tiene **le righe**, non una funzione che
le rimette a posto: cosi' si puo' salvare e sopravvive al cambio pagina.
Con la funzione dentro il collaudo del cestino sarebbe stato finto.

### F. Le materie vengono dal libretto, ovunque (7 settembre)

Giulia: *"le materie devono poter essere selezionate dal manifesto,
quindi dal libretto, le stesse materie devono corrispondere, perche'
quelle sono le materie ufficiali"*. E, per l'organizzazione studio,
**solo l'anno in corso** con i suoi due semestri, piu' gli arretrati.

Prima ogni pagina aveva il suo campo "Materia": testo libero con accanto
un elenco di suggerimenti **scritto a mano dentro l'HTML**. Quell'elenco
era rimasto ai nomi degli esami finti, cancellati due giorni fa. E
soprattutto niente garantiva che il nome scritto in un caso clinico
fosse lo stesso del libretto: bastava una maiuscola diversa e i puntini
non si univano piu'.

Adesso c'e' **un campo solo, condiviso** (`scelta-materia.js`), che
prende le materie da `gruppiDiMaterie` in db.js:

| Dove | Cosa vede |
|---|---|
| Organizzazione studio | l'anno in corso, diviso per semestre, piu' gli **arretrati** (esami degli anni prima non ancora dati) |
| Casi clinici | tutte, divise per anno |
| Domande esami | tutte, divise per anno |

Due cose tenute apposta:

- **si puo' sempre scrivere una materia che nel manifesto non c'e'**:
  la voce "Altro" apre il campo libero. Giulia l'ha chiesto
  esplicitamente, e serve per i corsi a scelta
- **il campo di testo resta nel modulo** e continua a contenere il
  valore vero. Cosi' il codice che legge i moduli non e' cambiato, e se
  il menu non si carica si puo' comunque scrivere a mano

Nell'organizzazione, se l'anno non e' ancora stato scelto nel libretto
si indovina dagli esami dati, **con lo stesso conto del libretto**: due
pagine che indovinano in modo diverso sarebbero peggio di due pagine che
non indovinano.

### A. Il Libretto (era la pagina Esami)

1. **Il nome.** Non piu' "Esami". Giulia ha lasciato scegliere a me fra
   "Libretto universitario", "Libretto" e "Libretto esami": **Libretto**.
   E' la parola che userebbe a voce, di libretti qui dentro ce n'e' uno
   solo quindi "universitario" non aggiunge niente, e nel menu di fianco
   sta comoda accanto a Calendario e Materiali. **FATTO**
2. **La descrizione va in fondo.** La frase sotto al titolo ("Tutti gli
   esami del corso...") scende in fondo alla pagina. **FATTO**
3. **Il riepilogo diventa quadratini**, non piu' rettangoli, e si
   sposta accanto al pulsante "Nuovo esame". Dentro ogni quadratino due
   numeri incolonnati: i **CFU** sopra e gli **esami** sotto. Uno per i
   sostenuti, uno per il totale. **FATTO**
4. **L'anno in corso.** Giulia dice a che anno e' (il quarto); gli anni
   dopo si vedono **sfocati**, ma restano cliccabili e leggibili per
   intero. Sfocato vuol dire "non e' ancora affar tuo", non "chiuso".
   **FATTO.** L'anno sta sul profilo (`profili.anno_corso`), non nel
   browser, cosi' vale anche dal telefono. Se non l'ha mai scelto lo
   indovina dagli esami dati e **lo dice**, invece di far finta di
   saperlo. La sfocatura sta solo sulla riga chiusa e sparisce col
   passaggio del mouse, con la tastiera e all'apertura; con
   `prefers-reduced-motion` resta solo la trasparenza.
5. **Lo stato di ogni anno.** Gli anni passati dicono se sono finiti o
   se manca qualcosa; l'anno in corso dice **quanti esami mancano** per
   chiuderlo. **FATTO** (`statoAnno` in db.js).

### B. La media

6. **Voto e crediti per calcolare la media.** Sta **mezza nascosta**:
   un pulsante in fondo all'elenco degli anni ("Calcola la mia media")
   oppure "Libretto universitario". Si apre una finestra con tutti gli
   esami sostenuti, accanto a ognuno i crediti e il voto — che **lo
   scrive lei**, non i professori come nel libretto vero — e sotto o di
   lato **la media aritmetica e la media pesata**, tutte e due. **FATTO**

   Come e' venuta:

   - i voti si scrivono **in fila dentro la finestra**, senza aprire la
     scheda di ogni esame: e' l'unico posto dove serve farlo uno dietro
     l'altro. Se il salvataggio non passa, il numero a schermo **torna
     indietro** e il campo si segna: una media giusta calcolata su un
     voto che nel database non c'e' e' peggio di un errore visibile
   - **la lode vale 30 o 31**, si sceglie con due tasti e resta scelta
     (`profili.lode_come`). 30 e' come la conta l'ateneo per la media di
     carriera, 31 come se la contano fra studenti: sono due conti
     diversi, tutti e due usati, e si vedono con un clic
   - **quello che la media salta viene detto**: gli esami dati senza
     voto, e quelli senza crediti che restano fuori dalla pesata. Un
     numero che tace i suoi buchi e' un numero falso
   - la matematica ha un collaudo **senza browser** (`media.mjs` importa
     `calcolaMedie` e conta a mano): se sbaglia i conti si sa senza
     dover guardare uno schermo

### C. Organizzazione studio

**Da fare dopo che i dati veri sono dentro** (lo ha detto lei).

7. **Far vedere solo quello che serve adesso.** Il sistema chiede anno e
   semestre in corso ("quarto anno, primo semestre") e mostra **solo le
   materie di quel semestre**, piu' gli **arretrati** non ancora
   superati. I semestri futuri non si vedono: confondono.
8. **Tutto allineato ovunque.** Le stesse materie nel piano di studio,
   nel calendario con le loro date, e nel Libretto.
9. **I giorni di riposo** si scelgono qui dentro, cosi' il programma si
   divide sui giorni giusti.
10. **Pulizia:** vanno tolte alcune cose della pagina che non servono o
    non le piacciono. *Da farsi dire quali, una per una.*

### D. La finestra di una materia

11. **Solo tre voci**: "Data esame" (era "Esame"), "Pagine", "Lezioni".
    Via "Giorni di studio" e via "Giorni di materiale": poco chiare, e
    inutili dal momento in cui si sceglie in quanti giorni dividere.
    **FATTO**
12. **Un pulsante "Materiale"** che porta dritto ai materiali di quella
    materia, per caricare e ritrovare i file. **FATTO** — la pagina
    Materiali adesso capisce anche `?materia=`, e mostra tutti i
    documenti di quella materia raggruppati per categoria.
13. **"Programma di studio"** sotto, con i compiti del giorno e una
    **legenda a colori** in tre famiglie:
    - **colore 1, si legge:** prima lettura (o prima lettura con
      sottolineatura), seconda lettura
    - **colore 2, si ripete:** prima, seconda e terza ripetizione
    - **colore 3, si ripassa:** ripasso 1, 2 e 3

    **FATTO.** La famiglia e' una colonna vera (`piano_fasi.famiglia`) e
    **si sceglie** quando crei la passata, con un menu accanto al nome:
    indovinarla dal nome non basta, perche' il nome lo scrive lei e "1a
    lettura" o "riletturina" non li indovina nessuno. Le passate
    proposte nascono gia' con la famiglia giusta.

    Per quelle scritte prima che la colonna esistesse c'e' comunque un
    tentativo dal nome (`famigliaDiFase`), con "ripasso" controllato
    **prima** di "ripetizione", altrimenti "rip" le prenderebbe tutte e
    due. Se non si capisce **resta grigia**: meglio grigio che colorato
    a caso.

    Il colore sta sul **bordo sinistro** della passata, un filo, non un
    riempimento: riempire dieci righe di colore le rende tutte uguali.
    Il blocco di **oggi** invece si tinge tutto, perche' e' uno solo ed
    e' quello che devi vedere entrando.

### Un difetto trovato da Giulia (7 settembre)

*"il calcola la media non mi da il tasto fatto".* Vero: la finestra
della media era nata senza `finestra-fondo`, quindi l'unico modo di
uscire era la X in alto o il clic fuori. Sul telefono la X e' piccola e
lontana da dove finisci di leggere.

**Regola:** ogni finestra deve avere il modo di uscire **anche in
fondo**, dove finisce il contenuto, non solo in alto. Le altre ce
l'avevano tutte; questa l'avevo saltata perche' non ha un modulo da
salvare, ma "non c'e' niente da salvare" non vuol dire "non c'e' niente
da chiudere".

### Due difetti trovati facendo A (7 settembre)

- **Un parametro che copriva la variabile di fuori.**
  `function mostraSceltaAnno(indovinato)` aveva lo stesso nome della
  variabile di modulo: assegnarlo dentro non cambiava niente fuori, e la
  nota "lo sto indovinando" restava anche dopo che l'anno era stato
  scelto a mano. Il parametro se n'e' andato. Se una funzione legge una
  cosa di modulo, la legga e basta.
- **`select { width: 100% }`.** Giusto dentro una finestra, sbagliato
  per un menu in mezzo a una frase: il menu dell'anno si allargava per
  tutta la riga. E' la **quarta** regola larga che scavalca un caso
  stretto in questo progetto. Si scoprono solo guardando lo schermo, mai
  leggendo il codice.

### Cosa chiedere prima di partire

- ~~**punto 4:** l'anno in corso~~ **RISPOSTO:** sta sul profilo, e se
  non c'e' lo si indovina dicendolo. Giulia sta per iniziare il
  **quarto anno, primo semestre** (gia' scritto nel suo profilo).
- ~~**punto 6:** la lode~~ **RISPOSTO:** tutte e due, con un
  interruttore. Parte da 30.
- **punto 10:** quali cose della pagina Organizzazione studio non le
  piacciono
- ~~**punto 13:** la famiglia~~ **FATTO:** si sceglie da un menu, con il
  tentativo dal nome come rete per le passate vecchie.

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

### Gli errori si vedono a schermo (7 settembre)

Le pagine dicevano solo "non sono riuscita", e per sapere perche'
serviva la console del browser, che sul telefono non si apre. Ora c'e'
`ultimoErroreDb()` in `db.js`: un posto solo dove finisce l'ultimo
errore, messaggio piu' dettaglio piu' codice, e le pagine lo scrivono
accanto al fallimento. Il salvataggio di una materia e' anche dentro un
try/catch: se qualcosa esplode invece di tornare `null`, prima il
pulsante restava piantato su "Creazione" senza dire niente.

### Organizzazione studio: rifatta di nuovo (7 settembre)

Giulia: "ci sono troppe informazioni a primo impatto". Tre correzioni:

1. **Le tessere sono uguali fra loro.** Prima ognuna scriveva "450
   pagine" o "32 lezioni" o "9 giorni" secondo come era stata contata, e
   non si somigliavano. Ora dicono tutte la stessa cosa: nome, **data
   dell'esame** (o un trattino se non c'e' ancora), barra, percentuale.
   La data si cerca prima fra gli esami della sessione, poi fra le date
   sciolte con lo stesso titolo
2. **Il "5/9" non si capiva.** Non diceva se erano giorni, pagine o
   volte. Ora l'unita' e' sempre scritta: "180 pagine su 450", "6 giorni
   su 9"
3. **Si vede cosa hai gia' finito**, non solo dove sei adesso. Ogni
   passata e' finita, in corso o da fare, con il suo segno; in cima "Le
   passate: 2 finite su 3"

Nel dettaglio le voci sono sempre le stesse cinque (Esame, Giorni di
studio, Pagine, Lezioni, Passate) con un trattino dove non si applicano:
cosi' due materie si confrontano invece di avere ognuna la sua forma.

### La sezione Esami (7 settembre)

L'elenco vero del corso di laurea: anno, semestre, crediti, professore,
note, e se l'hai gia' dato con che voto.

**Non e' una tabella nuova.** Sono le stesse righe di `esami` che il
calendario usa per gli appelli e che l'organizzazione studio cerca per
nome: si sono solo aggiunte le colonne `corso`, `anno`, `semestre`,
`cfu`, `docente`, `sostenuto`, `voto`. Un esame sta scritto in un posto
solo, e quello che fai di qua si vede di la'. Era la richiesta di
Giulia: "questi esami qui sono gli stessi che poi utilizzero' nel
calendario".

Discende una cosa: **il calendario ora mostra solo gli esami che hanno
gia' delle date.** Con l'elenco completo del corso, la sessione si
sarebbe riempita di esami che adesso non riguardano nessuno. L'elenco
intero sta nella pagina Esami.

Dettagli:

- Il voto si chiede solo se l'esame risulta dato, e va da 18 a "30 e
  lode" (31 nel database, mai mostrato come numero)
- Un esame gia' dato resta scritto ma sbiadito: serve a ricordare che
  c'e' stato, non a essere fatto
- Il corso di laurea si ricopia dall'ultimo esame: non si riscrive
  "Medicina e chirurgia" trenta volte
- Chi non ha anno o semestre finisce in fondo, non sparisce

**Tutti e sei gli anni ci sono sempre**, anche quelli vuoti: un anno
che non compare sembra un anno che non esiste, e la casella vuota e' il
posto dove mettere le materie quando si sanno.

**Ogni anno e' una cartella che si apre** (7 settembre, richiesta di
Giulia: "metti tutti gli anni a scomparsa, unicamente selezionabili per
aprirli"). Chiusi, la pagina e' sei righe: si vede tutto il corso in un
colpo, con accanto quanti esami ci sono e quanti hanno gia' una data.
Aperto, c'e' l'anno che stai guardando e basta. Prima, con quattro anni
vuoti spalancati, erano dodici caselle identiche e gli anni che
contavano si perdevano in mezzo.

Sono `<details>`/`<summary>` veri, non finti: si aprono anche senza
JavaScript, la tastiera ci arriva da sola e il browser sa che sono
sezioni richiudibili. Quali anni erano aperti se lo ricorda il browser
(`localStorage`, chiave `akesis-anni-aperti`): se ogni volta si
richiudesse tutto, riaprire il proprio anno trenta volte al giorno
stanca. Se il browser non lascia salvare (finestra anonima, dati
bloccati) vale solo per la visita: e' un fastidio, non un errore.

**Trappola trovata qui.** Dentro un `<details>` chiuso Chrome non mette
`display: none`: usa `content-visibility`, cosi' l'apertura si puo'
animare. Vuol dire che `offsetParent`, `getBoundingClientRect()` e le
altre misure restano quelle dell'ultima volta e giurano che si vede
tutto. Il collaudo ci era cascato e segnalava un guasto che non
esisteva. Per chiedere "si vede davvero?" si usa
`elemento.checkVisibility()`, che risponde bene in tutti e due i casi.

Riempiti dal dettato di Giulia:

- **Terzo anno.** Primo semestre: Fisiopatologia, Semeiotica. Secondo:
  Anatopato 1, Cardiopneumo, Endonefro, Farmacologia 1, DIR. I nomi sono
  le sue abbreviazioni, non i nomi per esteso: riconoscerli a colpo
  d'occhio conta piu' della forma ufficiale
- **Quarto anno, primo semestre.** Farmacologia 2, Gastroenterologia,
  Malattie infettive, Organi di senso, Microbiologia

**Da confermare:** su "microbiologia pubblica" del dettato ho messo
"Microbiologia" da sola. Potrebbero essere due esami, o "Igiene e
sanita' pubblica".

### Il piano di studi vero, dal manifesto UniGe (7 settembre)

Giulia ha scaricato il PDF del **Manifesto degli Studi A.A. 2026/2027,
corso 8745 Medicina e Chirurgia** (da qui la rete verso `unige.it` e'
chiusa, quindi il link non si poteva aprire: l'ha scaricato lei).

Estratto a mano dal PDF: niente `pdftotext` in questa macchina, e
`pypdf` non parte. Si decomprimono i flussi con `zlib` e si rileggono
gli operatori di testo. Attenzione al punto in cui ci ero cascato: **ogni
operatore che non riconosci deve svuotare la pila**, altrimenti i numeri
di `cm` restano dentro e le coordinate saltano.

Il manifesto ha due livelli, e vanno tenuti distinti:

- il **corso integrato**, che e' l'esame che dai (codice nudo, poi il
  nome, poi i crediti totali): `67415 PATOLOGIA INTEGRATA APPARATO
  GASTROENTERICO 4`
- i **moduli** che lo compongono, uno per docente o per materia (codice
  con il trattino): `67416 - CHIRURGIA GENERALE (1° Semestre)`

In Akesis va **il corso integrato**: e' quello che si prepara e che
prende un voto. I moduli finiscono nella nota, quando aiutano a capire
cosa c'e' dentro.

Il primo PDF copriva **solo dal terzo al sesto anno** (le coorti gia'
iscritte: 3° = coorte 2024/2025, 4° = 2023/2024, e cosi' via). Primo e
secondo anno non c'erano, e non me li sono inventati: Giulia ha
scaricato il **secondo PDF** (manifesto 11887) e ci sono anche quelli.

Adesso il corso c'e' tutto: **47 esami, 362 crediti**. Medicina ne fa
360, quindi il conto torna: e' la prova migliore che l'estrazione dal
PDF non ha perso pezzi per strada.

**Un avvertimento che va detto a Giulia.** Il primo anno del PDF e' la
**coorte 2026/2027**, cioe' l'ordinamento nuovo: si vede dai codici di
settore, che sono quelli nuovi (BIOS-, PHYS-, MEDS-, ANGL-) invece dei
vecchi MED/ e BIO/. Giulia e' al quarto anno, coorte 2023/2024: il
primo e il secondo anno lei li ha fatti con un ordinamento diverso, e
qualche nome puo' non corrispondere a quello che ha davvero dato.

Due cose da tenere a mente in quel PDF:

- **"A | B" dopo il nome sono i canali**, non parte del titolo: Chimica,
  Fisica e Biologia si fanno in due canali paralleli
- **Scienze umane e' un esame solo a cavallo di due anni**: antropologia,
  storia della medicina, informatica e inglese al primo; psicologia
  generale e clinica al secondo. Sta scritto una volta sola, al primo
  anno, con la nota che lo dice. Come Farmacologia I e II, che invece il
  manifesto separa per nome e quindi restano due righe

Scelte fatte con lei (domande poste prima di toccare i dati):

- **nomi ufficiali**, non le sue abbreviazioni. Il manifesto pero' urla
  in maiuscolo, e in un'interfaccia il maiuscolo non si legge: si
  abbassa, tenendo in piedi i numeri romani e le sigle (`Farmacologia
  II`, non `Farmacologia Ii`). Il nome che usava lei resta nella nota,
  cosi' "DIR" non si perde
- **tirocini, ADE e preparazione tesi ci sono**, per vedere il carico
  vero. Nella nota c'e' scritto che non prendono un voto
- **quarto anno rifatto dal manifesto**. Lei aveva accettato di perdere
  le date degli appelli: non e' stato necessario. Invece di cancellare e
  riscrivere, le righe che aveva gia' sono state **rinominate** nella
  loro voce del manifesto (Gastroenterologia -> Patologia integrata
  apparato gastroenterico, e cosi' via). L'elenco finisce identico a
  quello del manifesto e i suoi appelli restano attaccati

Il ripristino sta in `backup-esami-2026-09-06.sql` (nel progetto): rimette i
nomi di prima. Le voci nuove si riconoscono dalla nota
`[manifesto UniGe 2026/2027]`.

**Rimasto in sospeso, da dire a Giulia:**

- i suoi **piani di studio** si agganciano agli esami **per nome**
  ("Farmaco 2", "Gastroenterologia", "Anatomia patologica"). Rinominati
  gli esami, quel filo si e' rotto: vanno rinominati anche i piani, ma
  sono parole scritte da lei e non le tocco senza chiedere
- c'e' un **doppione**: "Anatomia patologica" (senza anno) e "Anatomia
  patologica e correlazioni anatomo-cliniche", tutti e due con la stessa
  iscrizione al 16 ottobre. Non ho cancellato niente
- **"Anatopato 1"** lei lo mette al terzo anno secondo semestre, ma nel
  manifesto 2026/2027 Anatomia patologica sta al quarto come annuale.
  Lasciato dove l'ha messo lei, con una nota

### L'esame e la materia sono la stessa cosa (7 settembre)

Giulia: scrivevo la data d'esame nell'organizzazione studio, si salvava
l'unita' ma "non mi risulta che quella materia abbia associato l'esame".

**Il campo mentiva.** Si chiamava "Giorno dell'esame" ma scriveva solo
`fine`, cioe' la fine della finestra di studio: nel calendario non
finiva niente, e la tessera continuava a dire "Esame —" perche' cercava
un esame che nessuno aveva creato.

Ora il legame c'e' nei due versi, e il collante e' **il nome**: e' cosi'
che ci ragiona chi lo usa, "Farmacologia 2" e' Farmacologia 2 dovunque
la scriva.

- **Organizzazione -> calendario:** salvando una materia con la data
  d'esame, `assicuraEsameDiMateria` crea l'esame nel calendario con quel
  giorno gia' scelto. Se l'esame c'e' gia', non ne apre un altro:
  sceglie l'appello con quella data se esiste, altrimenti **sposta**
  quello scelto, perche' cambiare la data non vuol dire che
  l'universita' ne ha aperto uno nuovo
- **Calendario -> organizzazione:** scrivendo il nome di una materia che
  ha gia' un esame deciso, la data si compila da sola; e la tessera e la
  scheda la mostrano gia' da prima
- Se la finestra di studio finisce **dopo** la data d'esame, la scheda
  lo dice: non e' un errore, ma e' quasi sempre una svista

Otto casi provati in `ponte.mjs`, compresi quelli che fanno danno: la
stessa data due volte, il nome con maiuscole e spazi diversi, la data
cambiata su un esame gia' deciso, la data sciolta senza esame.

**Il database finto adesso ricorda.** Prima si azzerava cambiando
pagina, quindi una prova che salvava su una pagina e controllava
sull'altra non diceva niente: e infatti il primo giro passava a vuoto.
Ora le righe stanno in `sessionStorage`, come starebbero in Postgres.

### La parola "passate" e' sparita (7 settembre)

Giulia: "Con passate che cosa intendi? Non capisco il significato della
parola". Voleva dire *un giro completo sul materiale*: leggere tutte le
450 pagine e' una passata, ripeterle tutte e' un'altra.

Le ho proposto quattro alternative (giri, letture, ripassi, o tenerla
spiegandola) e ha risposto: **"nessuna in realta'. La toglierei
completamente. Tanto non serve."** Aveva ragione: i nomi delle singole
righe (Prima lettura, Prima ripetizione, Ripasso) bastano da soli, il
nome collettivo non serviva a niente.

Sparita da tutte le scritte: "Passate" diventa "Come dividi i giorni",
"Aggiungi una passata" diventa "Aggiungine un'altra", "Le passate
chiedono 43 giorni" diventa "In tutto chiedono 43 giorni", e la riga
"Passate: 3" nella scheda e' stata tolta perche' l'elenco sotto le
mostra gia'. Nei nomi delle classi CSS e nei commenti resta: li' non la
legge nessuno.

C'e' una prova che lo controlla (`parole.mjs`): apre le pagine e le
finestre e cerca la parola nel testo visibile. Una parola che ferma chi
legge ha fallito il suo unico compito, e questa non deve tornare.

### La divisione proposta (7 settembre)

Creando una materia non si parte piu' da tre passate fisse: `db.js`
propone come dividere i giorni. La regola, chiesta da Giulia:

- **La prima lettura si prende circa un terzo** del tempo di studio
- **Il resto va alle ripetizioni e ai ripassi, in pezzi sempre piu'
  corti**: rileggere una cosa gia' vista costa meno della prima volta
- **Quante passate dipende dal tempo**: in cinque giorni non ha senso
  promettere quattro giri, in cinquanta si'

Trenta giorni danno 11, 8, 6, 5. Cinquanta danno 17, 12, 9, 7, 5.

I pesi sono scritti a mano, non calcolati: con tre passate "un terzo
alla prima lettura" e "le altre sempre piu' corte" non possono valere
tutti e due insieme, e allora la prima lettura si prende un po' di piu'.
Con quattro o cinque tornano entrambi.

La proposta compare come **banner dentro il modulo**, ma solo quando
dice qualcosa di diverso da quello che c'e' gia' scritto: un banner che
ripete il modulo e' solo rumore. Si applica con un tasto e resta
modificabile riga per riga.

**Un errore di ordine, trovato dalle prove:** all'apertura le passate
venivano generate prima di impostare i giorni liberi, quindi la proposta
nasceva su un numero di giorni sbagliato e il banner compariva subito
per contraddire quello che aveva appena scritto lui stesso.

### Piu' misure per la stessa materia, e cosa ripassare (7 settembre)

Giulia ha scelto: **piu' misure insieme** e **tutti i modi di dire cosa
ripassare**.

Una materia ora ha tre colonne facoltative (`pagine`, `lezioni`,
`giorni_materiale`): 450 pagine E 32 lezioni sono la stessa materia
contata in due modi. `unita` non dice piu' "come la conti" ma **su quale
misura si divide lo studio giornaliero**, e `quantita` e' la copia di
quella scelta, tenuta allineata da un trigger (`allinea_quantita`)
perche' i due numeri non possano raccontare cose diverse. Il trigger
rifiuta anche di dividere per una misura che non e' stata scritta.

Nel modulo il menu "Dividi lo studio per" offre **solo le misure
riempite**: proporre "lezioni" quando le lezioni non ci sono porta solo
a un errore dopo. Nella scheda si vedono tutte e tre, con un segno su
quella che comanda il conto.

Ogni passata ha `argomenti` (testo libero) e `da_pagina`/`a_pagina`.
Nel modulo stanno dentro un "Cosa ripassare" chiuso di default:
tenerlo aperto raddoppiava l'altezza per campi che spesso restano
vuoti. Nel dettaglio la passata scrive "pagine 120-300 · Farmaci
cardiovascolari".

**Resta da fare la terza strada:** l'elenco di argomenti della materia
con le spunte per passata. Serve una tabella per gli argomenti e una
per gli abbinamenti; le altre due funzionano gia' senza.

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

### Il guasto della creazione dei piani (7 settembre)

Creare una materia nuova dava errore. Colpa mia, nata con la modifica
dei piani: da allora le righe delle passate si portano dietro l'`id`
(serve per correggerle), e `inserisciPiano` le passava al database con
`{...f}`. Alla creazione quell'id e' nullo, e Postgres rifiuta:

```
cannot insert a non-DEFAULT value into column "id"
Column "id" is an identity column defined as GENERATED ALWAYS
```

**La radice non e' l'id, e' lo spargimento.** `{...oggettoDelChiamante}`
dentro un insert manda al database qualunque campo la pagina si sia
portata dietro. Ora i campi si elencano a mano, in `inserisciPiano` e in
`aggiungiAppello` che aveva lo stesso schema.

**Perche' le prove non l'hanno visto.** Il database finto sostituiva
proprio la funzione da collaudare, quindi il codice che sbagliava non
veniva mai eseguito. Aggiunta `livello-dati.mjs`: fa girare il db.js
**vero** contro un client-spia che registra cosa viene scritto, e
controlla che nessuna riga nuova porti `id` o `created_at`. Verificato
che diventa rossa col codice sbagliato.

### Il guasto della modifica dei piani (7 settembre)

Giulia: "mi da errore quando provo a modificare i piani dello studio e
mi blocca il salvataggio delle modifiche".

Postgres diceva, per esteso:

    null value in column "fatte" of relation "piano_fasi"
    violates not-null constraint

Perche'. Salvando una modifica, `aggiornaPiano` limita quello che hai
gia' fatto al totale del materiale, cosi' la barra non va oltre il suo
binario. Il totale lo leggeva da `piano.quantita` -- solo che quel campo
la pagina non lo manda mai: nel database e' il trigger `allinea_quantita`
a ricavarlo dall'unita' scelta. Quindi era `undefined`,
`Math.min(3, undefined)` fa `NaN`, e `NaN` diventa `null` appena esce
di casa in JSON. Ma `fatte` e' NOT NULL, e il salvataggio si piantava.

Colpiva ogni materia divisa **per pagine o per lezioni**. Quelle divise
per giorni funzionavano, perche' li' il totale era gia' un altro
(`fase.giorni`): ecco perche' l'errore sembrava capriccioso.

Corretto rifacendo in `db.js` lo stesso conto del trigger
(`quantitaPiano`), e con una rete sotto: se il totale proprio non si sa,
il fatto si lascia com'e' invece di azzerarlo.

**Perche' i collaudi nel browser non l'hanno visto.** Perche' il finto
database *sostituisce* `aggiornaPiano`: la funzione rotta non veniva
mai eseguita. E' lo stesso motivo per cui era sfuggito il guasto della
creazione, ed e' esattamente il buco per cui esiste `livello-dati.mjs`,
che il db.js vero lo esegue davvero con un client spia. La prova nuova
sta li', ed e' stata vista fallire prima di correggere.

Due cose rese piu' severe di conseguenza:

- il finto `aggiornaPiano` adesso rifiuta un `fatte` che non sia intero,
  come fa Postgres, e la modifica **resta scritta** (prima restituiva la
  riga nuova ma non la salvava: riaprendo si ritrovava quella di prima)
- la spia di `livello-dati.mjs` registra anche gli `update`, non solo
  gli `insert`

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

## Il guasto che ha spento tutto (7 settembre)

Giulia: *"Non carica piu' nulla. Non riesco a vedere ne il libretto, ne
il calendario ne la home."*

Un'ora prima avevo spostato `preparaGruppiDelMenu` da `auth.js` a
`menu.js`. Dovevo aggiungere in auth.js la riga che lo importa: l'ho
scritta, ma ancorata a una `import { createClient }` che **in auth.js non
c'e'** (li' si importa `supabase`). La sostituzione non ha trovato niente
e non ha scritto niente, e non avevo messo l'assert che lo avrebbe detto.

Risultato: auth.js chiamava una funzione che non aveva. `proteggiPagina`
moriva li', e siccome **ogni pagina la aspetta**, non si apriva piu'
niente.

**Perche' i collaudi non l'hanno visto.** Perche' sostituiscono proprio
`auth.js` con un finto: il codice vero non veniva eseguito. E' la stessa
trappola dei due guasti dei piani, quella di cui avevo appena scritto
negli appunti — e ci sono cascato **un commit dopo averla descritta**.

**Due lezioni, tutte e due gia' pagate:**

1. **Ogni sostituzione fatta a macchina va assertata.** `assert
   s.count(vecchio) == 1` prima di sostituire. Dove l'avevo messo non e'
   mai successo niente; dove l'ho saltato e' successo questo.
2. **Un finto che copre un file intero e' un buco nero.** Tutto quello
   che sta li' dentro non e' collaudato. Le cose che non c'entrano con
   l'autenticazione devono stare fuori da auth.js — ed e' per questo che
   `menu.js` esiste.

**Le difese messe dopo** (`./controlla.sh`, da lanciare sempre prima di
mandare online):

1. **eslint con `no-undef`** sui file veri: prende ogni nome usato e mai
   importato. E' esattamente questo guasto
2. **`controlla-nomi.mjs`**: prende il caso gemello, cioe' importare un
   nome che dall'altra parte non c'e'

Tutte e due viste **fallire** rimettendo il guasto, e poi tornare verdi.

---

## Come si collauda

**Prima di tutto, e sempre prima di mandare online:**

    ./controlla.sh

Non serve il browser. Controlla i file **veri** del progetto, quelli che
nei collaudi vengono sostituiti dai finti e quindi non verrebbero mai
eseguiti. Ci vuole un secondo, e prende la classe di guasto che il 7
settembre ha spento il sito.

C'e' una copia di prova che gira in locale con un database finto, in
`scratchpad/`. Si rifa' con `rifai-prova.sh` **dopo ogni modifica**,
altrimenti si collauda roba vecchia. Le suite:

- `prova.mjs` - home, organizzazione studio, suggerimenti (due altezze
  di schermo, perche' un bug si vedeva solo su schermo alto)
- `sessione.mjs` - esami e appelli
- `giorno.mjs` - la finestra di un giorno nel calendario e la striscia
  delle materie
- `esami-ui.mjs` - la pagina Esami e il suo legame col calendario
- `ponte.mjs` - il legame fra materie ed esami, sul db.js vero
- `ponte-ui.mjs` - lo stesso legame visto dalle pagine, nei due versi
- `parole.mjs` - parole bandite dall'interfaccia
- `proposta.mjs` - il conto della divisione proposta, con numeri fissi
- `proposta-ui.mjs` - il banner della proposta nel modulo
- `livello-dati.mjs` - cosa scrive davvero `db.js` nel database
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

## Solo cose vere (7 settembre)

Giulia: *"e importante resettare e cancellare tutti i dati fittizi
inseriti in precedenza per fare delle prove... Da questo momento in poi,
il sito dovra contenere e accogliere solo informazioni veritiere."*

**Regola d'ora in poi: dentro Akesis non si mette niente di inventato.**
Non piu' casi clinici verosimili, non piu' domande d'esame plausibili,
non piu' appelli finti per far vedere come viene. Se serve provare una
cosa, si prova nel finto database del collaudo, che sta fuori dal
progetto vero e non lo tocca nessuno.

Il motivo non e' l'ordine: e' che una vignetta clinica scritta da me
sembra vera, e su Akesis Giulia ci studia. Un caso plausibile ma non
verificato e' peggio di un caso assente.

**Cancellato il 7 settembre:**

| Cosa | Quante |
|---|---|
| Casi clinici inventati (con risposte e avanzamento) | 10 |
| Domande d'esame inventate, con le loro note | 14 |
| Schede di materiale senza un file vero dietro | 4 |
| Date segnate `[prova]`, nomi finti, un doppione | 12 |
| Piani di studio, tutti quanti | 8 |
| Esami fuori dal manifesto (Anatopato 1, un doppione) | 2 |
| Ore di studio finte | 2 |

**Rimasto, ed e' tutto vero:**

- **46 esami**, tutti dal manifesto UniGe, uno per ogni riga del corso.
  Ognuno porta scritto in nota da dove viene: `[manifesto UniGe
  2026/2027]`. Si controlla con una riga di SQL che non ce ne siano
  altri
- **5 date**: i tre appelli di Farmacologia II, l'iscrizione ad Anatomia
  patologica, l'inizio delle lezioni. Le ha messe lei
- **1 materiale**: CORSIE, l'unico con un file vero dietro

**Poi, il 7 settembre:** Giulia ha detto che **i primi due anni li ha
gia' dati**. Segnati sostenuti tutti e tredici; il voto no, quello lo
scrive lei dalla finestra della media. Con il terzo, che era gia'
segnato, fanno **19 esami e 166 crediti su 362**.
- **17 suggerimenti**: sono idee, non fatti sul suo corso. Restano

Le date si portavano dietro il nome della materia scritto a mano dentro
la riga, e dopo il cambio di nomi si leggeva un esame che non esiste
piu': adesso si allineano da sole a quello dell'esame a cui sono appese.

Il backup completo di prima della pulizia e' stato mandato a Giulia
come file. **Non sta nel progetto**: contiene le impronte delle chiavi
di accesso ai materiali, e il progetto e' pubblico perche' cosi' vuole
GitHub Pages.

**Poi ha deciso anche il resto:** via "Prova 1", via tutti e due i
piani di studio (erano di prova pure quelli), l'account di prova
`prova.studente@akesis.test` resta.

Quindi **l'organizzazione studio adesso e' vuota**, ed e' giusto cosi':
il primo piano che ci nascera' dentro sara' su una materia vera, scelta
da un elenco vero.

**Una cosa che da qui non si puo' fare.** Cancellando "Prova 1" e' via
la scheda, ma il PDF da 22 MB e' rimasto nell'archivio: Supabase
proibisce di cancellare i file con una riga di SQL

    ERROR: Direct deletion from storage tables is not allowed.
    Use the Storage API instead.

ed e' una protezione giusta, serve a non lasciare file orfani. Dentro
Akesis il pulsante Elimina toglie tutti e due (`eliminaMateriale` in
db.js cancella la riga e poi il file), ma la riga ormai non c'e' piu'.
Il file sta nel secchio `dispense`, che e' **privato**: nessuno ci
arriva da fuori, occupa solo spazio. Si toglie dal pannello Supabase,
Storage, `dispense`, cartella `38e2a8ed-.../`.

**Lezione per la prossima volta:** un materiale si cancella dall'app,
non da SQL, altrimenti il file resta indietro.

## Regole di lavoro concordate

- Spiegare i concetti prima di usarli nel codice
- Andare per passi piccoli, ognuno verificabile a schermo
- Chiedere invece di decidere da soli, quando la scelta e' sua
- Niente trattini lunghi, niente emoji, niente etichette colorate
- Un solo colore d'accento, nessuna sfumatura
- Alzare il numero di versione (`?v=`) di **ogni** riferimento a un file
  condiviso che cambia: e' stata la fonte piu' frequente di guasti
- **Lanciare `./controlla.sh` prima di mandare online.** I collaudi nel
  browser sostituiscono auth.js e db.js: quello che sta li' dentro non
  lo vedono
- **Assertare ogni sostituzione fatta a macchina** (`assert
  s.count(vecchio) == 1`): una sostituzione che non trova niente e non
  lo dice ha gia' spento il sito una volta
- Ogni finestra deve avere il modo di uscire **anche in fondo**, non
  solo la X in alto: sul telefono la X e' piccola e sta lontana da dove
  finisci di leggere
- **Dentro Akesis non entra niente di inventato.** Niente casi clinici
  verosimili, niente domande d'esame plausibili, niente appelli finti per
  far vedere come viene. Per provare c'e' il finto database del
  collaudo. Sopra ci studia, e una cosa falsa che sembra vera e' peggio
  di una cosa che manca
