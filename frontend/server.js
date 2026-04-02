const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PROJECT_ID = process.env.PROJECT_ID || 'rootprj-377111';
const LOCATION = process.env.LOCATION || 'us-central1';
const AGENT_ID = process.env.AGENT_ID || 'healthcare-support-agent';

// In produzione, l'autenticazione avverrà tramite l'identità del servizio di Cloud Run.
// In locale, useremo Application Default Credentials.
async function getVertexAiClient() {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    return await auth.getClient();
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        // Questa è una simulazione della chiamata all'Agent Engine.
        // In un caso reale, si userebbe l'endpoint Discovery Engine per interrogare l'agente.
        
        // Mocking the response for the demo deployment phase
        // TODO: Replace with real Vertex AI Agent Engine client call
        let answer = `Ho consultato il database ufficiale tramite Google MCP Data Toolbox...`;
        
        if (message.toLowerCase().includes('cardiologo')) {
            answer = "Tramite l'MCP Toolbox ho trovato specialisti in CARDIOLOGIA a Milano: la Dr.ssa Francesca Bai (ASST Santi Paolo e Carlo) e il Dr. Valerio Neri (IRCCS San Raffaele). Desidera i loro recapiti email?";
        } else if (message.toLowerCase().includes('112')) {
            answer = "⚠️ Emergenza rilevata: chiami immediatamente il 112.";
        }

        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
