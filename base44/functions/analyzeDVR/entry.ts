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

    const prompt = `Sei un esperto di medicina del lavoro e sicurezza sul lavoro (D.Lgs. 81/2008).
Ti viene fornito un Documento di Valutazione dei Rischi (DVR) di un'azienda${company_name ? ` chiamata "${company_name}"` : ''}.

Analizza il DVR e genera un piano di sorveglianza sanitaria strutturato in questo modo:

Per ogni mansione/lavorazione presente nel DVR:
1. Identifica i rischi principali
2. Proponi gli accertamenti sanitari necessari con la loro periodicità (in mesi)
3. Suggerisci la frequenza delle visite mediche periodiche

Restituisci la risposta in formato JSON come indicato nello schema.
Sii preciso, usa la terminologia medico-legale italiana corretta.
Se non riesci a leggere il DVR, analizza comunque in base alle informazioni disponibili.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Breve sommario del DVR analizzato (max 300 caratteri)'
          },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role_name: { type: 'string', description: 'Nome mansione' },
                risks: { type: 'string', description: 'Rischi principali identificati' },
                frequency_months: { type: 'number', description: 'Periodicità visita medica (mesi)' },
                notes: { type: 'string', description: 'Note specifiche per questa mansione' },
                exams: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      exam_name: { type: 'string' },
                      frequency_months: { type: 'number' }
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