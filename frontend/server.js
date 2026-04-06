const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PROJECT_ID = 'rootprj-377111';

// Simple fallback extraction logic without LLM
function extractParams(text) {
    const specMatch = text.toUpperCase().match(/(MALATTIE INFETTIVE|CARDIOLOGIA|PEDIATRIA|OCULISTICA)/);
    const cityMatch = text.toUpperCase().match(/(MILANO|ROMA|NAPOLI|AYAS|AOSTA)/);
    
    return {
        isDoctorSearch: !!(specMatch && cityMatch),
        specialization: specMatch ? specMatch[1] : 'MALATTIE INFETTIVE',
        city: cityMatch ? cityMatch[1] : 'MILANO',
        isEmergency: text.toLowerCase().includes('dolore') || text.toLowerCase().includes('respiro')
    };
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        console.log(`Processing message: ${message}`);
        
        const analysis = extractParams(message);
        console.log("Local Analysis:", analysis);

        if (analysis.isEmergency) {
            return res.json({ answer: "⚠️ EMERGENZA RILEVATA: Se ha sintomi gravi o dolore acuto, chiami immediatamente il 112. Non posso fornire assistenza medica d'urgenza." });
        }

        if (analysis.isDoctorSearch) {
            const dbQuery = `SELECT * FROM doctors WHERE specialization LIKE '%${analysis.specialization}%' AND city LIKE '%${analysis.city}%' LIMIT 3`;
            
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
                return res.json({ answer: `Spiacente, non ho trovato specialisti in ${analysis.specialization} a ${analysis.city} nel database ufficiale ATS.` });
            }
        }

        // Generic fallback
        res.json({ answer: "Buongiorno! Posso aiutarla a trovare medici specialisti (es. 'cerco un infettivologo a Milano') o fornirle informazioni operative sui protocolli clinici." });

    } catch (err) {
        console.error("Error in chat API:", err);
        res.status(500).json({ answer: "Si è verificato un errore tecnico nella consultazione dei dati medici." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Frontend Server with Local Logic listening on port ${PORT}`);
});
