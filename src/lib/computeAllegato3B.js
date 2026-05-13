/**
 * computeAllegato3BFromVisits
 *
 * Calcola automaticamente i campi numerici dell'Allegato 3B
 * a partire da visite, pazienti e mansioni dell'anno di riferimento.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {number} params.anno  - anno di riferimento (es. 2024)
 * @param {Array}  params.visits - tutte le MedicalVisit dell'azienda
 * @param {Array}  params.patients - tutti i Patient dell'azienda
 * @param {Array}  params.jobRoles - tutte le JobRole (con risks_allegato3b)
 * @returns {object} campi calcolati da mergiare nel form Allegato3B
 */
export function computeAllegato3BFromVisits({ companyId, anno, visits, patients, jobRoles }) {
  // Visite concluse nell'anno per questa azienda
  const yearVisits = visits.filter(v =>
    v.company_id === companyId &&
    v.visit_status === 'conclusa' &&
    v.visit_date?.startsWith(String(anno))
  );

  // Mappa paziente id -> dati paziente
  const patientMap = {};
  patients.forEach(p => { patientMap[p.id] = p; });

  // Mappa jobRole id -> jobRole
  const roleMap = {};
  jobRoles.forEach(r => { roleMap[r.id] = r; });

  // Pazienti attivi dell'azienda soggetti a sorveglianza
  const activePatients = patients.filter(p =>
    p.company_id === companyId &&
    p.status === 'active' &&
    p.subject_to_surveillance !== false
  );

  // Contatori lavoratori occupati al 30/6 e al 31/12
  // Se il paziente ha hire_date usa quella, altrimenti fallback su status === 'active'
  const companyPatients = patients.filter(p => p.company_id === companyId);

  const countAt = (dateStr) => {
    const d = new Date(dateStr);
    let m = 0, f = 0;
    companyPatients.forEach(p => {
      const hired = p.hire_date ? new Date(p.hire_date) : null;
      const term = p.termination_date ? new Date(p.termination_date) : null;
      let active = false;
      if (hired) {
        // Ha una data di assunzione: usa quella
        active = hired <= d && (!term || term > d);
      } else {
        // Nessuna data: considera il lavoratore attivo se status === 'active' e non ha data di fine
        active = p.status === 'active' && (!term || term > d);
      }
      if (active) {
        if (p.gender === 'M') m++;
        else if (p.gender === 'F') f++;
      }
    });
    return { m, f };
  };

  const at30_6 = countAt(`${anno}-06-30`);
  const at31_12 = countAt(`${anno}-12-31`);

  // Soggetti a sorveglianza
  let sorv_m = 0, sorv_f = 0;
  activePatients.forEach(p => {
    if (p.gender === 'M') sorv_m++;
    else if (p.gender === 'F') sorv_f++;
  });

  // Visitati nell'anno (pazienti con almeno una visita conclusa nell'anno)
  const visitedPatientIds = new Set(yearVisits.map(v => v.patient_id));
  let vis_m = 0, vis_f = 0;
  visitedPatientIds.forEach(pid => {
    const p = patientMap[pid];
    if (!p) return;
    if (p.gender === 'M') vis_m++;
    else if (p.gender === 'F') vis_f++;
  });

  // Giudizi (ultima visita dell'anno per paziente)
  // Per ogni paziente prendo l'ultima visita conclusa dell'anno
  const lastVisitPerPatient = {};
  yearVisits.forEach(v => {
    const existing = lastVisitPerPatient[v.patient_id];
    if (!existing || v.visit_date > existing.visit_date) {
      lastVisitPerPatient[v.patient_id] = v;
    }
  });

  let idonei_m = 0, idonei_f = 0;
  let idonei_parc_temp_m = 0, idonei_parc_temp_f = 0;
  let idonei_parc_perm_m = 0, idonei_parc_perm_f = 0;
  let inidonei_temp_m = 0, inidonei_temp_f = 0;
  let inidonei_perm_m = 0, inidonei_perm_f = 0;

  Object.values(lastVisitPerPatient).forEach(v => {
    const p = patientMap[v.patient_id];
    const gender = p?.gender;
    const j = v.judgment;
    if (!j || !gender) return;

    if (j === 'idoneo') {
      if (gender === 'M') idonei_m++; else idonei_f++;
    } else if (j === 'idoneo_con_prescrizioni' || j === 'idoneo_con_limitazioni') {
      // Usa il campo judgment_permanence se disponibile, altrimenti default temporanea
      const permanence = v.judgment_permanence;
      if (permanence === 'permanente') {
        if (gender === 'M') idonei_parc_perm_m++; else idonei_parc_perm_f++;
      } else {
        // temporanea (default)
        if (gender === 'M') idonei_parc_temp_m++; else idonei_parc_temp_f++;
      }
    } else if (j === 'temporaneamente_non_idoneo') {
      if (gender === 'M') inidonei_temp_m++; else inidonei_temp_f++;
    } else if (j === 'non_idoneo') {
      if (gender === 'M') inidonei_perm_m++; else inidonei_perm_f++;
    }
  });

  // Drug test / alcohol test art. 41
  // Contiamo le visite in cui è stato effettuato il drug test / alcohol test
  let drug_sott_m = 0, drug_sott_f = 0;
  let drug_pos_screen_m = 0, drug_pos_screen_f = 0;
  let drug_pos_conf_m = 0, drug_pos_conf_f = 0;
  let drug_inid_m = 0, drug_inid_f = 0;
  let alc_sott_m = 0, alc_sott_f = 0;
  let alc_pos_screen_m = 0, alc_pos_screen_f = 0;
  let alc_pos_conf_m = 0, alc_pos_conf_f = 0;
  let alc_inid_m = 0, alc_inid_f = 0;

  yearVisits.forEach(v => {
    const p = patientMap[v.patient_id];
    const gender = p?.gender;
    if (!gender) return;

    if (v.drug_test_result_done) {
      if (gender === 'M') drug_sott_m++; else drug_sott_f++;
      if (v.drug_test_result_outcome === 'irregolare') {
        if (gender === 'M') drug_pos_screen_m++; else drug_pos_screen_f++;
      }
    }
    if (v.alcohol_test_result_done) {
      if (gender === 'M') alc_sott_m++; else alc_sott_f++;
      if (v.alcohol_test_result_outcome === 'irregolare') {
        if (gender === 'M') alc_pos_screen_m++; else alc_pos_screen_f++;
      }
    }
    // Audit-C conta come conferma alcolismo
    if (v.audit_c_result_done && v.audit_c_result_outcome === 'irregolare') {
      if (gender === 'M') alc_pos_conf_m++; else alc_pos_conf_f++;
    }
  });

  // Inidonei per droga/alcol = inidonei totali (approssimazione: non disponibile a livello di visita singola la motivazione)
  // Lasciamo a 0, l'utente può inserire manualmente
  
  // ── Rischi Allegato 3B ──────────────────────────────────────────────────────
  // Per ogni rischio: contiamo pazienti soggetti a SS che hanno quel rischio (via mansione)
  // e pazienti visitati nell'anno con quel rischio
  const RISCHI_KEYS = [
    'mmc','sovraccarico','chimici','cancerogeni','amianto','silice','biologici',
    'vdt','vibrazioni_corpo','vibrazioni_mano','rumore','campi_em','radiaz_ottiche',
    'radiaz_uv','microclima','infrasuoni','ultrasuoni','polvere','lavoro_notturno',
    'altri_rischi','lavori_altezza','stress','posture'
  ];

  const rischi = {};
  RISCHI_KEYS.forEach(key => {
    rischi[key] = { soggetti_m: 0, soggetti_f: 0, visitati_m: 0, visitati_f: 0 };
  });

  // Per ogni paziente attivo: guarda le sue mansioni e i loro risks_allegato3b
  activePatients.forEach(p => {
    const gender = p.gender;
    if (!gender) return;
    // Raccoglie tutte le mansioni del paziente
    const roleIds = [p.job_role_id, p.job_role_secondary1_id, p.job_role_secondary2_id].filter(Boolean);
    const riskKeys = new Set();
    roleIds.forEach(rid => {
      const role = roleMap[rid];
      if (role?.risks_allegato3b?.length) {
        role.risks_allegato3b.forEach(k => riskKeys.add(k));
      }
    });
    riskKeys.forEach(key => {
      if (!rischi[key]) return;
      if (gender === 'M') rischi[key].soggetti_m++;
      else rischi[key].soggetti_f++;
    });
  });

  // Visitati per rischio
  visitedPatientIds.forEach(pid => {
    const p = patientMap[pid];
    if (!p) return;
    const gender = p.gender;
    if (!gender) return;
    const roleIds = [p.job_role_id, p.job_role_secondary1_id, p.job_role_secondary2_id].filter(Boolean);
    const riskKeys = new Set();
    roleIds.forEach(rid => {
      const role = roleMap[rid];
      if (role?.risks_allegato3b?.length) {
        role.risks_allegato3b.forEach(k => riskKeys.add(k));
      }
    });
    riskKeys.forEach(key => {
      if (!rischi[key]) return;
      if (gender === 'M') rischi[key].visitati_m++;
      else rischi[key].visitati_f++;
    });
  });

  return {
    lavoratori_30_6_m: at30_6.m,
    lavoratori_30_6_f: at30_6.f,
    lavoratori_31_12_m: at31_12.m,
    lavoratori_31_12_f: at31_12.f,
    sorveglianza_soggetti_m: sorv_m,
    sorveglianza_soggetti_f: sorv_f,
    sorveglianza_visitati_m: vis_m,
    sorveglianza_visitati_f: vis_f,
    idonei_m,
    idonei_f,
    idonei_parziali_temp_m: idonei_parc_temp_m,
    idonei_parziali_temp_f: idonei_parc_temp_f,
    idonei_parziali_perm_m: idonei_parc_perm_m,
    idonei_parziali_perm_f: idonei_parc_perm_f,
    inidonei_temp_m,
    inidonei_temp_f,
    inidonei_perm_m,
    inidonei_perm_f,
    art41_stupefacenti_sottoposti_m: drug_sott_m,
    art41_stupefacenti_sottoposti_f: drug_sott_f,
    art41_stupefacenti_positivi_screening_m: drug_pos_screen_m,
    art41_stupefacenti_positivi_screening_f: drug_pos_screen_f,
    art41_stupefacenti_positivi_conferma_m: drug_pos_conf_m,
    art41_stupefacenti_positivi_conferma_f: drug_pos_conf_f,
    art41_stupefacenti_inidonei_m: drug_inid_m,
    art41_stupefacenti_inidonei_f: drug_inid_f,
    art41_alcool_sottoposti_m: alc_sott_m,
    art41_alcool_sottoposti_f: alc_sott_f,
    art41_alcool_positivi_screening_m: alc_pos_screen_m,
    art41_alcool_positivi_screening_f: alc_pos_screen_f,
    art41_alcool_positivi_conferma_m: alc_pos_conf_m,
    art41_alcool_positivi_conferma_f: alc_pos_conf_f,
    art41_alcool_inidonei_m: alc_inid_m,
    art41_alcool_inidonei_f: alc_inid_f,
    rischi,
  };
}