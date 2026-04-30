import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const allowedRoles = ['admin', 'amministratore', 'medico', 'segreteria'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Accesso non autorizzato' }, { status: 403 });
    }

    const { file_url, company_name } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url mancante' }, { status: 400 });

    // Carica il mansionario globale per contestualizzare le mansioni
    let jobRolesContext = '';
    try {
      const jobRoles = await base44.asServiceRole.entities.JobRole.filter({});
      if (jobRoles.length > 0) {
        const catalogoStr = jobRoles.map(r => {
          const examsStr = (r.required_exams || []).map(e => `${e.exam_name} (${e.frequency_months} mesi)`).join(', ');
          const risksStr = (r.risks || []).map(e => e.risk_name).join(', ');
          return `- ${r.name}${risksStr ? ` | Rischi: ${risksStr}` : ''}${examsStr ? ` | Esami standard: ${examsStr}` : ''}${r.surveillance_frequency_months ? ` | Periodicità standard: ${r.surveillance_frequency_months} mesi` : ''}`;
        }).join('\n');
        jobRolesContext = `\n\nMANSIONARIO AZIENDALE (catalogo mansioni configurato nel sistema):\n${catalogoStr}\n\nUsa queste informazioni come RIFERIMENTO per completare/integrare i dati mancanti nel documento, ma dai sempre PRIORITÀ a quanto scritto nel documento stesso.`;
      }
    } catch (_) { /* ignora se non disponibile */ }

    const prompt = `Sei un esperto di medicina del lavoro (Medico Competente) ai sensi del D.Lgs. 81/2008.
Ti viene fornito un Protocollo Sanitario o DVR di un'azienda${company_name ? ` chiamata "${company_name}"` : ''}.

Il documento è strutturato per MANSIONI. Per ogni mansione è presente una tabella con:
- Colonna FATTORI DI RISCHIO (con X se presente/applicabile): MMC, Movimenti Ripetitivi, Posture, Microclima, Polveri Miste, Vibrazioni (Mano-Braccio o Corpo Intero), Rumore, Lavoro Notturno, Lavoro in Altezza, Stress, Utilizzo VDT, Agenti Chimici, Agenti Biologici, Altro
- Colonna ACCERTAMENTI: gli esami sanitari previsti (es. Visita Medica, Audiometria, Spirometria, Test Visivo, Esame Ematochimico, ECG, Valutazione Arti Superiori, Val. Fun. Rachide, Glicemia + HB Glicata, Droga Test Urinario, AUDIT C, Vaccinazione Antitetano, RX Torace, VDT, Urine, Escreato, ecc.)
- Colonna PERIODICITA': la frequenza in mesi (es. 12 MESI, 24 MESI, 48 MESI) oppure "SECONDO PROTOCOLLO" per le vaccinazioni

ISTRUZIONI:
1. Estrai TUTTE le mansioni presenti nel documento (incluse quelle nelle pagine finali, nelle tabelle riassuntive, negli allegati).
2. Per ogni mansione, elenca tutti i fattori di rischio marcati con X.
3. Per ogni mansione, elenca TUTTI gli accertamenti con la loro periodicità in mesi:
   - Se la periodicità è "SECONDO PROTOCOLLO" usa 0 come valore numerico
   - Se non è indicata una periodicità esplicita, deduci dalla logica del protocollo (di solito la stessa della visita medica per quella mansione) oppure usa null
   - La visita medica periodica ha sempre una periodicità indicata: usala come "frequency_months" principale della mansione
4. Nel campo "risks" elenca i fattori di rischio attivi (con X) separati da virgola.
5. Nel campo "notes" inserisci qualsiasi indicazione speciale (es. "Magazziniere con uso carrelli elevatori - non applicabile il protocollo standard", ecc.)
6. Nel "summary" descrivi sinteticamente il tipo di azienda/attività e le mansioni principali trovate.
7. RICONCILIAZIONE CATALOGO: Per ogni mansione trovata nel documento, verifica se il suo nome (anche con leggere varianti linguistiche, abbreviazioni, o denominazioni diverse) corrisponde o è molto simile a una mansione del MANSIONARIO AZIENDALE riportato sotto. 
   - Se trovi una corrispondenza certa (stesso ruolo, nome identico o quasi identico): imposta catalog_match_status = "exact"
   - Se trovi una corrispondenza probabile (stesso ruolo ma nome diverso, es. "Addetto Magazzino" vs "Magazziniere", "Operatore VDT" vs "Addetto VDT"): imposta catalog_match_status = "suggested" e indica il nome dal catalogo in catalog_match_name
   - Se non trovi corrispondenze nel catalogo: imposta catalog_match_status = "none"

Sii PRECISO ed ESAUSTIVO: non omettere alcuna mansione né alcun accertamento presente nel documento.
Usa la terminologia italiana corretta della medicina del lavoro.${jobRolesContext}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Sommario del protocollo: tipo azienda, numero mansioni trovate, caratteristiche principali (max 400 caratteri)'
          },
          roles: {
            type: 'array',
            description: 'Una voce per ogni mansione trovata nel documento',
            items: {
              type: 'object',
              properties: {
                role_name: {
                  type: 'string',
                  description: 'Nome della mansione esatto come nel documento (es. "Bagnino", "Cameriere/a ai Piani", "Cuoco/Aiuto Cuoco")'
                },
                catalog_match_status: {
                  type: 'string',
                  description: '"exact" se il nome corrisponde esattamente a una mansione del catalogo, "suggested" se c\'è una corrispondenza probabile con nome diverso, "none" se non c\'è corrispondenza'
                },
                catalog_match_name: {
                  type: 'string',
                  description: 'Nome della mansione del catalogo suggerita come corrispondente (solo se catalog_match_status = "suggested")'
                },
                risks: {
                  type: 'string',
                  description: 'Fattori di rischio attivi (con X nel documento) separati da virgola (es. "MMC, Movimenti Ripetitivi, Posture, Microclima")'
                },
                frequency_months: {
                  type: 'number',
                  description: 'Periodicità della visita medica periodica in mesi (es. 12, 24, 48). Desumila dall\'accertamento "Visita Medica" del protocollo.'
                },
                notes: {
                  type: 'string',
                  description: 'Note speciali, avvertenze, annotazioni presenti nel documento per questa mansione'
                },
                exams: {
                  type: 'array',
                  description: 'Lista completa di tutti gli accertamenti previsti per questa mansione',
                  items: {
                    type: 'object',
                    properties: {
                      exam_name: {
                        type: 'string',
                        description: 'Nome esatto dell\'accertamento (es. "Visita Medica", "Audiometria", "Spirometria", "Test Visivo", "Esame Ematochimico", "ECG", "Valutazione Arti Superiori", "Val. Fun. Rachide", "Glicemia + HB Glicata", "Droga Test Urinario", "AUDIT C", "Vaccinazione Antitetano", "RX Torace", "VDT", "Urine", "Escreato")'
                      },
                      frequency_months: {
                        type: 'number',
                        description: 'Periodicità in mesi. Usa 0 per "Secondo Protocollo" (vaccinazioni). Se non specificata ma è logicamente la stessa della visita medica, usa quella.'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return Response.json({ ok: true, plan: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});