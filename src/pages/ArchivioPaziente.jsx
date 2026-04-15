import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileHeart, Paperclip, ChevronDown, ChevronRight, CheckCircle2, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const ACCERTAMENTI = [
  { key: 'audiometry_result', label: 'Audiometria', doneKey: 'audiometry_result_done', dateKey: 'audiometry_result_date', outcomeKey: 'audiometry_result_outcome' },
  { key: 'spirometry_result', label: 'Spirometria', doneKey: 'spirometry_result_done', dateKey: 'spirometry_result_date', outcomeKey: 'spirometry_result_outcome' },
  { key: 'ecg_result', label: 'ECG', doneKey: 'ecg_result_done', dateKey: 'ecg_result_date', outcomeKey: 'ecg_result_outcome' },
  { key: 'visiotest_result', label: 'Visiotest', doneKey: 'visiotest_result_done', dateKey: 'visiotest_result_date', outcomeKey: 'visiotest_result_outcome' },
  { key: 'upper_limbs_eval_result', label: 'Valutazione Arti Superiori', doneKey: 'upper_limbs_eval_result_done', dateKey: 'upper_limbs_eval_result_date', outcomeKey: 'upper_limbs_eval_result_outcome' },
  { key: 'drug_test_result', label: 'Drug Test', doneKey: 'drug_test_result_done', dateKey: 'drug_test_result_date', outcomeKey: 'drug_test_result_outcome' },
  { key: 'alcohol_test_result', label: 'Alcol Test', doneKey: 'alcohol_test_result_done', dateKey: 'alcohol_test_result_date', outcomeKey: 'alcohol_test_result_outcome' },
  { key: 'audit_c_result', label: 'AUDIT-C', doneKey: 'audit_c_result_done', dateKey: 'audit_c_result_date', outcomeKey: 'audit_c_result_outcome' },
  { key: 'blood_tests_result', label: 'Esami ematochimici', doneKey: 'blood_tests_result_done', dateKey: 'blood_tests_result_date', outcomeKey: 'blood_tests_result_outcome' },
  { key: 'other_exams', label: 'Esami strumentali aggiuntivi', doneKey: 'other_exams_done', dateKey: 'other_exams_date', outcomeKey: 'other_exams_outcome' },
  { key: 'specialist_visits_result', label: 'Visite specialistiche', doneKey: 'specialist_visits_result_done', dateKey: 'specialist_visits_result_date', outcomeKey: 'specialist_visits_result_outcome' },
];

const VISIT_TYPE_LABELS = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

const JUDGMENT_LABELS = {
  idoneo: { label: 'Idoneo', color: 'bg-accent/10 text-accent border-accent/30' },
  idoneo_con_prescrizioni: { label: 'Idoneo con prescrizioni', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  idoneo_con_limitazioni: { label: 'Idoneo con limitazioni', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  temporaneamente_non_idoneo: { label: 'Temp. non idoneo', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  non_idoneo: { label: 'Non idoneo', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

function VisitCard({ visit }) {
  const [open, setOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const doneExams = ACCERTAMENTI.filter(a => visit[a.doneKey]);
  const attachments = Array.isArray(visit.attachments) ? visit.attachments : [];
  const judgment = JUDGMENT_LABELS[visit.judgment];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header visita */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {visit.visit_date ? format(new Date(visit.visit_date), 'dd MMMM yyyy', { locale: it }) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {VISIT_TYPE_LABELS[visit.visit_type] || visit.visit_type}
              {visit.next_visit_date && ` · Prossima: ${format(new Date(visit.next_visit_date), 'dd/MM/yyyy')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {judgment && (
            <Badge className={`text-xs border ${judgment.color}`}>{judgment.label}</Badge>
          )}
          {doneExams.length > 0 && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              <span>{doneExams.length} accertamenti</span>
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Diagnosi */}
      {visit.diagnosis && (
        <div className="px-4 py-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Diagnosi: <span className="text-foreground">{visit.diagnosis}</span></p>
        </div>
      )}

      {/* Accertamenti eseguiti */}
      {open && doneExams.length > 0 && (
        <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accertamenti integrativi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {doneExams.map(a => (
              <div key={a.key} className="flex items-start gap-2 p-2 rounded-md bg-background border border-border text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium">{a.label}</p>
                  {visit[a.dateKey] && (
                    <p className="text-muted-foreground">{format(new Date(visit[a.dateKey]), 'dd/MM/yyyy')}</p>
                  )}
                  {visit[a.outcomeKey] && (
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      visit[a.outcomeKey] === 'normale'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {visit[a.outcomeKey] === 'normale' ? 'Nella norma' : 'Irregolare'}
                    </span>
                  )}
                  {visit[a.key] && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2">{visit[a.key]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allegati PDF */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50">
          <button
            onClick={() => setAttachOpen(o => !o)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            <Paperclip className="h-3 w-3" />
            <span className="font-medium">Allegati PDF ({attachments.length})</span>
            {attachOpen ? <ChevronDown className="h-3 w-3 ml-auto" /> : <ChevronRight className="h-3 w-3 ml-auto" />}
          </button>
          {attachOpen && (
            <div className="mt-2 space-y-1">
              {attachments.map((a, i) => {
                const url = typeof a === 'object' ? a.url : a;
                const label = typeof a === 'object' ? (a.label || `Allegato ${i + 1}`) : `Allegato ${i + 1}`;
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-xs font-medium text-primary"
                  >
                    <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArchivioPaziente() {
  const patientId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.MedicalVisit.list('-visit_date', 1000),
  });

  const patient = patients.find(p => String(p.id) === patientId);
  const patientVisits = visits.filter(v => String(v.patient_id) === patientId);

  if (loadingPatients || loadingVisits) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-muted-foreground">Paziente non trovato.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Indietro
      </Button>

      <h1 className="text-xl font-semibold mb-1">Archivio Storico Paziente</h1>
      <p className="text-sm text-muted-foreground mb-6">Storico completo visite e accertamenti integrativi</p>

      {/* Dati paziente */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            {patient.last_name} {patient.first_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {patient.fiscal_code && (
              <div><p className="text-xs text-muted-foreground">Codice fiscale</p><p className="font-mono font-medium text-xs">{patient.fiscal_code}</p></div>
            )}
            {patient.birth_date && (
              <div><p className="text-xs text-muted-foreground">Data di nascita</p><p>{format(new Date(patient.birth_date), 'dd/MM/yyyy')}</p></div>
            )}
            {patient.gender && (
              <div><p className="text-xs text-muted-foreground">Sesso</p><p>{patient.gender}</p></div>
            )}
            {patient.company_name && (
              <div className="flex flex-col">
                <p className="text-xs text-muted-foreground">Azienda</p>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <p>{patient.company_name}</p>
                </div>
              </div>
            )}
            {patient.job_role_name && (
              <div><p className="text-xs text-muted-foreground">Mansione</p><p>{patient.job_role_name}</p></div>
            )}
            {patient.hire_date && (
              <div><p className="text-xs text-muted-foreground">Data assunzione</p><p>{format(new Date(patient.hire_date), 'dd/MM/yyyy')}</p></div>
            )}
            {patient.blood_type && patient.blood_type !== 'unknown' && (
              <div><p className="text-xs text-muted-foreground">Gruppo sanguigno</p><p>{patient.blood_type}</p></div>
            )}
            {patient.allergies && (
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Allergie</p><p>{patient.allergies}</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storico visite */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileHeart className="h-4 w-4 text-primary" />
            Storico visite
            <Badge variant="secondary" className="ml-auto">{patientVisits.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nessuna visita registrata per questo paziente.</p>
          ) : (
            <div className="space-y-3">
              {patientVisits.map(v => (
                <VisitCard key={v.id} visit={v} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}