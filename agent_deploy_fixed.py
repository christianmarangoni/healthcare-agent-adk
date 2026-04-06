import vertexai
from vertexai.preview.reasoning_engines import ReasoningEngine
import os

# --- CONFIGURAZIONE TELEMETRIA ---
# Queste variabili devono essere presenti durante l'esecuzione dell'agente su Vertex
os.environ["GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY"] = "true"
os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "true"

PROJECT_ID = 'rootprj-377111'
LOCATION = 'us-central1'
STAGING_BUCKET = 'gs://golden-dataset-rootprj-377111'

vertexai.init(project=PROJECT_ID, location=LOCATION, staging_bucket=STAGING_BUCKET)

class HealthcareAgent:
    def __init__(self, model_name="gemini-1.5-flash-001"):
        self.model_name = model_name
    
    def set_up(self):
        # Import interni per garantire che siano disponibili nel runtime di Vertex
        from google.adk.agents.llm_agent import LlmAgent
        from google.adk.tools.function_tool import FunctionTool
        from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams
        
        # Endpoint MCP Bridge per Argolis Project
        MCP_URL = 'https://google-mcp-data-toolbox-exy4yg6ala-uc.a.run.app/sse'
        mcp_toolset = McpToolset(connection_params=SseConnectionParams(url=MCP_URL))
        
        def emergency_checker(symptoms: str) -> str:
            """Verifica se i sintomi richiedono il 112."""
            dangerous = ['dolore petto', 'respiro', 'incosciente', 'emorragia', 'infarto']
            if any(s in symptoms.lower() for s in dangerous):
                return 'CRITICO: Chiamare il 112 immediatamente.'
            return 'Non critico, procedere con ricerca medico specialistico.'
            
        self.agent = LlmAgent(
            name='healthcare-support-agent',
            instruction=[
                "Sei un Assistente Sanitario Intelligente professionale del progetto Argolis.",
                "Il tuo compito principale è aiutare gli utenti a trovare specialisti tramite il database ufficiale.",
                "Usa 'search_doctors_database' per trovare i medici e 'get_doctor_details' per contatti.",
                "Mantieni un tono empatico e rassicurante.",
                "DISCLAIMER: Per emergenze gravi, istruisci IMMEDIATAMENTE a chiamare il 112.",
                "Non fornire diagnosi mediche."
            ],
            tools=[FunctionTool(func=emergency_checker), mcp_toolset],
            model=self.model_name
        )
    
    def query(self, message: str, user_id: str = 'user-demo'):
        from google.adk.runners import Runner
        from google.adk.sessions.in_memory_session_service import InMemorySessionService
        from google.genai import types
        
        session_service = InMemorySessionService()
        runner = Runner(agent=self.agent, session_service=session_service, app_name='healthcare_app', auto_create_session=True)
        
        msg_obj = types.Content(role='user', parts=[types.Part(text=message)])
        full_text = ''
        
        # Esecuzione del runner
        for event in runner.run(user_id=user_id, session_id='session-v31', new_message=msg_obj):
            if hasattr(event, 'content') and event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        full_text += part.text
        return full_text

if __name__ == "__main__":
    print('🚀 Deploying Healthcare Agent Observable V31 (Clean SDK)...')
    
    # Rimuoviamo restrizioni di versione troppo strette che causano conflitti
    # ma manteniamo google-adk per l'osservabilità
    requirements = [
        'google-adk==1.28.1',
        'google-cloud-aiplatform[reasoningengine]',
        'requests',
        'pandas'
    ]
    
    engine = ReasoningEngine.create(
        HealthcareAgent(),
        requirements=requirements,
        display_name='Healthcare Agent Observable V31'
    )
    print('✅ SUCCESS! Resource name:', engine.resource_name)
