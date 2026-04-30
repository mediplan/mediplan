import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mappa ATECO -> livello di rischio (estratta dalla tabella ufficiale ATECO 2025)
// Usiamo i codici di sezione (1-2 lettere) e i codici numerici principali per una lookup rapida
const ATECO_RISK_MAP = {
  // Sezioni principali
  'A': 'MEDIO',  // Agricoltura, silvicoltura e pesca
  'B': 'ALTO',   // Estrazione di minerali
  'C': 'MEDIO',  // Attività manifatturiere
  'D': 'MEDIO',  // Fornitura energia elettrica
  'E': 'MEDIO',  // Fornitura acqua, reti fognarie
  'F': 'ALTO',   // Costruzioni
  'G': 'BASSO',  // Commercio
  'H': 'MEDIO',  // Trasporto e magazzinaggio
  'I': 'BASSO',  // Alloggio e ristorazione
  'J': 'BASSO',  // Servizi informazione e comunicazione
  'K': 'BASSO',  // Attività finanziarie e assicurative
  'L': 'BASSO',  // Attività immobiliari
  'M': 'BASSO',  // Attività professionali, scientifiche e tecniche
  'N': 'BASSO',  // Noleggio, agenzie viaggio, servizi supporto
  'O': 'BASSO',  // Pubblica amministrazione
  'P': 'BASSO',  // Istruzione
  'Q': 'MEDIO',  // Sanità e assistenza sociale
  'R': 'BASSO',  // Attività artistiche, sportive, intrattenimento
  'S': 'BASSO',  // Altre attività di servizi
  'T': 'BASSO',  // Famiglie come datori di lavoro
  'U': 'BASSO',  // Organizzazioni ed organismi extraterritoriali
  // Sottosezioni specifiche ad alto rischio (codici numerici)
  '05': 'ALTO', '06': 'ALTO', '07': 'ALTO', '08': 'ALTO', '09': 'ALTO', // Estrazione
  '10': 'ALTO', '11': 'ALTO', '12': 'ALTO', '13': 'ALTO', '14': 'MEDIO', // Manifatturiero alimentare/tessile
  '15': 'MEDIO', '16': 'MEDIO', '17': 'ALTO', '18': 'BASSO', '19': 'ALTO',
  '20': 'ALTO', '21': 'MEDIO', '22': 'MEDIO', '23': 'ALTO', '24': 'ALTO', '25': 'ALTO',
  '26': 'BASSO', '27': 'MEDIO', '28': 'ALTO', '29': 'ALTO', '30': 'ALTO',
  '31': 'MEDIO', '32': 'MEDIO', '33': 'MEDIO',
  '35': 'MEDIO', // Energia elettrica
  '36': 'MEDIO', '37': 'ALTO', '38': 'ALTO', '39': 'ALTO', // Acque, rifiuti
  '41': 'ALTO', '42': 'ALTO', '43': 'ALTO', // Costruzioni
  '45': 'BASSO', '46': 'BASSO', '47': 'BASSO', // Commercio
  '49': 'MEDIO', '50': 'MEDIO', '51': 'MEDIO', '52': 'MEDIO', '53': 'BASSO', // Trasporti
  '55': 'BASSO', '56': 'BASSO', // Alloggio e ristorazione
  '85': 'BASSO', // Istruzione
  '86': 'MEDIO', '87': 'MEDIO', '88': 'BASSO', // Sanità
};

function getRiskLevel(atecoCode) {
  if (!atecoCode) return 'MEDIO';
  const code = atecoCode.trim().toUpperCase();
  // Prima prova match esatto
  if (ATECO_RISK_MAP[code]) return ATECO_RISK_MAP[code];
  // Poi prova i primi 2 caratteri numerici
  const twoDigit = code.replace(/\./g, '').substring(0, 2);
  if (ATECO_RISK_MAP[twoDigit]) return ATECO_RISK_MAP[twoDigit];
  // Poi prova la lettera di sezione
  const letter = code.charAt(0);
  if (ATECO_RISK_MAP[letter]) return ATECO_RISK_MAP[letter];
  return 'MEDIO';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const allowedRoles = ['admin', 'amministratore', 'medico', 'segreteria'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Accesso non autorizzato' }, { status: 403 });
    }

    const { company_name, ateco_code, sector, workers } = await req.json();
    if (!company_name) return Response.json({ error: 'company_name mancante' }, { status: 400 });

    // Determina livello di rischio da ATECO
    const riskLevel = getRiskLevel(ateco_code);

    // Carica il mansionario globale
    let jobRolesContext = '';
    let jobRoles = [];
    try {
      jobRoles = await base44.asServiceRole.entities.JobRole.filter({});
      if (jobRoles.length > 0) {
        const catalogoStr = jobRoles.map(r => {
          const examsStr = (r.required_exams || []).map(e => `${e.exam_name} (${e.frequency_months || 12} mesi)`).join(', ');
          const risksStr = (r.risks || []).map(e => e.risk_name).join(', ');
          return `- ${r.name}${risksStr ? ` | Rischi tipici: ${risksStr}` : ''}${examsStr ? ` | Accertamenti standard: ${examsStr}` : ''}${r.surveillance_frequency_months ? ` | Periodicità: ${r.surveillance_frequency_months} mesi` : ''}`;
        }).join('\n');
        jobRolesContext = `\n\nMANSIONARIO STANDARD (catalogo mansioni del sistema, già configurato per rispettare il D.Lgs. 81/2008):\n${catalogoStr}`;
      }
    } catch (_) { /* ignora */ }

    const prompt = `Sei un Medico Competente esperto in medicina del lavoro ai sensi del D.Lgs. 81/2008 e dell'Accordo CSR 2017.

Devi generare un PROTOCOLLO SANITARIO completo per l'azienda: "${company_name}"
- Codice ATECO: ${ateco_code || 'non specificato'}
- Settore: ${sector || 'non specificato'}
- Livello di rischio ATECO (dalla tabella ufficiale INAIL/ISTAT 2025): ${riskLevel}
${workers ? `- Mansioni/lavoratori presenti: ${workers}` : ''}
${jobRolesContext}

REGOLE per la generazione del protocollo (D.Lgs. 81/2008 + Accordo CSR 2017):

1. VISITA MEDICA PERIODICA - periodicità basata sul livello di rischio:
   - Rischio ALTO: ogni 12 mesi (1 anno)
   - Rischio MEDIO: ogni 24 mesi (2 anni) per lavoratori sani, 12 mesi per over 50 o con patologie
   - Rischio BASSO: ogni 24-48 mesi (2-4 anni)

2. ACCERTAMENTI per rischio RUMORE (D.Lgs. 81/08 art. 186):
   - Audiometria: ogni 12 mesi se LAex ≥ 85 dB, ogni 24 mesi se LAex 80-85 dB

3. ACCERTAMENTI per rischio VIBRAZIONE (D.Lgs. 81/08 art. 204):
   - Valutazione arti superiori/rachide lombosacrale: ogni 12-24 mesi

4. ACCERTAMENTI per rischio MOVIMENTAZIONE MANUALE CARICHI:
   - Valutazione funzionale rachide: ogni 12-24 mesi

5. ACCERTAMENTI per rischio VIDEOTERMINALI (D.Lgs. 81/08 art. 176):
   - Visiotest/valutazione visiva: ogni 24 mesi per under 50, ogni 12 mesi per over 50

6. ACCERTAMENTI per rischio AGENTI CHIMICI/BIOLOGICI:
   - Esame emocromocitometrico + funzionalità epatica/renale: in base all'agente
   - Spirometria per agenti respiratori

7. RISCHIO ALCOL (categorie ex art. 41 DPR 303/56 + Accordo CSR):
   - AUDIT-C ogni 12 mesi per categorie a rischio (autisti, operatori su carrelli, ecc.)

8. Usa il mansionario standard come base per identificare i rischi tipici di ogni mansione.
   Se una mansione è nel catalogo, usa i suoi dati come punto di partenza ma adatta al livello di rischio ATECO.

9. Genera un protocollo REALISTICO e COMPLETO per le mansioni più probabili in questo tipo di azienda.
   Se non sono specificate le mansioni, deducile dal settore ATECO.

10. Includi SEMPRE la Visita Medica come primo accertamento di ogni mansione.

Summary: descrivi sinteticamente il settore, il livello di rischio ATECO e le mansioni incluse nel protocollo.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Sommario del protocollo generato: settore, livello rischio ATECO, mansioni principali incluse (max 500 caratteri)'
          },
          ateco_risk_level: {
            type: 'string',
            description: 'Livello di rischio ATECO determinato: BASSO, MEDIO o ALTO'
          },
          roles: {
            type: 'array',
            description: 'Una voce per ogni mansione nel protocollo',
            items: {
              type: 'object',
              properties: {
                role_name: { type: 'string', description: 'Nome della mansione (es. "Addetto alla produzione", "Magazziniere", "Impiegato amministrativo")' },
                risks: { type: 'string', description: 'Fattori di rischio specifici per questa mansione e questo settore, separati da virgola' },
                frequency_months: { type: 'number', description: 'Periodicità della visita medica in mesi' },
                notes: { type: 'string', description: 'Note normative, riferimenti legislativi, prescrizioni particolari' },
                exams: {
                  type: 'array',
                  description: 'Lista completa degli accertamenti sanitari previsti',
                  items: {
                    type: 'object',
                    properties: {
                      exam_name: { type: 'string', description: 'Nome accertamento (es. "Visita Medica", "Audiometria", "Spirometria", "Visiotest", "Esame Emocromocitometrico", "AUDIT-C", "Valutazione Arti Superiori", "Valutazione Funzionale Rachide")' },
                      frequency_months: { type: 'number', description: 'Periodicità in mesi (0 = secondo protocollo)' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return Response.json({ ok: true, plan: result, risk_level: riskLevel });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});