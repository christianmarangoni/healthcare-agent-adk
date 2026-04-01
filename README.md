# Healthcare Support Agent (Argolis Project) 🩺🚀

Agente intelligente basato su **Vertex AI Agent Engine (ADK Framework)** progettato per l'ambito sanitario.

## 🌟 Funzionalità
- **Ricerca Medici:** Individuazione automatica di specialisti in base a città e branca medica.
- **Triage Informativo:** Supporto empatico e smistamento verso i contatti corretti.
- **Compliance & Safety:** Disclaimer automatici per emergenze (112) e prevenzione di diagnosi non autorizzate.

## 🛠️ Requisiti
- Google Cloud Project (Argolis: `rootprj-377111`)
- Vertex AI Agent Builder attivo
- Python 3.9+

## 🌐 Web Interface (Live Demo)
L'interfaccia chat è pubblicata ed è accessibile al seguente indirizzo:
👉 **[Healthcare AI Web Portal](https://healthcare-web-ui-482813436426.europe-west1.run.app)**

## 🚀 Deployment (via Bastion / Local CLI)
1. Installa le dipendenze:
   ```bash
   pip install -r requirements.txt
   ```
2. Effettua il deploy su Vertex AI Agent Engine abilitando il Tracing:
   ```bash
   adk deploy --project=rootprj-377111 --location=us-central1 --enable-trace
   ```

## 📊 Monitoring
Le metriche e i trace sono visibili nella console di Google Cloud sotto **Vertex AI > Agent Builder > Monitoring**.
