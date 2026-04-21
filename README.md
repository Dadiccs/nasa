¨SUPSI 2026  
Corso d’interaction design, CV429.01  
Docenti: A. Gysin, G. Profeta  

Progetto 1: La conquista dello spazio

# LUNAR ARCHIVE EXPLORER
Autore: Daniele Falcone \
[LUNAR ARCHIVE EXPLORER](https://dadiccs.github.io/nasa/)


## Introduzione e tema
Il progetto esplora le possibilità dell'interattività digitale attraverso la simulazione visiva di elementi grafici dinamici. Il tema centrale riguarda la manipolazione di oggetti virtuali all'interno di uno spazio web, con l'obiettivo di creare un'esperienza utente fluida e coinvolgente che sfrutti le potenzialità del rendering accelerato.

## Riferimenti progettuali
Il principale riferimento concettuale e tecnico è rappresentato dal sistema di navigazione di Google Earth e, in particolare, dalla gestione delle sue fotosfere. Il progetto analizza il modo in cui l'utente interagisce con immagini panoramiche e superfici sferiche, cercando di replicare quel senso di immersività e continuità visiva. La ricerca si è focalizzata sulla transizione tra diversi stati dell'immagine e sulla capacità di esplorare contenuti visivi complessi attraverso movimenti fluidi e intuitivi.


## Design dell’interfaccia e modalità di interazione
L'interfaccia è progettata per essere essenziale e funzionale, riducendo al minimo gli elementi di disturbo per focalizzare l'attenzione sull'interazione diretta.

Interattività: L'utente può influenzare il comportamento degli elementi a schermo in tempo reale attraverso il puntatore o il touch.

Risposta visiva: Ogni input scatena una reazione immediata nel rendering, garantendo un feedback costante.

Fluidità: L'implementazione tecnica assicura che il passaggio tra le diverse texture avvenga senza artefatti visivi, mantenendo alta la qualità dell'esperienza d'uso.


## Tecnologia usata
Il sistema integra la potenza di calcolo grafico di Three.js con una gestione dinamica del DOM tramite JavaScript (ES6+). L'architettura è progettata per gestire il passaggio fluido tra l'ambiente 3D e il visualizzatore di immagini ad alta risoluzione attraverso i seguenti pilastri tecnici:

Context Switching: Mediante la manipolazione delle proprietà CSS (display), il sistema disattiva la pipeline di rendering WebGL per dare priorità al visualizzatore di fotosfere, ottimizzando l'uso di memoria e GPU.

Caricamento Dinamico e Reset: Gli asset visivi vengono caricati in modo asincrono. Al completamento del download, i parametri di trasformazione (imgPos, imgScale) vengono resettati per garantire una navigazione coerente e centrata su ogni nuovo sito.

Data Binding: La logica di sistema mappa i metadati estratti dal file di configurazione (coordinate geografiche e titoli delle missioni) direttamente nell'interfaccia utente, fornendo informazioni scientifiche in tempo reale.


```JavaScript
// Gestione ottimizzata delle texture per il rendering lunare
function enterStreetView(cfg) {
    // 1. Switch dell'interfaccia
    document.getElementById('canvas-container').style.display = 'none';
    document.getElementById('panorama').style.display = 'block';
    
    // 2. Caricamento dinamico dell'asset lunare
    const imgEl = document.getElementById('lunar-img');
    imgEl.src = cfg.file;
    
    // 3. Reset dei parametri di navigazione dell'immagine
    imgEl.onload = () => { 
        imgPos = 0; 
        imgScale = 1; 
        updateImgTransform(); 
    };
    
    // 4. Popolamento dei metadati della missione
    document.getElementById('d-id').innerText = cfg.titolo;
    document.getElementById('d-coords').innerText = `${cfg.lat.toFixed(3)}N / ${cfg.lon.toFixed(3)}E`;
}
```

## Target e contesto d’uso
Il progetto è rivolto a un pubblico trasversale di appassionati dello spazio, della NASA e delle storiche missioni Apollo. Grazie a un'interfaccia immediata, lo strumento è accessibile a chiunque desideri esplorare i siti di allunaggio in modo immersivo.

Il contesto d'uso ideale riguarda la divulgazione scientifica e i musei digitali, offrendo a ogni utente l'esperienza di navigare nell'archivio lunare come un operatore di missione.

