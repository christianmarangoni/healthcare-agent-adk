import vertexai
from vertexai.preview.reasoning_engines import ReasoningEngine
import os

# --- CONFIGURAZIONE TELEMETRIA ---
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
        from google.adk.agents.llm_agent import LlmAgent
        from google.adk.tools.function_tool import FunctionTool
        
        def emergency_checker(symptoms: str) -> str:
            """Verifica se i sintomi richiedono il 112."""
            return "OK"
            
        self.agent = LlmAgent(
            name='healthcare-support-agent-v31-test',
            instruction="Sei un assistente di test.",
            tools=[FunctionTool(func=emergency_checker)],
            model=self.model_name
        )
    
    def query(self, message: str, user_id: str = 'user-demo'):
        return "ADK Agent is Running with FunctionTool"

if __name__ == "__main__":
    print('🚀 Deploying Test V31 (FunctionTool Only)...')
    engine = ReasoningEngine.create(
        HealthcareAgent(),
        requirements=[
            'google-adk==1.28.1',
            'google-cloud-aiplatform[reasoningengine]'
        ],
        display_name='Healthcare Agent V31 FunctionTool Test'
    )
    print('✅ SUCCESS! Resource name:', engine.resource_name)
