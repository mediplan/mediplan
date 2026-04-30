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

    // Carica il catalogo JobRole (mansionario configurato)
    let jobRoles = [];
    try {
      jobRoles = await base44.asServiceRole.entities.JobRole.filter({});
    } catch (_) {}

    // Carica il catalogo accertamenti (MedicalExamCatalog)
    let examCatalog = [];
    try {
      examCatalog = await base44.asServiceRole.entities.MedicalExamCatalog.filter({ active: true });
    } catch (_) {}

    // Costruisci il testo del catalogo mansioni
    const jobRolesCatalogStr = jobRoles.length > 0
      ? jobRoles.map(r => {
          const risksStr = (r.risks || []).map(e => e.risk_name).join(', ');
          const examsStr = (r.required_exams || []).map(e => `${e.exam_name} (${e.frequency_months || 12} mesi)`).join(', ');
          return `- ID:"${r.id}" | Nome:"${r.name}"${risksStr ? ` | Rischi tipici: ${risksStr}` : ''}${examsStr ? ` | Accertamenti standard: ${examsStr}` : ''}${r.surveillance_frequency_months ? ` | Periodicità: ${r.surveillance_frequency_months} mesi` : ''}`;
        }).join('\n')
      : 'Nessuna mansione nel catalogo.';

    // Costruisci il testo del catalogo accertamenti
    const examCatalogStr = examCatalog.length > 0
      ? examCatalog.map(e => {
          const catLabel = e.category === 'prestazione_medica' ? 'Prestazione Medica' : e.category === 'accertamento_strumentale' ? 'Accertamento Strumentale' : 'Esame di Laboratorio';
          return `- "${e.name}" [${catLabel}]`;
        }).join('\n')
      : 'Nessun accertamento nel catalogo.';

    const prompt = `Sei un Medico Competente esperto in medicina del lavoro (D.Lgs. 81/2008).
Ti viene fornito un DVR (Documento di Valutazione dei Rischi) dell'azienda${company_name ? ` "${company_name}"` : ''}.

IL TUO COMPITO:
1. Leggi il DVR e identifica TUTTE le mansioni/figure professionali presenti nell'azienda (cercale nelle sezioni dedicate alla valutazione dei rischi per mansione, negli organigrammi, nelle tabelle del personale, ecc.)
2. Per ogni mansione trovata nel DVR, abbinala alla mansione più simile del CATALOGO MANSIONI CONFIGURATO nel sistema
3. Per ogni mansione, assegna gli accertamenti sanitari appropriati scegliendo ESCLUSIVAMENTE tra quelli del CATALOGO ACCERTAMENTI

CATALOGO MANSIONI CONFIGURATO NEL SISTEMA (usa questi come riferimento per l'abbinamento):
${jobRolesCatalogStr}

CATALOGO ACCERTAMENTI DISPONIBILI (usa SOLO questi nomi negli accertamenti):
${examCatalogStr}

REGOLE:
- Estrai TUTTE le mansioni presenti nel DVR, anche se non sono nel catalogo mansioni
- Se una mansione del DVR corrisponde (anche parzialmente) a una del catalogo, usa il nome del catalogo e il suo ID (catalog_match_id, catalog_match_name)
- Se non c'è corrispondenza, usa il nome trovato nel DVR (catalog_match_status = "none")
- Per gli accertamenti, scegli SOLO nomi presenti nel CATALOGO ACCERTAMENTI (adatta la nomenclatura se necessario)
- La periodicità della visita medica: 12 mesi per rischi alti, 24 mesi per rischi medi/bassi
- Includi SEMPRE "Visita Medica" come primo accertamento

Nel "summary" descrivi: tipo azienda, mansioni principali trovate nel DVR, note rilevanti.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Sommario: tipo azienda, mansioni trovate, rischi principali (max 400 caratteri)'
          },
          roles: {
            type: 'array',
            description: 'Una voce per ogni mansione trovata nel DVR',
            items: {
              type: 'object',
              properties: {
                role_name: {
                  type: 'string',
                  description: 'Nome mansione: usa il nome del catalogo se trovata corrispondenza, altrimenti il nome dal DVR'
                },
                catalog_match_status: {
                  type: 'string',
                  description: '"exact" = corrisponde esattamente a una mansione del catalogo; "suggested" = corrispondenza probabile con nome diverso; "none" = nessuna corrispondenza nel catalogo'
                },
                catalog_match_name: {
                  type: 'string',
                  description: 'Nome della mansione del catalogo (solo se catalog_match_status è "suggested")'
                },
                catalog_match_id: {
                  type: 'string',
                  description: 'ID della mansione del catalogo abbinata (solo se catalog_match_status è "exact" o "suggested")'
                },
                risks: {
                  type: 'string',
                  description: 'Fattori di rischio identificati nel DVR per questa mansione, separati da virgola'
                },
                frequency_months: {
                  type: 'number',
                  description: 'Periodicità visita medica in mesi (12, 24 o 48)'
                },
                notes: {
                  type: 'string',
                  description: 'Note specifiche dal DVR per questa mansione'
                },
                exams: {
                  type: 'array',
                  description: 'Lista accertamenti sanitari scelti ESCLUSIVAMENTE dal catalogo accertamenti disponibili',
                  items: {
                    type: 'object',
                    properties: {
                      exam_name: {
                        type: 'string',
                        description: 'Nome esatto dell\'accertamento come appare nel catalogo'
                      },
                      frequency_months: {
                        type: 'number',
                        description: 'Periodicità in mesi (0 = secondo protocollo)'
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