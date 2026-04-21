import os
import json
import re
import math
from PIL import Image

# 1. COORDINATE UFFICIALI SITI APOLLO (Selenografiche)
APOLLO_COORDS = {
    "11": {"lat": 0.6741, "lon": 23.4730, "site": "Mare Tranquillitatis"},
    "12": {"lat": -3.0124, "lon": -23.4216, "site": "Oceanus Procellarum"},
    "14": {"lat": -3.6453, "lon": -17.4714, "site": "Fra Mauro"},
    "15": {"lat": 26.1322, "lon": 3.6339, "site": "Hadley-Apennine"},
    "16": {"lat": -8.9730, "lon": 15.5002, "site": "Descartes Highlands"},
    "17": {"lat": 20.1908, "lon": 30.7717, "site": "Taurus-Littrow"}
}

def generate_config():
    folder = 'photosphere'
    if not os.path.exists(folder):
        print(f"Errore: La cartella '{folder}' non esiste.")
        return

    missions_json = []
    # Inizializza contatori per la distribuzione a spirale
    mission_counts = {k: 0 for k in APOLLO_COORDS.keys()}
    
    # Parametri Spirale di Fermat (Grado di dispersione)
    GOLDEN_ANGLE = 2.39996  # Angolo aureo in radianti (stretto e ottimizzato)
    # Aumenta questo valore se i pallini sono ancora troppo vicini
    DISTANCE_FACTOR = 0.65  

    print("--- INIZIO ANALISI CARTELLA 'photosphere' ---")

    # Ordinamento deterministico per posizionamento costante
    files = sorted([f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

    for filename in files:
        path = os.path.join(folder, filename)
        
        # Identificazione Missione dal nome file (11-17)
        match = re.search(r'(11|12|14|15|16|17)', filename)
        
        if match:
            m_id = match.group(1)
            base = APOLLO_COORDS[m_id]
            
            # Algoritmo Spirale
            n = mission_counts[m_id]
            mission_counts[m_id] += 1
            
            angle = n * GOLDEN_ANGLE
            radius = DISTANCE_FACTOR * math.sqrt(n)
            
            new_lat = base["lat"] + (radius * math.cos(angle))
            new_lon = base["lon"] + (radius * math.sin(angle))
            title = f"APOLLO {m_id} - {base['site']}"
        else:
            # Fallback se non riconosciuto
            m_id = "unknown"
            final_lat = 45.0 + (hash(filename) % 20)
            final_lon = 0.0 + (hash(filename) % 20)
            title = "Unknown Landing Site"

        try:
            with Image.open(path) as img:
                w, h = img.size
            
            entry = {
                "id": f"apollo{m_id}",
                "titolo": title,
                "lat": round(new_lat, 5),
                "lon": round(new_lon, 5),
                "camera": "Hasselblad 500EL (Reseau Plate)",
                "file": path.replace('\\', '/'),
                "width": w,
                "height": h,
                "haov": 180, # FOV orizzontale di base, sovrascrivilo se necessario
                # Qui aggiungeremo gli HotSpot misurati
                "hotSpots": [] 
            }
            missions_json.append(entry)
            print(f"PROCESSATO: {filename} -> Missione {m_id} (Cluster n.{n})")
            
        except Exception as e:
            print(f"ERRORE su {filename}: {e}")

    # Scrittura JSON (encoding utf-8 per caratteri speciali)
    output_data = {"missioni": missions_json}
    with open('config.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)

    print("---")
    print(f"Operazione completata! Generati {len(missions_json)} Punti di Interesse in 'config.json'.")
    for m, count in mission_counts.items():
        if count > 0:
            print(f"Apollo {m}: {count} file distribuiti a spirale.")

if __name__ == "__main__":
    generate_config()