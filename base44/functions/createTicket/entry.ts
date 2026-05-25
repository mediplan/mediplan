import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, description, priority, category, company_id, company_name } = body;

    if (!subject || !description) {
      return Response.json({ error: 'subject e description sono obbligatori' }, { status: 400 });
    }

    // Genera codice progressivo per l'anno corrente
    const year = new Date().getFullYear();
    const allTickets = await base44.asServiceRole.entities.Ticket.list();
    const yearTickets = allTickets.filter(t => t.ticket_code && t.ticket_code.startsWith(`${year}-`));
    const nextNum = yearTickets.length + 1;
    const ticket_code = `${year}-${String(nextNum).padStart(4, '0')}`;

    const ticket = await base44.asServiceRole.entities.Ticket.create({
      ticket_code,
      subject,
      description,
      priority: priority || 'media',
      category: category || 'altro',
      status: 'aperto',
      company_id: company_id || '',
      company_name: company_name || '',
      created_by_name: user.full_name || '',
      created_by_email: user.email || '',
      tenant_id: user.data?.tenant_id || '',
      comments: [],
      attachments: [],
      billed: false
    });

    return Response.json({ ticket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});