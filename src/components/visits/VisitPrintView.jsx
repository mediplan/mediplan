import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const visitTypeLabel = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

const judgmentLabel = {
  idoneo: 'IDONEO',
  idoneo_con_prescrizioni: 'IDONEO CON PRESCRIZIONI',
  idoneo_con_limitazioni: 'IDONEO CON LIMITAZIONI',
  temporaneamente_non_idoneo: 'TEMPORANEAMENTE NON IDONEO',
  non_idoneo: 'NON IDONEO',
};

const judgmentColor = {
  idoneo: '#16a34a',
  idoneo_con_prescrizioni: '#d97706',
  idoneo_con_limitazioni: '#d97706',
  temporaneamente_non_idoneo: '#dc2626',
  non_idoneo: '#dc2626',
};

const ACCERTAMENTI = [
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

const systemLabel = { non_sintomi: 'Neg.', sintomi_oltre_1a: 'Sintomi > 1a', sintomi_meno_1a: 'Sintomi < 1a' };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ backgroundColor: '#0284c7', color: '#fff', padding: '4px 10px', fontWeight: 700, fontSize: 11, marginBottom: 6, borderRadius: 3 }}>
        {title}
      </div>
      <div style={{ paddingLeft: 4 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 3, fontSize: 10.5 }}>
      <span style={{ fontWeight: 600, minWidth: 160, color: '#374151' }}>{label}:</span>
      <span style={{ color: '#111827', flex: 1 }}>{value}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: it }); } catch { return d; }
}

export default function VisitPrintView({ form, patient }) {
  const doneAccertamenti = ACCERTAMENTI.filter(a => form[`${a.key}_done`]);

  return (
    <div id="visit-print-root" style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#111827', maxWidth: 780, margin: '0 auto', padding: 32, background: '#fff' }}>

      {/* INTESTAZIONE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '2px solid #0284c7', paddingBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>MEDIPLAN</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>Medicina del Lavoro</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>CARTELLA SANITARIA</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>Visita {visitTypeLabel[form.visit_type] || form.visit_type}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>Data: {fmtDate(form.visit_date)}</div>
        </div>
      </div>

      {/* DATI LAVORATORE */}
      <Section title="DATI LAVORATORE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
          <Row label="Nominativo" value={form.patient_name} />
          <Row label="Azienda" value={form.company_name} />
          {patient && <>
            <Row label="Codice fiscale" value={patient.fiscal_code} />
            <Row label="Data di nascita" value={fmtDate(patient.birth_date)} />
            <Row label="Mansione" value={patient.job_role_name} />
            <Row label="Data assunzione" value={fmtDate(patient.hire_date)} />
          </>}
        </div>
      </Section>

      {/* ANAMNESI LAVORATIVA */}
      {form.anamnesis_work && (
        <Section title="ANAMNESI LAVORATIVA">
          <p style={{ fontSize: 10.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{form.anamnesis_work}</p>
          {form.anamnesis_work_concurrent && (
            <p style={{ fontSize: 10.5, marginTop: 4 }}>
              <strong>Esposizione contemporanea:</strong> {form.anamnesis_work_concurrent_details || 'Sì'}
            </p>
          )}
        </Section>
      )}

      {/* ANAMNESI PATOLOGICA */}
      {(form.anamnesis_pathological || form.anamnesis_injuries || form.anamnesis_occupational_disease) && (
        <Section title="ANAMNESI PATOLOGICA PROSSIMA E REMOTA">
          {form.anamnesis_pathological && <p style={{ fontSize: 10.5, whiteSpace: 'pre-wrap', marginBottom: 4 }}>{form.anamnesis_pathological}</p>}
          {form.anamnesis_injuries && <Row label="Infortuni" value={form.anamnesis_injuries_details || 'Sì'} />}
          {form.anamnesis_occupational_disease && <Row label="Mal. professionali" value={form.anamnesis_occupational_disease_details || 'Sì'} />}
        </Section>
      )}

      {/* ANAMNESI PER APPARATI */}
      {SYSTEMS.some(s => form[s.key] && form[s.key] !== 'non_sintomi') && (
        <Section title="ANAMNESI PER APPARATI">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600, width: '40%' }}>Apparato</th>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600, width: '20%' }}>Esito</th>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600 }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {SYSTEMS.map(s => {
                const val = form[s.key];
                if (!val || val === 'non_sintomi') return null;
                return (
                  <tr key={s.key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '3px 6px' }}>{s.label}</td>
                    <td style={{ padding: '3px 6px', color: '#dc2626', fontWeight: 600 }}>{systemLabel[val] || val}</td>
                    <td style={{ padding: '3px 6px' }}>{form[`${s.key}_details`] || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* ESAME OBIETTIVO */}
      {(form.height_cm || form.weight_kg || form.blood_pressure_systolic) && (
        <Section title="ESAME OBIETTIVO">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2px 16px', marginBottom: 6 }}>
            <Row label="Altezza" value={form.height_cm ? `${form.height_cm} cm` : null} />
            <Row label="Peso" value={form.weight_kg ? `${form.weight_kg} kg` : null} />
            <Row label="PA" value={form.blood_pressure_systolic ? `${form.blood_pressure_systolic}/${form.blood_pressure_diastolic} mmHg` : null} />
            <Row label="FC" value={form.heart_rate ? `${form.heart_rate} bpm` : null} />
          </div>
          {form.obj_notes && <p style={{ fontSize: 10.5, whiteSpace: 'pre-wrap', marginTop: 4 }}>{form.obj_notes}</p>}
        </Section>
      )}

      {/* ACCERTAMENTI */}
      {doneAccertamenti.length > 0 && (
        <Section title="ACCERTAMENTI SANITARI">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600, width: '28%' }}>Accertamento</th>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600, width: '15%' }}>Data</th>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600, width: '15%' }}>Esito</th>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontWeight: 600 }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {doneAccertamenti.map(a => {
                const outcome = form[`${a.key}_outcome`];
                return (
                  <tr key={a.key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '3px 6px', fontWeight: 500 }}>{a.label}</td>
                    <td style={{ padding: '3px 6px' }}>{fmtDate(form[`${a.key}_date`])}</td>
                    <td style={{ padding: '3px 6px', fontWeight: 600, color: outcome === 'normale' ? '#16a34a' : outcome === 'irregolare' ? '#dc2626' : '#6b7280' }}>
                      {outcome === 'normale' ? 'Nella norma' : outcome === 'irregolare' ? 'Irregolare' : '—'}
                    </td>
                    <td style={{ padding: '3px 6px', fontSize: 9.5, color: '#4b5563' }}>{form[a.key] || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {/* DIAGNOSI */}
      {form.diagnosis && (
        <Section title="DIAGNOSI">
          <p style={{ fontSize: 10.5, whiteSpace: 'pre-wrap' }}>{form.diagnosis}</p>
        </Section>
      )}

      {/* GIUDIZIO */}
      {form.judgment && (
        <Section title="GIUDIZIO DI IDONEITÀ">
          <div style={{ padding: '8px 12px', border: `2px solid ${judgmentColor[form.judgment] || '#374151'}`, borderRadius: 4, display: 'inline-block', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: judgmentColor[form.judgment] || '#374151' }}>
              {judgmentLabel[form.judgment] || form.judgment}
            </span>
          </div>
          {form.judgment_details && (
            <p style={{ fontSize: 10.5, whiteSpace: 'pre-wrap', marginTop: 6 }}>{form.judgment_details}</p>
          )}
          {form.next_visit_date && (
            <p style={{ fontSize: 10.5, marginTop: 6 }}>
              <strong>Prossima visita:</strong> {fmtDate(form.next_visit_date)}
            </p>
          )}
        </Section>
      )}

      {/* NOTE */}
      {form.notes && (
        <Section title="NOTE">
          <p style={{ fontSize: 10.5, whiteSpace: 'pre-wrap' }}>{form.notes}</p>
        </Section>
      )}

      {/* FIRMA */}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', minWidth: 200 }}>
          <div style={{ borderTop: '1px solid #374151', paddingTop: 4, fontSize: 10, color: '#6b7280' }}>
            Firma Medico Competente
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 8, fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>
        Documento generato il {format(new Date(), 'dd/MM/yyyy', { locale: it })} — MEDIPLAN Medicina del Lavoro
      </div>
    </div>
  );
}