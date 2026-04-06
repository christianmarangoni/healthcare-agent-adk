import os
from google.cloud import aiplatform
from adk import agent, tool, mcp

# --- CONFIGURAZIONE ---
PROJECT_ID = "rootprj-377111"
LOCATION = "us-central1"
# Google MCP Data Toolbox URL
MCP_URL = "https://google-mcp-data-toolbox-exy4yg6ala-uc.a.run.app/sse"

# Connessione al Google MCP Data Toolbox per i medici ATS Milano
# Questo registra automaticamente i tool 'search_doctors_database' e 'get_doctor_details'
mcp_tools = mcp.connect_sse(MCP_URL)

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
    tools=[emergency_checker] + mcp_tools
)
def healthcare_agent():
    """Entrypoint per l'agente sanitario."""
    pass

if __name__ == "__main__":
    aiplatform.init(project=PROJECT_ID, location=LOCATION)
    print(f"✅ Agente con Google MCP Data Toolbox pronto.")
