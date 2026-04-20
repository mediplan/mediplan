/**
 * Funzioni di stampa documenti aziendali:
 * - Protocollo Sanitario
 * - Relazione Sanitaria Annuale
 * - Verbale di Sopralluogo
 */

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  } catch { return String(d); }
};

const today = () => {
  const d = new Date();
  return fmtDate(d);
};

const header = (company, doctor, subtitle) => `
  <div style="border-bottom:2px solid #0284c7;padding-bottom:10px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:16px;font-weight:800;color:#0284c7;">MEDIPLAN</div>
      <div style="font-size:10px;color:#374151;">Medicina del Lavoro</div>
      ${doctor ? `<div style="font-size:10px;color:#374151;margin-top:2px;">${doctor.full_name}${doctor.specialization ? ' — ' + doctor.specialization : ''}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:13px;font-weight:700;">${subtitle}</div>
      <div style="font-size:10px;color:#6b7280;">${company?.name || '—'}</div>
      <div style="font-size:10px;color:#6b7280;">Data: ${today()}</div>
    </div>
  </div>`;

const section = (title, content) =>
  `<div style="margin-bottom:16px;">
    <div style="background:#0284c7;color:#fff;padding:4px 10px;font-weight:700;font-size:11px;margin-bottom:6px;border-radius:3px;">${title}</div>
    <div style="padding-left:4px;">${content}</div>
  </div>`;

const row = (label, value) =>
  value ? `<div style="display:flex;gap:8px;margin-bottom:3px;font-size:10.5px;"><span style="font-weight:600;min-width:160px;color:#374151;">${label}:</span><span style="color:#111827;">${value}</span></div>` : '';

const footerSign = (doctorName) => `
  <div style="margin-top:40px;display:flex;justify-content:space-between;">
    <div style="text-align:center;min-width:180px;">
      <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#6b7280;">Firma Datore di Lavoro / Delegato</div>
    </div>
    <div style="text-align:center;min-width:180px;">
      <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#6b7280;">Il Medico Competente${doctorName ? `<br/>(${doctorName})` : ''}</div>
    </div>
  </div>
  <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:6px;font-size:9px;color:#9ca3af;text-align:center;">
    Documento generato il ${today()} — MEDIPLAN Medicina del Lavoro
  </div>`;

function openDoc(html, title) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>
    <title>${title}</title>
    <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 24px; background:#fff; }
    @media print { body { padding: 0; } @page { margin: 15mm; size: A4; } }</style>
  </head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script></body></html>`);
  win.document.close();
}

// ─── BUILDER FUNCTIONS (return HTML string) ───────────────────────────────────

export function buildProtocolloHTML(company, patients, surveillancePlan, doctor) {
  const doctorName = doctor?.full_name || '';
  const planRoles = surveillancePlan?.roles || [];

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, 'PROTOCOLLO SANITARIO');

  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('P.IVA', company.vat_number);
  azHtml += row('Indirizzo', company.address ? `${company.address}, ${company.zip_code || ''} ${company.city || ''} ${company.province ? `(${company.province})` : ''}`.trim() : null);
  azHtml += row('Rappresentante legale', company.legal_representative);
  azHtml += row('RSPP', company.rspp);
  azHtml += row('RLS', company.rls);
  azHtml += row('N. dipendenti', company.employee_count);
  azHtml += row('Codice ATECO', company.ateco_code);
  azHtml += row('Settore', company.sector);
  azHtml += row('Medico Competente', doctorName);
  if (surveillancePlan?.version_label) azHtml += row('Versione protocollo', surveillancePlan.version_label);
  if (surveillancePlan?.approved_at) azHtml += row('Data approvazione', fmtDate(surveillancePlan.approved_at));
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);

  let tabHtml = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
    <thead><tr style="background:#0284c7;color:#fff;">
      <th style="padding:5px 8px;text-align:left;width:22%;">Mansione</th>
      <th style="padding:5px 8px;text-align:left;width:10%;">N. Lav.</th>
      <th style="padding:5px 8px;text-align:left;width:14%;">Periodicità</th>
      <th style="padding:5px 8px;text-align:left;width:24%;">Rischi</th>
      <th style="padding:5px 8px;text-align:left;">Accertamenti sanitari previsti</th>
    </tr></thead><tbody>`;

  if (planRoles.length > 0) {
    planRoles.forEach((role, idx) => {
      const patientsInRole = patients.filter(p => p.job_role_name === role.role_name);
      const freq = role.frequency_months;
      const freqLabel = freq === 6 ? 'Semestrale' : freq === 12 ? 'Annuale' : freq === 24 ? 'Biennale' : freq ? `Ogni ${freq} mesi` : '—';
      const exams = role.exams?.map(e => `${e.exam_name}${e.frequency_months ? ` (ogni ${e.frequency_months} mesi)` : ''}`).join(', ') || '—';
      const risks = role.risks || '—';
      const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
      tabHtml += `<tr style="border-bottom:1px solid #e5e7eb;background:${bg};vertical-align:top;">
        <td style="padding:5px 8px;font-weight:600;">${role.role_name || '—'}</td>
        <td style="padding:5px 8px;">${patientsInRole.length > 0 ? patientsInRole.length : '—'}</td>
        <td style="padding:5px 8px;">${freqLabel}</td>
        <td style="padding:5px 8px;color:#374151;">${risks}</td>
        <td style="padding:5px 8px;">${exams}</td>
      </tr>`;
    });
  } else {
    // fallback: usa le mansioni dai pazienti se non c'è un piano
    const allRoleNames = [...new Set(patients.map(p => p.job_role_name).filter(Boolean))];
    if (allRoleNames.length > 0) {
      allRoleNames.sort().forEach((roleName, idx) => {
        const patientsInRole = patients.filter(p => p.job_role_name === roleName);
        const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
        tabHtml += `<tr style="border-bottom:1px solid #e5e7eb;background:${bg};">
          <td style="padding:5px 8px;font-weight:600;">${roleName}</td>
          <td style="padding:5px 8px;">${patientsInRole.length}</td>
          <td style="padding:5px 8px;">—</td>
          <td style="padding:5px 8px;">—</td>
          <td style="padding:5px 8px;">—</td>
        </tr>`;
      });
    } else {
      tabHtml += `<tr><td colspan="5" style="padding:10px;text-align:center;color:#6b7280;">Nessun protocollo sanitario definito</td></tr>`;
    }
  }
  tabHtml += `</tbody></table>`;
  html += section('MANSIONI E ACCERTAMENTI SANITARI', tabHtml);

  if (surveillancePlan?.notes) {
    html += section('NOTE DEL MEDICO', `<p style="font-size:10px;line-height:1.6;color:#374151;">${surveillancePlan.notes}</p>`);
  }
  html += section('RIFERIMENTI NORMATIVI', `<p style="font-size:10px;line-height:1.6;color:#374151;">Il presente Protocollo Sanitario è redatto ai sensi del D.Lgs. 81/08 e s.m.i., art. 25 comma 1 lettera b).</p>`);
  html += footerSign(doctorName);
  html += `</div>`;
  return html;
}

export function buildRelazioneSanitariaHTML(company, patients, visits, doctor, year) {
  const doctorName = doctor?.full_name || '';
  const yr = year || new Date().getFullYear() - 1;
  const companyVisits = visits.filter(v =>
    String(v.company_id) === String(company.id) &&
    v.visit_date && new Date(v.visit_date).getFullYear() === yr
  );
  const visitTypeLabel = {
    preventiva: 'Preventiva', periodica: 'Periodica', su_richiesta: 'Su richiesta',
    cambio_mansione: 'Cambio mansione', rientro_malattia: 'Rientro malattia', cessazione: 'Cessazione',
  };
  const judgmentLabel = {
    idoneo: 'Idoneo', idoneo_con_prescrizioni: 'Idoneo c/ prescrizioni',
    idoneo_con_limitazioni: 'Idoneo c/ limitazioni',
    temporaneamente_non_idoneo: 'Temp. non idoneo', non_idoneo: 'Non idoneo',
  };
  const ACCS = [
    { key: 'audiometry_result', label: 'Audiometria' }, { key: 'spirometry_result', label: 'Spirometria' },
    { key: 'ecg_result', label: 'ECG' }, { key: 'visiotest_result', label: 'Visiotest' },
    { key: 'upper_limbs_eval_result', label: 'Arti Superiori' }, { key: 'drug_test_result', label: 'Drug Test' },
    { key: 'alcohol_test_result', label: 'Alcol Test' }, { key: 'audit_c_result', label: 'AUDIT-C' },
    { key: 'blood_tests_result', label: 'Es. ematochimici' }, { key: 'other_exams', label: 'Es. strumentali' },
    { key: 'specialist_visits_result', label: 'Visite spec.' },
  ];
  const byType = {};
  companyVisits.forEach(v => { const t = v.visit_type || 'altro'; byType[t] = (byType[t] || 0) + 1; });
  const byJudgment = {};
  companyVisits.forEach(v => { if (v.judgment) byJudgment[v.judgment] = (byJudgment[v.judgment] || 0) + 1; });
  const accCounts = {};
  ACCS.forEach(a => { const count = companyVisits.filter(v => v[`${a.key}_done`]).length; if (count > 0) accCounts[a.label] = count; });

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, `RELAZIONE SANITARIA ${yr}`);

  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('Periodo di riferimento', `01/01/${yr} — 31/12/${yr}`);
  azHtml += row('N. lavoratori sorvegliati', patients.length);
  azHtml += row('Medico Competente', doctorName);
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);

  html += section('RIEPILOGO ATTIVITÀ', `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:10px;">
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#f0f9ff;">
        <div style="font-size:22px;font-weight:800;color:#0284c7;">${companyVisits.length}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Visite totali</div>
      </div>
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#f0fdf4;">
        <div style="font-size:22px;font-weight:800;color:#16a34a;">${patients.filter(p => p.status === 'active').length}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Lavoratori attivi</div>
      </div>
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#fefce8;">
        <div style="font-size:22px;font-weight:800;color:#ca8a04;">${Object.values(accCounts).reduce((a, b) => a + b, 0)}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Accertamenti eseguiti</div>
      </div>
    </div>
  `);

  if (companyVisits.length > 0) {
    let detTable = `<table style="width:100%;border-collapse:collapse;font-size:9.5px;">
      <thead><tr style="background:#0284c7;color:#fff;">
        <th style="padding:4px 6px;text-align:left;">Lavoratore</th>
        <th style="padding:4px 6px;text-align:left;">Data</th>
        <th style="padding:4px 6px;text-align:left;">Tipo</th>
        <th style="padding:4px 6px;text-align:left;">Giudizio</th>
        <th style="padding:4px 6px;text-align:left;">Prossima visita</th>
      </tr></thead><tbody>`;
    const sorted = [...companyVisits].sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    sorted.forEach((v, i) => {
      detTable += `<tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:3px 6px;font-weight:500;">${v.patient_name || '—'}</td>
        <td style="padding:3px 6px;">${fmtDate(v.visit_date)}</td>
        <td style="padding:3px 6px;">${visitTypeLabel[v.visit_type] || v.visit_type || '—'}</td>
        <td style="padding:3px 6px;">${judgmentLabel[v.judgment] || '—'}</td>
        <td style="padding:3px 6px;">${fmtDate(v.next_visit_date)}</td>
      </tr>`;
    });
    detTable += `</tbody></table>`;
    html += section('ELENCO DETTAGLIATO PRESTAZIONI', detTable);
  }

  html += footerSign(doctorName);
  html += `</div>`;
  return html;
}

export function buildVerbaleHTML(company, doctor, date) {
  const doctorName = doctor?.full_name || '';
  const visitDate = date || today();

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, 'VERBALE DI SOPRALLUOGO');

  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('P.IVA', company.vat_number);
  azHtml += row('Indirizzo sede', company.address ? `${company.address}, ${company.zip_code || ''} ${company.city || ''} ${company.province ? `(${company.province})` : ''}`.trim() : null);
  azHtml += row('Rappresentante legale', company.legal_representative);
  azHtml += row('RSPP', company.rspp);
  azHtml += row('RLS', company.rls);
  azHtml += row('Medico Competente', doctorName);
  azHtml += row('Data sopralluogo', visitDate);
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);
  html += section('PARTECIPANTI AL SOPRALLUOGO', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">${row('Medico Competente', doctorName)}${row('Datore di lavoro / Delegato', '&nbsp;')}${row('RSPP', company.rspp || '&nbsp;')}${row('RLS', company.rls || '&nbsp;')}</div>`);
  html += section('AMBIENTI E REPARTI VISITATI', `<div style="min-height:60px;border:1px dashed #d1d5db;border-radius:4px;padding:8px;font-size:10px;color:#9ca3af;">[Da compilare durante il sopralluogo]</div>`);
  html += section('OSSERVAZIONI E PRESCRIZIONI', `<div style="min-height:80px;border:1px dashed #d1d5db;border-radius:4px;padding:8px;font-size:10px;color:#9ca3af;">[Osservazioni del medico competente]</div>`);
  html += footerSign(doctorName);
  html += `</div>`;
  return html;
}

// ─── PROTOCOLLO SANITARIO ─────────────────────────────────────────────────────

export function openProtocolloSanitario(company, patients, jobRoles, doctor) {
  const doctorName = doctor?.full_name || '';

  // Raggruppa pazienti per mansione
  const roleMap = {};
  patients.forEach(p => {
    const key = p.job_role_name || 'Non specificata';
    if (!roleMap[key]) roleMap[key] = { patients: [], roleId: p.job_role_id };
    roleMap[key].patients.push(p);
  });

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, 'PROTOCOLLO SANITARIO');

  // Dati azienda
  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('P.IVA', company.vat_number);
  azHtml += row('Indirizzo', company.address ? `${company.address}, ${company.zip_code || ''} ${company.city || ''} ${company.province ? `(${company.province})` : ''}`.trim() : null);
  azHtml += row('Rappresentante legale', company.legal_representative);
  azHtml += row('RSPP', company.rspp);
  azHtml += row('RLS', company.rls);
  azHtml += row('N. dipendenti', company.employee_count);
  azHtml += row('Codice ATECO', company.ateco_code);
  azHtml += row('Settore', company.sector);
  azHtml += row('Medico Competente', doctorName);
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);

  // Tabella mansioni + accertamenti
  let tabHtml = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
    <thead><tr style="background:#0284c7;color:#fff;">
      <th style="padding:5px 8px;text-align:left;width:22%;">Mansione</th>
      <th style="padding:5px 8px;text-align:left;width:10%;">N. Lav.</th>
      <th style="padding:5px 8px;text-align:left;width:20%;">Periodicità</th>
      <th style="padding:5px 8px;text-align:left;">Accertamenti sanitari previsti</th>
    </tr></thead><tbody>`;

  const allRoleNames = [...new Set(patients.map(p => p.job_role_name).filter(Boolean))];

  if (allRoleNames.length > 0) {
    allRoleNames.sort().forEach((roleName, idx) => {
      const patientsInRole = patients.filter(p => p.job_role_name === roleName);
      const roleId = patientsInRole[0]?.job_role_id;
      const role = roleId ? jobRoles.find(r => String(r.id) === String(roleId)) : null;
      const freq = role?.surveillance_frequency_months;
      const freqLabel = freq === 6 ? 'Semestrale' : freq === 12 ? 'Annuale' : freq === 24 ? 'Biennale' : freq ? `Ogni ${freq} mesi` : '—';
      const exams = role?.required_exams?.map(e => e.exam_name).join(', ') || '—';
      const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
      tabHtml += `<tr style="border-bottom:1px solid #e5e7eb;background:${bg};">
        <td style="padding:5px 8px;font-weight:600;">${roleName}</td>
        <td style="padding:5px 8px;">${patientsInRole.length}</td>
        <td style="padding:5px 8px;">${freqLabel}</td>
        <td style="padding:5px 8px;">${exams}</td>
      </tr>`;
    });
  } else {
    tabHtml += `<tr><td colspan="4" style="padding:10px;text-align:center;color:#6b7280;">Nessuna mansione definita</td></tr>`;
  }

  tabHtml += `</tbody></table>`;
  html += section('MANSIONI E ACCERTAMENTI SANITARI', tabHtml);

  // Note legali
  html += section('NOTE', `<p style="font-size:10px;line-height:1.6;color:#374151;">
    Il presente Protocollo Sanitario è redatto ai sensi del D.Lgs. 81/08 e s.m.i., art. 25 comma 1 lettera b), in base alla valutazione dei rischi effettuata dal Datore di Lavoro con il supporto del Medico Competente. 
    Gli accertamenti sanitari preventivi e periodici sono finalizzati alla tutela della salute e sicurezza dei lavoratori.
  </p>`);

  html += footerSign(doctorName);
  html += `</div>`;

  openDoc(html, `Protocollo Sanitario - ${company.name}`);
}

// ─── RELAZIONE SANITARIA ANNUALE ──────────────────────────────────────────────

export function openRelazioneSanitaria(company, patients, visits, doctor, year) {
  const doctorName = doctor?.full_name || '';
  const yr = year || new Date().getFullYear() - 1;

  // Filtra visite dell'anno selezionato per questa azienda
  const companyVisits = visits.filter(v =>
    String(v.company_id) === String(company.id) &&
    v.visit_date && new Date(v.visit_date).getFullYear() === yr
  );

  const visitTypeLabel = {
    preventiva: 'Preventiva', periodica: 'Periodica', su_richiesta: 'Su richiesta',
    cambio_mansione: 'Cambio mansione', rientro_malattia: 'Rientro malattia', cessazione: 'Cessazione',
  };
  const judgmentLabel = {
    idoneo: 'Idoneo', idoneo_con_prescrizioni: 'Idoneo c/ prescrizioni',
    idoneo_con_limitazioni: 'Idoneo c/ limitazioni',
    temporaneamente_non_idoneo: 'Temp. non idoneo', non_idoneo: 'Non idoneo',
  };

  const ACCS = [
    { key: 'audiometry_result', label: 'Audiometria' },
    { key: 'spirometry_result', label: 'Spirometria' },
    { key: 'ecg_result', label: 'ECG' },
    { key: 'visiotest_result', label: 'Visiotest' },
    { key: 'upper_limbs_eval_result', label: 'Arti Superiori' },
    { key: 'drug_test_result', label: 'Drug Test' },
    { key: 'alcohol_test_result', label: 'Alcol Test' },
    { key: 'audit_c_result', label: 'AUDIT-C' },
    { key: 'blood_tests_result', label: 'Es. ematochimici' },
    { key: 'other_exams', label: 'Es. strumentali' },
    { key: 'specialist_visits_result', label: 'Visite spec.' },
  ];

  // Conteggi per tipo visita
  const byType = {};
  companyVisits.forEach(v => {
    const t = v.visit_type || 'altro';
    byType[t] = (byType[t] || 0) + 1;
  });

  // Conteggi per giudizio
  const byJudgment = {};
  companyVisits.forEach(v => {
    if (v.judgment) byJudgment[v.judgment] = (byJudgment[v.judgment] || 0) + 1;
  });

  // Conteggi accertamenti
  const accCounts = {};
  ACCS.forEach(a => {
    const count = companyVisits.filter(v => v[`${a.key}_done`]).length;
    if (count > 0) accCounts[a.label] = count;
  });

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, `RELAZIONE SANITARIA ${yr}`);

  // Dati azienda
  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('Periodo di riferimento', `01/01/${yr} — 31/12/${yr}`);
  azHtml += row('N. lavoratori sorvegliati', patients.length);
  azHtml += row('Medico Competente', doctorName);
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);

  // Riepilogo attività
  html += section('RIEPILOGO ATTIVITÀ', `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:10px;">
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#f0f9ff;">
        <div style="font-size:22px;font-weight:800;color:#0284c7;">${companyVisits.length}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Visite totali</div>
      </div>
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#f0fdf4;">
        <div style="font-size:22px;font-weight:800;color:#16a34a;">${patients.filter(p => p.status === 'active').length}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Lavoratori attivi</div>
      </div>
      <div style="border:1px solid #d1d5db;border-radius:4px;padding:10px;text-align:center;background:#fefce8;">
        <div style="font-size:22px;font-weight:800;color:#ca8a04;">${Object.values(accCounts).reduce((a, b) => a + b, 0)}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Accertamenti eseguiti</div>
      </div>
    </div>
  `);

  // Visite per tipo
  if (Object.keys(byType).length > 0) {
    let typeTable = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="text-align:left;padding:4px 8px;">Tipo visita</th>
        <th style="text-align:right;padding:4px 8px;width:80px;">N.</th>
      </tr></thead><tbody>`;
    Object.entries(byType).forEach(([type, count], i) => {
      typeTable += `<tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:4px 8px;">${visitTypeLabel[type] || type}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:600;">${count}</td>
      </tr>`;
    });
    typeTable += `</tbody></table>`;
    html += section('VISITE PER TIPOLOGIA', typeTable);
  }

  // Giudizi
  if (Object.keys(byJudgment).length > 0) {
    let judTable = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="text-align:left;padding:4px 8px;">Giudizio</th>
        <th style="text-align:right;padding:4px 8px;width:80px;">N.</th>
      </tr></thead><tbody>`;
    const judColors = {
      idoneo: '#16a34a', idoneo_con_prescrizioni: '#d97706', idoneo_con_limitazioni: '#d97706',
      temporaneamente_non_idoneo: '#dc2626', non_idoneo: '#dc2626',
    };
    Object.entries(byJudgment).forEach(([j, count], i) => {
      judTable += `<tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:4px 8px;font-weight:500;color:${judColors[j] || '#374151'};">${judgmentLabel[j] || j}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:600;">${count}</td>
      </tr>`;
    });
    judTable += `</tbody></table>`;
    html += section('GIUDIZI DI IDONEITÀ', judTable);
  }

  // Accertamenti eseguiti
  if (Object.keys(accCounts).length > 0) {
    let accTable = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="text-align:left;padding:4px 8px;">Accertamento</th>
        <th style="text-align:right;padding:4px 8px;width:80px;">N.</th>
      </tr></thead><tbody>`;
    Object.entries(accCounts).forEach(([label, count], i) => {
      accTable += `<tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:4px 8px;">${label}</td>
        <td style="padding:4px 8px;text-align:right;font-weight:600;">${count}</td>
      </tr>`;
    });
    accTable += `</tbody></table>`;
    html += section('ACCERTAMENTI INTEGRATIVI ESEGUITI', accTable);
  }

  // Elenco dettagliato visite
  if (companyVisits.length > 0) {
    let detTable = `<table style="width:100%;border-collapse:collapse;font-size:9.5px;">
      <thead><tr style="background:#0284c7;color:#fff;">
        <th style="padding:4px 6px;text-align:left;">Lavoratore</th>
        <th style="padding:4px 6px;text-align:left;">Data</th>
        <th style="padding:4px 6px;text-align:left;">Tipo</th>
        <th style="padding:4px 6px;text-align:left;">Giudizio</th>
        <th style="padding:4px 6px;text-align:left;">Prossima visita</th>
      </tr></thead><tbody>`;
    const sorted = [...companyVisits].sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    sorted.forEach((v, i) => {
      detTable += `<tr style="border-bottom:1px solid #e5e7eb;background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:3px 6px;font-weight:500;">${v.patient_name || '—'}</td>
        <td style="padding:3px 6px;">${fmtDate(v.visit_date)}</td>
        <td style="padding:3px 6px;">${visitTypeLabel[v.visit_type] || v.visit_type || '—'}</td>
        <td style="padding:3px 6px;">${judgmentLabel[v.judgment] || '—'}</td>
        <td style="padding:3px 6px;">${fmtDate(v.next_visit_date)}</td>
      </tr>`;
    });
    detTable += `</tbody></table>`;
    html += section('ELENCO DETTAGLIATO PRESTAZIONI', detTable);
  }

  html += footerSign(doctorName);
  html += `</div>`;

  openDoc(html, `Relazione Sanitaria ${yr} - ${company.name}`);
}

// ─── VERBALE DI SOPRALLUOGO ───────────────────────────────────────────────────

export function openVerbaleSupralluogo(company, doctor, date) {
  const doctorName = doctor?.full_name || '';
  const visitDate = date || today();

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
  html += header(company, doctor, 'VERBALE DI SOPRALLUOGO');

  // Dati azienda
  let azHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  azHtml += row('Ragione sociale', company.name);
  azHtml += row('P.IVA', company.vat_number);
  azHtml += row('Indirizzo sede', company.address ? `${company.address}, ${company.zip_code || ''} ${company.city || ''} ${company.province ? `(${company.province})` : ''}`.trim() : null);
  azHtml += row('Rappresentante legale', company.legal_representative);
  azHtml += row('RSPP', company.rspp);
  azHtml += row('RLS', company.rls);
  azHtml += row('N. dipendenti', company.employee_count);
  azHtml += row('Medico Competente', doctorName);
  azHtml += row('Data sopralluogo', visitDate);
  azHtml += `</div>`;
  html += section('DATI AZIENDA', azHtml);

  // Partecipanti
  html += section('PARTECIPANTI AL SOPRALLUOGO', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">
      ${row('Medico Competente', doctorName)}
      ${row('Datore di lavoro / Delegato', '&nbsp;')}
      ${row('RSPP', company.rspp || '&nbsp;')}
      ${row('RLS', company.rls || '&nbsp;')}
    </div>
  `);

  // Ambienti visitati
  html += section('AMBIENTI E REPARTI VISITATI', `
    <div style="min-height:60px;border:1px dashed #d1d5db;border-radius:4px;padding:8px;font-size:10px;color:#9ca3af;">
      [Da compilare durante il sopralluogo]
    </div>
  `);

  // Rischi rilevati
  html += section('RISCHI RILEVATI', `
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="padding:4px 8px;text-align:left;width:30%;">Rischio</th>
        <th style="padding:4px 8px;text-align:left;width:20%;">Livello</th>
        <th style="padding:4px 8px;text-align:left;">Note / Misure di prevenzione</th>
      </tr></thead>
      <tbody>
        ${[1,2,3,4].map(i => `<tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px 8px;">&nbsp;</td>
          <td style="padding:6px 8px;">&nbsp;</td>
          <td style="padding:6px 8px;">&nbsp;</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `);

  // DPI verificati
  html += section('VERIFICA DPI', `
    <div style="min-height:40px;border:1px dashed #d1d5db;border-radius:4px;padding:8px;font-size:10px;color:#9ca3af;">
      [Elenco DPI verificati e loro stato di utilizzo]
    </div>
  `);

  // Osservazioni e prescrizioni
  html += section('OSSERVAZIONI E PRESCRIZIONI', `
    <div style="min-height:80px;border:1px dashed #d1d5db;border-radius:4px;padding:8px;font-size:10px;color:#9ca3af;">
      [Osservazioni del medico competente e prescrizioni impartite]
    </div>
  `);

  // Prossimo sopralluogo
  html += section('PROSSIMO SOPRALLUOGO', `
    <div style="display:flex;gap:24px;font-size:10.5px;">
      ${row('Data prevista', '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')}
    </div>
  `);

  html += footerSign(doctorName);
  html += `</div>`;

  openDoc(html, `Verbale Sopralluogo - ${company.name}`);
}