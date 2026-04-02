const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PROJECT_ID = 'rootprj-377111';
const LOCATION = 'us-central1';
const MCP_BASE_URL = 'https://google-mcp-data-toolbox-482813436426.us-central1.run.app';

async function callGemini(prompt) {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-3.1-flash-preview:generateContent`;
    
    const response = await auth.request({
        url,
        method: 'POST',
        data: {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }
    });

    return JSON.parse(response.data.candidates[0].content.parts[0].text);
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        console.log(`Processing message: ${message}`);
        
        // 1. Ask Gemini to identify intent and extract parameters
        const analysisPrompt = `
        Analizza la seguente richiesta sanitaria e identifica se l'utente sta cercando un medico.
        Se sì, estrai la specializzazione (in maiuscolo, es. CARDIOLOGIA) e la città.
        Se l'utente segnala un'emergenza (dolore petto, respiro), attiva il flag emergency.
        
        Ritorna SOLO JSON: {"isDoctorSearch": boolean, "specialization": string, "city": string, "isEmergency": boolean}
        
        Richiesta: "${message}"
        `;
        
        const analysis = await callGemini(analysisPrompt);
        console.log("Gemini Analysis:", analysis);

        if (analysis.isEmergency) {
            return res.json({ answer: "⚠️ EMERGENZA RILEVATA: Se ha sintomi gravi o dolore acuto, chiami immediatamente il 112. Non posso fornire assistenza medica d'urgenza." });
        }

        if (analysis.isDoctorSearch) {
            // 2. Call the MCP Server directly via SQL (simulated tool call for demo)
            // In a real ADK setup, this would be automatic.
            const dbQuery = `SELECT * FROM doctors WHERE specialization LIKE '%${analysis.specialization}%' AND city LIKE '%${analysis.city.toUpperCase()}%' LIMIT 3`;
            
            // For the demo, we call the MCP logic directly since we are the host
            const { Client } = require('pg');
            const pgClient = new Client({
                host: `/cloudsql/${PROJECT_ID}:europe-west1:healthcare-db-instance`,
                user: 'mcp_user',
                password: 'mcp_password_2026',
                database: 'healthcare'
            });
            
            await pgClient.connect();
            const dbRes = await pgClient.query(dbQuery);
            await pgClient.end();
            
            if (dbRes.rows.length > 0) {
                let answer = `Ho consultato il database ufficiale ATS Milano. Ecco i medici specialisti in ${analysis.specialization} trovati a ${analysis.city}:\n\n`;
                dbRes.rows.forEach(d => {
                    answer += `• **${d.name} ${d.surname}** (${d.ente})\n  📍 ${d.address}\n  📧 Email: ${d.email || 'N/D'}\n\n`;
                });
                return res.json({ answer });
            } else {
                return res.json({ answer: `Spiacente, non ho trovato specialisti in ${analysis.specialization} a ${analysis.city} nel database ufficiale.` });
            }
        }

        // Default response
        const chatPrompt = `Sei un assistente sanitario. Rispondi in modo gentile a: "${message}". Se non puoi aiutare, scusati.`;
        const chatRes = await callGemini(`{"answer": "stringa di risposta"} \n\n ${chatPrompt}`);
        res.json({ answer: chatRes.answer });

    } catch (err) {
        console.error("Error in chat API:", err);
        res.status(500).json({ answer: "Si è verificato un errore tecnico nella consultazione dei dati medici." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Frontend Server with Gemini Orchestration listening on port ${PORT}`);
});
