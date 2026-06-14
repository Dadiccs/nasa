import os
import json
from PIL import Image

def update_json_dimensions():
    json_path = 'config.json'
    
    if not os.path.exists(json_path):
        print(f"Errore: Il file '{json_path}' non esiste.")
        return

    # 1. Carica il JSON attuale per non perdere i dati esistenti (hotspots, titoli, coordinate)
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("--- INIZIO AGGIORNAMENTO DIMENSIONI IMMAGINI ---")
    
    updated_count = 0

    # 2. Cicla sulle missioni presenti nel file JSON
    for missione in data.get("missioni", []):
        # Prendiamo il percorso dal campo "file" (es. "photosphere/11_1.jpg")
        base_file = missione.get("file", "")
        if not base_file:
            continue
            
        # Estraiamo il nome del file pulito (es. "11_1.jpg")
        file_name = base_file.replace('photosphere/', '')
        # Estraiamo il numero della missione prima dell'underscore (es. "11")
        mission_num = file_name.split('_')[0]
        
        # Costruiamo il percorso reale della nuova struttura cartelle
        real_img_path = os.path.join('photosphere', f'Apollo {mission_num}', file_name)

        # 3. Apre l'immagine se esiste e aggiorna unicamente i campi width e height
        if os.path.exists(real_img_path):
            try:
                with Image.open(real_img_path) as img:
                    w, h = img.size
                    
                # Mostra il log se le dimensioni cambiano rispetto a prima
                if missione.get("width") != w or missione.get("height") != h:
                    print(f"AGGIORNATO: {file_name} -> Vecchio: {missione.get('width')}x{missione.get('height')} | Nuovo: {w}x{h}")
                else:
                    print(f"INVARIATO: {file_name} -> {w}x{h}")
                    
                missione["width"] = w
                missione["height"] = h
                updated_count += 1
                
            except Exception as e:
                print(f"ERRORE nella lettura dell'immagine {real_img_path}: {e}")
        else:
            print(f"ATTENZIONE: Immagine non trovata al percorso: {real_img_path}")

    # 4. Riscrittura del file JSON con i vecchi dati intatti e le nuove dimensioni
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("---")
    print(f"Operazione completata! Aggiornate le dimensioni di {updated_count} panoramiche in '{json_path}'.")

if __name__ == "__main__":
    update_json_dimensions()