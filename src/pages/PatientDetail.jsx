import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import { ArrowLeft, FileHeart, User, Heart, Pill, Plus, Pencil, Trash2, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PatientDetail() {
  const patientId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canSeeClinic = canAccess(user, 'dati_clinici');
  const canWriteVisit = canAccess(user, 'visite_write');

  const [deletingVisit, setDeletingVisit] = useState(null);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });
  const patient = patients.find(p => String(p.id) === patientId);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date'),
  });
  const patientVisits = visits.filter(v => String(v.patient_id) === patientId);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicalVisit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      setDeletingVisit(null);
    },
  });

  const handleNewVisit = () => {
    navigate(`/visita?patientId=${patientId}`);
  };

  const handleEditVisit = (visit) => {
    navigate(`/visita?visitId=${visit.id}&patientId=${patientId}`);
  };

  const handlePrintVisit = (v) => {
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
      { key: 'systems_respiratory', label: 'App. respiratorio' },
      { key: 'systems_cardiovascular', label: 'App. cardiovascolare' },
      { key: 'systems_gastrointestinal', label: 'App. gastrointestinale' },
      { key: 'systems_urogenital', label: 'App. urogenitale' },
      { key: 'systems_musculoskeletal', label: 'App. muscoloscheletrico' },
      { key: 'systems_hearing', label: 'Udito' },
      { key: 'systems_vestibular', label: 'App. vestibolare' },
      { key: 'systems_skin', label: 'Cute e annessi' },
      { key: 'systems_nervous', label: 'Sistema nervoso' },
      { key: 'systems_psych', label: 'Sfera psichica' },
    ];
    const visitTypeLabel = { preventiva:'Preventiva', periodica:'Periodica', su_richiesta:'Su richiesta', cambio_mansione:'Cambio mansione', rientro_malattia:'Rientro malattia', cessazione:'Cessazione' };
    const judgmentLabel = { idoneo:'IDONEO', idoneo_con_prescrizioni:'IDONEO CON PRESCRIZIONI', idoneo_con_limitazioni:'IDONEO CON LIMITAZIONI', temporaneamente_non_idoneo:'TEMPORANEAMENTE NON IDONEO', non_idoneo:'NON IDONEO' };
    const judgmentColor = { idoneo:'#16a34a', idoneo_con_prescrizioni:'#d97706', idoneo_con_limitazioni:'#d97706', temporaneamente_non_idoneo:'#dc2626', non_idoneo:'#dc2626' };
    const fmtDate = d => { if (!d) return '—'; try { const dt = new Date(d); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; } catch { return d; } };
    const row = (label, value) => value ? `<div style="display:flex;gap:8px;margin-bottom:3px;"><span style="font-weight:600;min-width:160px;color:#374151;">${label}:</span><span>${value}</span></div>` : '';
    const section = (title, content) => `<div style="margin-bottom:18px;"><div style="background:#0284c7;color:#fff;padding:4px 10px;font-weight:700;font-size:11px;margin-bottom:6px;border-radius:3px;">${title}</div><div style="padding-left:4px;">${content}</div></div>`;
    const sysLabel = { non_sintomi:'Neg.', sintomi_oltre_1a:'Sintomi > 1a', sintomi_meno_1a:'Sintomi < 1a' };

    let html = `<div style="font-family:Arial,sans-serif;font-size:11px;color:#111827;max-width:780px;margin:0 auto;">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:2px solid #0284c7;padding-bottom:12px;">
      <div><div style="font-size:18px;font-weight:800;color:#0284c7;">MEDIPLAN</div><div style="font-size:10px;color:#6b7280;">Medicina del Lavoro</div></div>
      <div style="text-align:right;"><div style="font-size:13px;font-weight:700;">CARTELLA SANITARIA</div>
      <div style="font-size:10px;color:#6b7280;">Visita ${visitTypeLabel[v.visit_type] || v.visit_type || ''}</div>
      <div style="font-size:10px;color:#6b7280;">Data: ${fmtDate(v.visit_date)}</div></div></div>`;

    let lav = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;">`;
    lav += row('Nominativo', v.patient_name);
    lav += row('Azienda', v.company_name);
    if (patient) {
      lav += row('Codice fiscale', patient.fiscal_code);
      lav += row('Data di nascita', fmtDate(patient.birth_date));
      lav += row('Mansione', patient.job_role_name);
      lav += row('Data assunzione', fmtDate(patient.hire_date));
    }
    lav += `</div>`;
    html += section('DATI LAVORATORE', lav);

    if (v.anamnesis_work) {
      let al = `<p style="white-space:pre-wrap;line-height:1.5;">${v.anamnesis_work}</p>`;
      if (v.anamnesis_work_concurrent) al += `<p style="margin-top:4px;"><strong>Esposizione contemporanea:</strong> ${v.anamnesis_work_concurrent_details || 'Sì'}</p>`;
      html += section('ANAMNESI LAVORATIVA', al);
    }

    if (v.anamnesis_pathological || v.anamnesis_injuries || v.anamnesis_occupational_disease) {
      let ap = '';
      if (v.anamnesis_pathological) ap += `<p style="white-space:pre-wrap;margin-bottom:4px;">${v.anamnesis_pathological}</p>`;
      if (v.anamnesis_injuries) ap += row('Infortuni', v.anamnesis_injuries_details || 'Sì');
      if (v.anamnesis_occupational_disease) ap += row('Mal. professionali', v.anamnesis_occupational_disease_details || 'Sì');
      html += section('ANAMNESI PATOLOGICA PROSSIMA E REMOTA', ap);
    }

    const sysWithSymptoms = SYSTEMS.filter(s => v[s.key] && v[s.key] !== 'non_sintomi');
    if (sysWithSymptoms.length > 0) {
      let st = `<table style="width:100%;border-collapse:collapse;font-size:10px;"><thead><tr style="background:#f3f4f6;"><th style="text-align:left;padding:3px 6px;width:40%;">Apparato</th><th style="text-align:left;padding:3px 6px;width:20%;">Esito</th><th style="text-align:left;padding:3px 6px;">Note</th></tr></thead><tbody>`;
      sysWithSymptoms.forEach(s => {
        st += `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:3px 6px;">${s.label}</td><td style="padding:3px 6px;color:#dc2626;font-weight:600;">${sysLabel[v[s.key]] || v[s.key]}</td><td style="padding:3px 6px;">${v[`${s.key}_details`] || ''}</td></tr>`;
      });
      st += `</tbody></table>`;
      html += section('ANAMNESI PER APPARATI', st);
    }

    if (v.height_cm || v.weight_kg || v.blood_pressure_systolic) {
      let obj = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px 16px;margin-bottom:6px;">`;
      if (v.height_cm) obj += row('Altezza', `${v.height_cm} cm`);
      if (v.weight_kg) obj += row('Peso', `${v.weight_kg} kg`);
      if (v.blood_pressure_systolic) obj += row('PA', `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`);
      if (v.heart_rate) obj += row('FC', `${v.heart_rate} bpm`);
      obj += `</div>`;
      if (v.obj_notes) obj += `<p style="white-space:pre-wrap;margin-top:4px;">${v.obj_notes}</p>`;
      html += section('ESAME OBIETTIVO', obj);
    }

    const doneAcc = ACCS.filter(a => v[`${a.key}_done`]);
    if (doneAcc.length > 0) {
      let acc = `<table style="width:100%;border-collapse:collapse;font-size:10px;"><thead><tr style="background:#f3f4f6;"><th style="text-align:left;padding:3px 6px;width:28%;">Accertamento</th><th style="text-align:left;padding:3px 6px;width:15%;">Data</th><th style="text-align:left;padding:3px 6px;width:15%;">Esito</th><th style="text-align:left;padding:3px 6px;">Note</th></tr></thead><tbody>`;
      doneAcc.forEach(a => {
        const outcome = v[`${a.key}_outcome`];
        const outColor = outcome === 'normale' ? '#16a34a' : outcome === 'irregolare' ? '#dc2626' : '#6b7280';
        const outText = outcome === 'normale' ? 'Nella norma' : outcome === 'irregolare' ? 'Irregolare' : '—';
        acc += `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:3px 6px;font-weight:500;">${a.label}</td><td style="padding:3px 6px;">${fmtDate(v[`${a.key}_date`])}</td><td style="padding:3px 6px;font-weight:600;color:${outColor};">${outText}</td><td style="padding:3px 6px;font-size:9.5px;color:#4b5563;">${v[a.key] || ''}</td></tr>`;
      });
      acc += `</tbody></table>`;
      html += section('ACCERTAMENTI SANITARI', acc);
    }

    if (v.diagnosis) html += section('DIAGNOSI', `<p style="white-space:pre-wrap;">${v.diagnosis}</p>`);

    if (v.judgment) {
      const jc = judgmentColor[v.judgment] || '#374151';
      let jud = `<div style="padding:8px 12px;border:2px solid ${jc};border-radius:4px;display:inline-block;margin-bottom:6px;"><span style="font-size:13px;font-weight:800;color:${jc};">${judgmentLabel[v.judgment] || v.judgment}</span></div>`;
      if (v.judgment_details) jud += `<p style="white-space:pre-wrap;margin-top:6px;">${v.judgment_details}</p>`;
      if (v.next_visit_date) jud += `<p style="margin-top:6px;"><strong>Prossima visita:</strong> ${fmtDate(v.next_visit_date)}</p>`;
      html += section('GIUDIZIO DI IDONEITÀ', jud);
    }

    if (v.notes) html += section('NOTE', `<p style="white-space:pre-wrap;">${v.notes}</p>`);

    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    html += `<div style="margin-top:40px;display:flex;justify-content:flex-end;"><div style="text-align:center;min-width:200px;"><div style="border-top:1px solid #374151;padding-top:4px;font-size:10px;color:#6b7280;">Firma Medico Competente</div></div></div>`;
    html += `<div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:9px;color:#9ca3af;text-align:center;">Documento generato il ${todayStr} — MEDIPLAN Medicina del Lavoro</div>`;
    html += `</div>`;

    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/><title>Visita - ${v.patient_name || ''}</title>
      <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 24px; background:#fff; }
      @media print { body { padding: 0; } @page { margin: 15mm; size: A4; } }</style>
    </head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script></body></html>`);
    printWin.document.close();
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Indietro
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{patient.last_name} {patient.first_name}</h1>
            <StatusBadge status={patient.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {patient.company_name} {patient.job_role_name ? `· ${patient.job_role_name}` : ''}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dati personali</p>
          </div>
          {patient.fiscal_code && <p className="text-sm">CF: <span className="font-mono text-xs font-medium">{patient.fiscal_code}</span></p>}
          {patient.birth_date && <p className="text-sm">Nato il: {format(new Date(patient.birth_date), 'dd/MM/yyyy')}</p>}
          {patient.birth_place && <p className="text-sm">Luogo: {patient.birth_place}</p>}
          {patient.gender && <p className="text-sm">Sesso: {patient.gender}</p>}
          {patient.phone && <p className="text-sm">Tel: {patient.phone}</p>}
          {patient.email && <p className="text-sm">Email: {patient.email}</p>}
        </Card>
        {canSeeClinic ? (
          <>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-destructive" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anamnesi</p>
              </div>
              {patient.blood_type && patient.blood_type !== 'unknown' && <p className="text-sm">Gruppo: <span className="font-medium">{patient.blood_type}</span></p>}
              {patient.allergies && <p className="text-sm">Allergie: {patient.allergies}</p>}
              {patient.chronic_conditions && <p className="text-sm">Patologie: {patient.chronic_conditions}</p>}
              {!patient.allergies && !patient.chronic_conditions && <p className="text-sm text-muted-foreground">Nessun dato</p>}
            </Card>
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-4 w-4 text-accent" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Terapie</p>
              </div>
              {patient.current_medications ? (
                <p className="text-sm">{patient.current_medications}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nessuna terapia in corso</p>
              )}
            </Card>
          </>
        ) : null}
      </div>

      {/* Visit history - solo admin e operatori */}
      {canSeeClinic && <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileHeart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Storico visite ({patientVisits.length})</h2>
          </div>
          {canWriteVisit && <Button size="sm" onClick={handleNewVisit}>
            <Plus className="h-4 w-4 mr-1" /> Nuova visita
          </Button>}
        </div>
        {patientVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna visita registrata</p>
        ) : (
          <div className="space-y-3">
            {patientVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">{v.visit_date ? format(new Date(v.visit_date), 'dd MMMM yyyy', { locale: it }) : ''}</p>
                  <p className="text-xs text-muted-foreground capitalize">{v.visit_type?.replace(/_/g, ' ')}</p>
                  {v.next_visit_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prossima visita: {format(new Date(v.next_visit_date), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <StatusBadge status={v.judgment} />
                   <Button variant="ghost" size="icon" title="Stampa / PDF" onClick={() => handlePrintVisit(v)}>
                     <Printer className="h-3.5 w-3.5" />
                   </Button>
                   {canWriteVisit && <>
                     <Button variant="ghost" size="icon" onClick={() => handleEditVisit(v)}>
                       <Pencil className="h-3.5 w-3.5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingVisit(v)}>
                       <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                   </>}
                 </div>
              </div>
            ))}
          </div>
        )}
      </Card>}



      {/* Delete confirm */}
      <AlertDialog open={!!deletingVisit} onOpenChange={() => setDeletingVisit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la visita?</AlertDialogTitle>
            <AlertDialogDescription>Questa operazione non può essere annullata.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deletingVisit.id)}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}