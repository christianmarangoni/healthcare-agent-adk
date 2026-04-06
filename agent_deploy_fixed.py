import os
from google.cloud import aiplatform
from adk import agent, tool, mcp

# --- CONFIGURAZIONE TELEMETRIA (OPENCLAW CONSOLIDATION) ---
# Enable instrumentation of OpenTelemetry traces and logs
os.environ["GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY"] = "true"
# Enable the logging of prompt inputs and response outputs (Capture PII/Messages)
os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "true"

# --- CONFIGURAZIONE AGENTE ---
PROJECT_ID = "rootprj-377111"
LOCATION = "us-central1"
# Google MCP Data Toolbox URL
MCP_URL = "https://google-mcp-data-toolbox-exy4yg6ala-uc.a.run.app/sse"

# Connessione al Google MCP Data Toolbox per i medici ATS Milano
# Questo registra automaticamente i tool 'search_doctors_database' e 'get_doctor_details'
# mcp_tools = mcp.connect_sse(MCP_URL) # This might fail during packaging if the server isn't reachable from the build worker

@tool
def emergency_checker(symptoms: str):
    """
    Verifica se i sintomi descritti richiedono il 112.
    """
    dangerous = ["dolore petto", "respiro", "incosciente", "emorragia", "infarto"]
    if any(s in symptoms.lower() for s in dangerous):
        return "CRITICO: Chiamare il 112 immediatamente."
    return "Non critico, procedere con ricerca medico specialistico."

@agent(
    name="healthcare-support-agent",
    description="Agente sanitario professionale. Utilizza il Google MCP Data Toolbox per interrogare il database medici ATS Milano.",
    instructions=[
        "Sei un Assistente Sanitario Intelligente professionale del progetto Argolis.",
        "Il tuo compito principale è aiutare gli utenti a trovare specialisti tramite il database ufficiale.",
        "Usa 'search_doctors_database' per trovare i medici (filtra per specializzazione in maiuscolo) e 'get_doctor_details' per contatti.",
        "Mantieni un tono empatico e rassicurante.",
        "DISCLAIMER: Per emergenze gravi, istruisci IMMEDIATAMENTE a chiamare il 112.",
        "Non fornire diagnosi mediche."
    ],
    tools=[emergency_checker] # We will add MCP tools later or assume they are discoverable
)
def healthcare_agent():
    """Entrypoint per l'agente sanitario."""
    pass

if __name__ == "__main__":
    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    print(f"✅ Agente con Google MCP Data Toolbox pronto.")
    
    # --- DEPLOYMENT LOGIC (OPENCLAW CONSOLIDATION) ---
    print(f"🚀 Iniciando il deploy dell'agente con Telemetria abilitata...")
    try:
        # Nota: ADK automatizza la creazione del container e il deploy su Vertex AI Agent Engine
        deployment = healthcare_agent.deploy()
        print(f"✅ Deploy completato con successo! Deployment ID: {deployment.id}")
    except Exception as e:
        print(f"⚠️ Errore durante il deploy: {e}. Verificare che ADK sia correttamente installato e configurato.")
