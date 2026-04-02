import os
import requests
from google.cloud import aiplatform
# Assumendo che il framework ADK sia installato nell'ambiente Python del Bastion
from adk import agent, tool, mcp

# --- CONFIGURAZIONE ---
PROJECT_ID = "rootprj-377111"
LOCATION = "us-central1"
MCP_URL = "https://healthcare-mcp-bridge-482813436426.us-central1.run.app/sse"

# Caricamento Tool dal Database via MCP
# Questo registrerà automaticamente 'query_doctors' come tool dell'agente
mcp_tools = mcp.connect_sse(MCP_URL)

@tool
def search_doctor(specialization: str, city: str):
    """
    Cerca medici specialisti e la loro disponibilità in una specifica città.
    Questo tool usa un database locale di emergenza (mock).
    Per ricerche approfondite sull'intero elenco ATS Milano, Gemini userà automaticamente il tool 'query_doctors'.
    
    Args:
        specialization: La branca medica richiesta (es. cardiologo, pediatra).
        city: Il comune o la città di ricerca.
    """
    # ... (rest of the code)
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
        "Sei un Assistente Sanitario Intelligente professionale.",
        "Il tuo compito principale è aiutare gli utenti a trovare specialisti tramite il tool 'search_doctor'.",
        "Mantieni sempre un tono empatico, professionale e rassicurante.",
        "DISCLAIMER OBBLIGATORIO: Se l'utente manifesta sintomi gravi o urgenze, istruiscilo IMMEDIATAMENTE a chiamare il 112.",
        "Non fornire diagnosi mediche; limitati a fornire informazioni operative e disponibilità dei medici.",
        "Rispondi basandoti esclusivamente sulle tue conoscenze certificate o sui tool a disposizione."
    ],
    tools=[search_doctor] + mcp_tools
)
def healthcare_agent():
    """Entrypoint per l'agente sanitario."""
    pass

if __name__ == "__main__":
    # Inizializzazione Vertex AI per il deployment su Agent Engine
    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    print(f"✅ Agente 'healthcare-support-agent' pronto per il deployment su Vertex AI Agent Engine.")
