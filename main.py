import os
import requests
from google.cloud import aiplatform
# Assumendo che il framework ADK sia installato nell'ambiente Python del Bastion
from adk import agent, tool

# --- CONFIGURAZIONE ---
PROJECT_ID = "rootprj-377111"
LOCATION = "us-central1"
# ID del Data Store di Healthcare (opzionale, per grounding futuro)
DATASTORE_ID = "healthcare-knowledge-base" 

@tool
def search_doctor(specialization: str, city: str):
    """
    Cerca medici specialisti e la loro disponibilità in una specifica città.
    
    Args:
        specialization: La branca medica richiesta (es. cardiologo, pediatra).
        city: Il comune o la città di ricerca.
    """
    # Mock data - In produzione qui si chiamerebbe un'API FHIR o un DB SQL
    doctors = [
        {"name": "Dr.ssa Elena Bianchi", "spec": "cardiologo", "city": "Milano", "availability": "Domani ore 10:00"},
        {"name": "Dr. Marco Rossi", "spec": "pediatra", "city": "Roma", "availability": "Lunedì ore 09:00"},
        {"name": "Dr. Valerio Neri", "spec": "cardiologo", "city": "Milano", "availability": "Venerdì ore 15:30"},
    ]
    
    results = [d for d in doctors if d["spec"].lower() == specialization.lower() and d["city"].lower() == city.lower()]
    
    if not results:
        return f"Spiacente, non ho trovato {specialization} disponibili a {city} nei nostri database."
    
    return results

@agent(
    name="healthcare-support-agent",
    description="Agente professionale per supporto sanitario, ricerca medici e triage informativo.",
    instructions=[
        "Sei l'Assistente Sanitario Intelligente dell'Università Bicocca (progetto Argolis).",
        "Il tuo compito principale è aiutare gli utenti a trovare specialisti tramite il tool 'search_doctor'.",
        "Mantieni sempre un tono empatico, professionale e rassicurante.",
        "DISCLAIMER OBBLIGATORIO: Se l'utente manifesta sintomi gravi o urgenze, istruiscilo IMMEDIATAMENTE a chiamare il 112.",
        "Non fornire diagnosi mediche; limitati a fornire informazioni operative e disponibilità dei medici.",
        "Usa le informazioni dei documenti se disponibili tramite il sistema di ricerca."
    ],
    tools=[search_doctor]
)
def healthcare_agent():
    """Entrypoint per l'agente sanitario."""
    pass

if __name__ == "__main__":
    # Inizializzazione Vertex AI per il deployment su Agent Engine
    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    print(f"✅ Agente 'healthcare-support-agent' pronto per il deployment su Vertex AI Agent Engine.")
