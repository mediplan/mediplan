/**
 * Genera l'HTML completo per la stampa/PDF della cartella sanitaria.
 * @param {object} f - dati della visita (MedicalVisit)
 * @param {object} pat - dati del paziente (Patient)
 * @param {object} company - dati dell'azienda (Company)
 */
export function buildPrintHTML(f = {}, pat = null, company = null) {
  const visitTypeLabel = {
    preventiva: 'Preventiva', periodica: 'Periodica', su_richiesta: 'Su richiesta',
    cambio_mansione: 'Cambio mansione', rientro_malattia: 'Rientro malattia', cessazione: 'Cessazione',
  };
  const judgmentLabel = {
    idoneo: 'IDONEO', idoneo_con_prescrizioni: 'IDONEO CON PRESCRIZIONI',
    idoneo_con_limitazioni: 'IDONEO CON LIMITAZIONI',
    temporaneamente_non_idoneo: 'TEMPORANEAMENTE NON IDONEO', non_idoneo: 'NON IDONEO',
  };
  const judgmentColor = {
    idoneo: '#16a34a', idoneo_con_prescrizioni: '#d97706', idoneo_con_limitazioni: '#d97706',
    temporaneamente_non_idoneo: '#dc2626', non_idoneo: '#dc2626',
  };

  const ACCS = [
    { key: 'audiometry_result', label: 'Audiometria' },
    { key: 'spirometry_result', label: 'Spirometria' },
    { key: 'ecg_result', label: 'ECG' },
    { key: 'visiotest_result', label: 'Visiotest' },
    { key: 'upper_limbs_eval_result', label: 'Valutazione Arti Superiori' },
    { key: 'drug_test_result', label: 'Drug Test' },
    { key: 'alcohol_test_result', label: 'Alcol Test' },
    { key: 'audit_c_result', label: 'Questionario AUDIT-C' },
    { key: 'blood_tests_result', label: 'Esami ematochimici' },
    { key: 'other_exams', label: 'Esami strumentali aggiuntivi' },
    { key: 'specialist_visits_result', label: 'Visite specialistiche aggiuntive' },
  ];

  const SYSTEMS = [
    { key: 'systems_respiratory', label: 'Apparato respiratorio' },
    { key: 'systems_cardiovascular', label: 'Apparato cardiovascolare' },
    { key: 'systems_gastrointestinal', label: 'Apparato gastrointestinale' },
    { key: 'systems_urogenital', label: 'Apparato urogenitale' },
    { key: 'systems_musculoskeletal', label: 'Apparato muscoloscheletrico' },
    { key: 'systems_hearing', label: 'Udito' },
    { key: 'systems_vestibular', label: 'Apparato vestibolare' },
    { key: 'systems_skin', label: 'Cute e annessi' },
    { key: 'systems_nervous', label: 'Sistema nervoso' },
    { key: 'systems_psych', label: 'Sfera psichica' },
  ];

  const sysLabel = { non_sintomi: 'Neg.', sintomi_oltre_1a: 'Sintomi > 1a', sintomi_meno_1a: 'Sintomi < 1a' };

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    } catch { return String(d); }
  };

  const row = (label, value) =>
    value ? `<div style="display:flex;gap:8px;margin-bottom:3px;font-size:10.5px;"><span style="font-weight:600;min-width:160px;color:#374151;">${label}:</span><span style="color:#111827;flex:1;">${value}</span></div>` : '';

  const section = (title, content) =>
    `<div style="margin-bottom:18px;"><div style="background:#0284c7;color:#fff;padding:4px 10px;font-weight:700;font-size:11px;margin-bottom:6px;border-radius:3px;">${title}</div><div style="padding-left:4px;">${content}</div></div>`;

  const yesNo = (val) => val === true || val === 'true' ? 'Sì' : val === false || val === 'false' ? 'No' : (val || '');
  const obj = (o) => { if (!o || typeof o !== 'object') return ''; return Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', '); };

  let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;

  // ── INTESTAZIONE ──────────────────────────────────────────────────────────
  html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:2px solid #0284c7;padding-bottom:12px;">
    <div><div style="font-size:18px;font-weight:800;color:#0284c7;">MEDIPLAN</div><div style="font-size:10px;color:#6b7280;">Medicina del Lavoro</div></div>
    <div style="text-align:right;">
      <div style="font-size:13px;font-weight:700;">CARTELLA SANITARIA</div>
      <div style="font-size:10px;color:#6b7280;">Visita ${visitTypeLabel[f.visit_type] || f.visit_type || ''}</div>
      <div style="font-size:10px;color:#6b7280;">Data: ${fmtDate(f.visit_date)}</div>
    </div>
  </div>`;

  // ── DATI LAVORATORE ───────────────────────────────────────────────────────
  let lav = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
  lav += row('Nominativo', f.patient_name);
  lav += row('Azienda', f.company_name);
  if (pat) {
    lav += row('Codice fiscale', pat.fiscal_code);
    lav += row('Data di nascita', fmtDate(pat.birth_date));
    lav += row('Luogo di nascita', pat.birth_place ? `${pat.birth_place}${pat.birth_province ? ` (${pat.birth_province})` : ''}` : null);
    lav += row('Sesso', pat.gender);
    lav += row('Nazionalità', pat.nationality);
    lav += row('Mansione principale', pat.job_role_name);
    if (pat.job_role_secondary1_name) lav += row('Mansione secondaria', pat.job_role_secondary1_name);
    if (pat.job_role_secondary2_name) lav += row('Mansione secondaria 2', pat.job_role_secondary2_name);
    lav += row('Matricola', pat.employee_number);
    lav += row('Data assunzione', fmtDate(pat.hire_date));
    lav += row('Tipo contratto', pat.contract_type);
    lav += row('Telefono', pat.phone);
    lav += row('Email', pat.email);
    lav += row('Residenza', pat.residence_address ? `${pat.residence_address}, ${pat.residence_zip || ''} ${pat.residence_city || ''} ${pat.residence_province ? `(${pat.residence_province})` : ''}`.trim() : null);
    lav += row('Codice fiscale', pat.fiscal_code);
    lav += row('Medico curante', pat.gp_name ? `${pat.gp_name}${pat.gp_city ? ` - ${pat.gp_city}` : ''}` : null);
    lav += row('Gruppo sanguigno', pat.blood_type && pat.blood_type !== 'unknown' ? pat.blood_type : null);
    lav += row('Allergie', pat.allergies);
    lav += row('Patologie croniche', pat.chronic_conditions);
    lav += row('Terapie in corso', pat.current_medications);
  }
  lav += `</div>`;
  html += section('DATI LAVORATORE', lav);

  // ── DATI AZIENDA ──────────────────────────────────────────────────────────
  if (company) {
    let az = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
    az += row('Ragione sociale', company.name);
    az += row('Partita IVA', company.vat_number);
    az += row('Codice fiscale', company.fiscal_code);
    az += row('Indirizzo', company.address ? `${company.address}, ${company.zip_code || ''} ${company.city || ''} ${company.province ? `(${company.province})` : ''}`.trim() : null);
    az += row('Telefono', company.phone);
    az += row('Email', company.email);
    az += row('Codice ATECO', company.ateco_code);
    az += row('Settore', company.sector);
    az += row('Rappresentante legale', company.legal_representative);
    az += row('RSPP', company.rspp);
    az += row('RLS', company.rls);
    az += row('N. dipendenti', company.employee_count);
    az += `</div>`;
    html += section('DATI AZIENDA', az);
  }

  // ── ANAMNESI LAVORATIVA ───────────────────────────────────────────────────
  if (f.anamnesis_work) {
    let al = `<p style="white-space:pre-wrap;line-height:1.5;font-size:10.5px;">${f.anamnesis_work}</p>`;
    if (f.anamnesis_work_concurrent) al += `<p style="margin-top:4px;font-size:10.5px;"><strong>Esposizione contemporanea:</strong> ${f.anamnesis_work_concurrent_details || 'Sì'}</p>`;
    html += section('ANAMNESI LAVORATIVA', al);
  }

  // ── ANAMNESI FAMILIARE ────────────────────────────────────────────────────
  const fam = f.anamnesis_family_structured;
  if (fam && typeof fam === 'object') {
    const memberLabel = { father: 'Padre', mother: 'Madre', partner: 'Partner' };
    let famHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
    ['father', 'mother', 'partner'].forEach(m => {
      const d = fam[m];
      if (!d) return;
      const label = memberLabel[m];
      if (d.alive === false || d.alive === 'false') {
        famHtml += row(label, `Deceduto${d.cause_of_death ? ` (${d.cause_of_death})` : ''}`);
      } else if (d.alive === true || d.alive === 'true') {
        famHtml += row(label, `Vivente${d.conditions ? ` - ${d.conditions}` : ''}`);
      }
    });
    if (fam.children_count) famHtml += row('Figli', fam.children_count);
    if (fam.collateral_conditions) famHtml += row('Collaterali', fam.collateral_conditions);
    if (fam.family_pathologies) famHtml += row('Patologie familiari', fam.family_pathologies);
    famHtml += `</div>`;
    if (famHtml.includes('<span')) html += section('ANAMNESI FAMILIARE', famHtml);
  }

  // ── ANAMNESI FISIOLOGICA ──────────────────────────────────────────────────
  const fisio = f.anamnesis_physiological_structured;
  if (fisio && typeof fisio === 'object' && Object.keys(fisio).length > 0) {
    let fHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
    fHtml += row('Parto', fisio.birth_type);
    fHtml += row('Allattamento', fisio.breastfeeding);
    fHtml += row('Sviluppo psicomotorio', fisio.psychomotor_development);
    fHtml += row('Pubertà', fisio.puberty);
    fHtml += row('Istruzione', fisio.education);
    fHtml += row('Stato civile', fisio.marital_status);
    fHtml += row('Alvo', fisio.bowel);
    fHtml += row('Diuresi', fisio.diuresis);
    fHtml += row('Sonno', fisio.sleep);
    fHtml += row('Allergie', fisio.allergies);
    fHtml += row('Vaccinazioni', fisio.vaccinations);
    if (fisio.menstrual_cycle) fHtml += row('Ciclo mestruale', fisio.menstrual_cycle);
    if (fisio.pregnancies) fHtml += row('Gravidanze', fisio.pregnancies);
    fHtml += `</div>`;
    if (fHtml.includes('<span')) html += section('ANAMNESI FISIOLOGICA', fHtml);
  }

  // ── ABITUDINI DI VITA ─────────────────────────────────────────────────────
  const life = f.lifestyle_structured;
  if (life && typeof life === 'object' && Object.keys(life).length > 0) {
    let lHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
    if (life.smoking) lHtml += row('Fumo', life.smoking_detail || life.smoking);
    if (life.alcohol) lHtml += row('Alcol', life.alcohol_detail || life.alcohol);
    if (life.coffee) lHtml += row('Caffè', life.coffee_detail || life.coffee);
    if (life.sports) lHtml += row('Attività sportiva', life.sports_detail || life.sports);
    if (life.diet) lHtml += row('Dieta', life.diet);
    if (life.blood_donor) lHtml += row('Donatore sangue', 'Sì');
    lHtml += `</div>`;
    if (lHtml.includes('<span')) html += section('ABITUDINI DI VITA', lHtml);
  }

  // ── ANAMNESI PATOLOGICA ───────────────────────────────────────────────────
  if (f.anamnesis_pathological || f.anamnesis_injuries || f.anamnesis_occupational_disease || f.anamnesis_disability) {
    let ap = '';
    if (f.anamnesis_pathological) ap += `<p style="white-space:pre-wrap;margin-bottom:4px;font-size:10.5px;">${f.anamnesis_pathological}</p>`;
    if (f.anamnesis_injuries) ap += row('Infortuni', f.anamnesis_injuries_details || 'Sì');
    if (f.anamnesis_occupational_disease) ap += row('Malattie professionali', f.anamnesis_occupational_disease_details || 'Sì');
    if (f.anamnesis_disability) ap += row('Invalidità', f.anamnesis_disability_details || 'Sì');
    html += section('ANAMNESI PATOLOGICA PROSSIMA E REMOTA', ap);
  }

  // ── ANAMNESI PER APPARATI ─────────────────────────────────────────────────
  const allSystems = SYSTEMS.map(s => ({ ...s, val: f[s.key], details: f[`${s.key}_details`] }));
  if (allSystems.some(s => s.val)) {
    let st = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="text-align:left;padding:3px 6px;width:38%;">Apparato</th>
        <th style="text-align:left;padding:3px 6px;width:22%;">Esito</th>
        <th style="text-align:left;padding:3px 6px;">Note</th>
      </tr></thead><tbody>`;
    allSystems.forEach(s => {
      if (!s.val) return;
      const isNeg = s.val === 'non_sintomi';
      const color = isNeg ? '#374151' : '#dc2626';
      st += `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:3px 6px;">${s.label}</td>
        <td style="padding:3px 6px;font-weight:${isNeg ? '400' : '600'};color:${color};">${sysLabel[s.val] || s.val}</td>
        <td style="padding:3px 6px;">${s.details || ''}</td>
      </tr>`;
    });
    st += `</tbody></table>`;
    html += section('ANAMNESI PER APPARATI', st);
  }

  // ── ESAME OBIETTIVO (completo) ────────────────────────────────────────────
  const hasObjData = f.height_cm || f.weight_kg || f.blood_pressure_systolic || f.obj_biotipo ||
    f.obj_lymphnodes || f.obj_oral || f.obj_skin_color || f.obj_thorax || f.obj_murmur ||
    f.obj_heart_tones || f.obj_abdomen_structured || f.obj_liver || f.obj_spine_palpation ||
    f.obj_nervous_sensitivity || f.obj_romberg || f.obj_reflexes || f.obj_notes;

  if (hasObjData) {
    let objHtml = '';

    // Parametri vitali
    if (f.height_cm || f.weight_kg || f.blood_pressure_systolic || f.heart_rate) {
      objHtml += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px 16px;margin-bottom:8px;padding:6px 8px;background:#f8fafc;border-radius:3px;">`;
      if (f.height_cm) objHtml += row('Altezza', `${f.height_cm} cm`);
      if (f.weight_kg) objHtml += row('Peso', `${f.weight_kg} kg`);
      if (f.height_cm && f.weight_kg) {
        const bmi = (f.weight_kg / ((f.height_cm / 100) ** 2)).toFixed(1);
        objHtml += row('BMI', bmi);
      }
      if (f.blood_pressure_systolic) objHtml += row('PA', `${f.blood_pressure_systolic}/${f.blood_pressure_diastolic || '?'} mmHg${f.obj_pa_position ? ` (${f.obj_pa_position})` : ''}`);
      if (f.heart_rate) objHtml += row('FC', `${f.heart_rate} bpm`);
      if (f.obj_biotipo) objHtml += row('Biotipo', f.obj_biotipo);
      objHtml += `</div>`;
    }

    const objRows = [
      ['Linfonodi', f.obj_lymphnodes, f.obj_lymphnodes_notes],
      ['Cavo orale', f.obj_oral, f.obj_oral_notes],
      ['Colorito cutaneo', f.obj_skin_color, null],
      ['Trofismo cutaneo', f.obj_skin_trophism, f.obj_skin_trophism_notes],
      ['Annessi cutanei', f.obj_skin_appendages, f.obj_skin_appendages_notes],
      ['Capo e collo', f.obj_head_neck, f.obj_head_neck_notes],
      ['Torace', f.obj_thorax, f.obj_thorax_notes],
      ['Fremito', f.obj_fremito, f.obj_fremito_notes],
      ['Fonesi', f.obj_fonesi, f.obj_fonesi_notes],
      ['Murmure', f.obj_murmur, f.obj_murmur_notes],
      ['Toni cardiaci', f.obj_heart_tones, f.obj_heart_tones_notes],
      ['Pause cardiache', f.obj_cardiac_pauses, f.obj_cardiac_pauses_notes],
      ['Fegato', f.obj_liver, f.obj_liver_pain ? `${f.obj_liver}${f.obj_liver_cm ? ` +${f.obj_liver_cm}cm` : ''} - ${f.obj_liver_pain}` : null],
      ['Milza', f.obj_spleen, f.obj_spleen_notes],
      ['Manovra di Giordano', f.obj_giordano, f.obj_giordano_notes],
      ['Lasègue', f.obj_lasegue, f.obj_lasegue_notes],
      ['Wasserman', f.obj_wasserman, f.obj_wasserman_notes],
      ['Tinel', f.obj_tinel, f.obj_tinel_notes],
      ['Phalen', f.obj_phalen, f.obj_phalen_notes],
      ['Finkelstein', f.obj_finkelstein, f.obj_finkelstein_notes],
      ['Colonna vertebrale', f.obj_spine_palpation, f.obj_spine_palpation_notes],
      ['Mobilità vertebrale', f.obj_spine_mobility, f.obj_spine_mobility_notes],
      ['Sensibilità', f.obj_nervous_sensitivity, f.obj_nervous_sensitivity_notes],
      ['Forza muscolare', f.obj_nervous_strength, f.obj_nervous_strength_notes],
      ['Coordinazione', f.obj_nervous_coordination, f.obj_nervous_coordination_notes],
      ['Tremori', f.obj_tremors, f.obj_tremors_notes],
      ['Romberg', f.obj_romberg, f.obj_romberg_notes],
      ['Riflessi', f.obj_reflexes, f.obj_reflexes_notes],
    ];

    const filledRows = objRows.filter(([, v]) => v);
    if (filledRows.length > 0) {
      objHtml += `<table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="text-align:left;padding:3px 6px;width:30%;">Parametro</th>
          <th style="text-align:left;padding:3px 6px;width:25%;">Valore</th>
          <th style="text-align:left;padding:3px 6px;">Note</th>
        </tr></thead><tbody>`;
      filledRows.forEach(([label, val, note]) => {
        objHtml += `<tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:3px 6px;font-weight:500;">${label}</td>
          <td style="padding:3px 6px;">${val || ''}</td>
          <td style="padding:3px 6px;color:#4b5563;">${note || ''}</td>
        </tr>`;
      });
      objHtml += `</tbody></table>`;
    }

    if (f.obj_upper_limbs) objHtml += `<div style="margin-top:6px;">${row('Arti superiori', f.obj_upper_limbs)}</div>`;
    if (f.obj_lower_limbs) objHtml += row('Arti inferiori', f.obj_lower_limbs);
    if (f.current_symptoms) objHtml += `<p style="margin-top:6px;font-size:10.5px;white-space:pre-wrap;"><strong>Sintomatologia attuale:</strong> ${f.current_symptoms}</p>`;
    if (f.obj_notes) objHtml += `<p style="margin-top:6px;font-size:10.5px;white-space:pre-wrap;"><strong>Note:</strong> ${f.obj_notes}</p>`;

    html += section('ESAME OBIETTIVO', objHtml);
  }

  // ── ACCERTAMENTI ──────────────────────────────────────────────────────────
  const doneAcc = ACCS.filter(a => f[`${a.key}_done`]);
  if (doneAcc.length > 0) {
    let acc = `<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="text-align:left;padding:3px 6px;width:28%;">Accertamento</th>
        <th style="text-align:left;padding:3px 6px;width:14%;">Data</th>
        <th style="text-align:left;padding:3px 6px;width:16%;">Esito</th>
        <th style="text-align:left;padding:3px 6px;">Note</th>
      </tr></thead><tbody>`;
    doneAcc.forEach(a => {
      const outcome = f[`${a.key}_outcome`];
      const outColor = outcome === 'normale' ? '#16a34a' : outcome === 'irregolare' ? '#dc2626' : '#6b7280';
      const outText = outcome === 'normale' ? 'Nella norma' : outcome === 'irregolare' ? 'Irregolare' : '—';
      acc += `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:3px 6px;font-weight:500;">${a.label}</td>
        <td style="padding:3px 6px;">${fmtDate(f[`${a.key}_date`])}</td>
        <td style="padding:3px 6px;font-weight:600;color:${outColor};">${outText}</td>
        <td style="padding:3px 6px;font-size:9.5px;color:#4b5563;">${f[a.key] || ''}</td>
      </tr>`;
    });
    acc += `</tbody></table>`;
    html += section('ACCERTAMENTI SANITARI', acc);
  }

  // ── DIAGNOSI ──────────────────────────────────────────────────────────────
  if (f.diagnosis) html += section('DIAGNOSI', `<p style="white-space:pre-wrap;font-size:10.5px;">${f.diagnosis}</p>`);

  // ── GIUDIZIO ──────────────────────────────────────────────────────────────
  if (f.judgment) {
    const jc = judgmentColor[f.judgment] || '#374151';
    let jud = `<div style="padding:8px 12px;border:2px solid ${jc};border-radius:4px;display:inline-block;margin-bottom:6px;">
      <span style="font-size:13px;font-weight:800;color:${jc};">${judgmentLabel[f.judgment] || f.judgment}</span>
    </div>`;
    if (f.judgment_details) jud += `<p style="white-space:pre-wrap;margin-top:6px;font-size:10.5px;">${f.judgment_details}</p>`;
    if (f.next_visit_date) jud += `<p style="margin-top:6px;font-size:10.5px;"><strong>Prossima visita:</strong> ${fmtDate(f.next_visit_date)}</p>`;
    html += section('GIUDIZIO DI IDONEITÀ', jud);
  }

  // ── NOTE ──────────────────────────────────────────────────────────────────
  if (f.notes) html += section('NOTE', `<p style="white-space:pre-wrap;font-size:10.5px;">${f.notes}</p>`);

  // ── FIRMA ─────────────────────────────────────────────────────────────────
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  html += `<div style="margin-top:40px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;min-width:200px;">
      <div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#6b7280;">Firma Medico Competente</div>
    </div>
  </div>`;
  html += `<div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:9px;color:#9ca3af;text-align:center;">
    Documento generato il ${todayStr} — MEDIPLAN Medicina del Lavoro
  </div>`;
  html += `</div>`;

  return html;
}

export function openPrintWindow(f, pat, company) {
  const printWin = window.open('', '_blank');
  const html = buildPrintHTML(f, pat, company);
  printWin.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>
    <title>Visita - ${f.patient_name || ''}</title>
    <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 24px; background:#fff; }
    @media print { body { padding: 0; } @page { margin: 15mm; size: A4; } }</style>
  </head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script></body></html>`);
  printWin.document.close();
}