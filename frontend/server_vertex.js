const express = require('express');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PROJECT_ID = 'rootprj-377111';
const LOCATION = 'us-central1';
const RE_ID = '1856028953999835136'; // Healthcare Agent Observable V31

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        console.log(`Querying Vertex AI Reasoning Engine (${RE_ID}) with message: ${message}`);
        
        // Costruzione dell'endpoint per Reasoning Engine (v1beta1)
        const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${RE_ID}:query`;
        
        const { GoogleAuth } = require('google-auth-library');
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();

        const axios = require('axios');
        const response = await axios.post(endpoint, {
            input: {
                message: message
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Vertex AI Response:", JSON.stringify(response.data));

        if (response.data && response.data.output) {
            // ADK Runner restituisce il testo finale nell'output
            res.json({ answer: response.data.output });
        } else {
            res.json({ answer: "L'agente ha risposto correttamente ma il formato non è quello atteso." });
        }

    } catch (err) {
        console.error("Error in Vertex AI query:", err.response ? JSON.stringify(err.response.data) : err.message);
        res.status(500).json({ answer: "Si è verificato un errore durante la comunicazione con l'Agente Vertex AI." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Frontend Server with Vertex AI Integration listening on port ${PORT}`);
});
