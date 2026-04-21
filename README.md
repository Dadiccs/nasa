¨SUPSI 2026  
Corso d’interaction design, CV429.01  
Docenti: A. Gysin, G. Profeta  

Progetto 1: La conquista dello spazio

# Lunar Recon System
Autore: Daniele Falcone \
[Titolo progetto](https://dadiccs.github.io/nasa/)


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
Lo sviluppo si avvale delle moderne tecnologie web per il rendering grafico avanzato. Il software è basato su JavaScript (ES6+) e utilizza le API WebGL (tramite la libreria Three.js) per la gestione della pipeline 3D.

Le scelte tecniche principali riguardano l'ottimizzazione delle risorse grafiche:

Caricamento Texture: L'uso di oggetti Image() permette un caricamento asincrono degli asset, vincolando la creazione della texture al completamento del download.

Ottimizzazione delle prestazioni: Il sistema verifica se le dimensioni delle immagini sono potenze di due ("Power of 2"); in caso positivo, vengono generate le Mipmap per migliorare la resa visiva a diverse risoluzioni.

Gestione Fallback: Per immagini con dimensioni non standard, vengono applicati i parametri CLAMP_TO_EDGE e LINEAR, garantendo un rendering corretto e privo di distorsioni sui bordi.


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

