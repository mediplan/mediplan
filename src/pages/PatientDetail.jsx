import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import { ArrowLeft, FileHeart, User, Heart, Pill, Plus, Pencil, Trash2, Printer, Paperclip, CheckCircle2, Calendar, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { openPrintWindow, openGiudizioWindow } from '@/lib/printVisit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const JUDGMENT_LABELS = {
  idoneo: { label: 'Idoneo', color: 'bg-accent/10 text-accent border-accent/30' },
  idoneo_con_prescrizioni: { label: 'Idoneo con prescrizioni', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  idoneo_con_limitazioni: { label: 'Idoneo con limitazioni', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  temporaneamente_non_idoneo: { label: 'Temp. non idoneo', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  non_idoneo: { label: 'Non idoneo', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const VISIT_TYPE_LABELS = {
  preventiva: 'Preventiva',
  periodica: 'Periodica',
  su_richiesta: 'Su richiesta',
  cambio_mansione: 'Cambio mansione',
  rientro_malattia: 'Rientro malattia',
  cessazione: 'Cessazione',
};

function VisitCard({ visit, canWriteVisit, canSeeAttachments, onEdit, onDelete, onPrint, onPrintGiudizio }) {
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
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
          {visit.judgment && (
            <Button variant="ghost" size="icon" title="Comunicazione Giudizio Idoneità" onClick={() => onPrintGiudizio(visit)}>
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Stampa Cartella Sanitaria" onClick={() => onPrint(visit)}>
            <Printer className="h-3.5 w-3.5" />
          </Button>
          {canWriteVisit && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(visit)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(visit)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
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
                      visit[a.outcomeKey] === 'normale' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
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
      {canSeeAttachments && attachments.length > 0 && (
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
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted/70 transition-colors text-xs font-medium text-primary">
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

export default function PatientDetail() {
  const patientId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canSeeClinic = canAccess(user, 'dati_clinici');
  const canWriteVisit = canAccess(user, 'visite_write');
  const canSeeAttachments = canAccess(user, 'allegati_accertamenti');

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

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorProfiles'],
    queryFn: () => base44.entities.DoctorProfile.list(),
  });

  const handlePrintVisit = (v) => {
    const company = companies.find(c => String(c.id) === String(v.company_id || patient?.company_id));
    openPrintWindow(v, patient, company);
  };

  const handlePrintGiudizio = (v) => {
    const company = companies.find(c => String(c.id) === String(v.company_id || patient?.company_id));
    const doctor = company?.assigned_doctor_id
      ? doctors.find(d => String(d.id) === String(company.assigned_doctor_id))
      : doctors[0] || null;
    openGiudizioWindow(v, patient, company, doctor);
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
        <Link to={`/archivio-paziente/${patientId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <FileHeart className="h-4 w-4" /> Archivio Storico
          </Button>
        </Link>
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
      {canSeeClinic && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileHeart className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Storico visite ({patientVisits.length})</h2>
            </div>
            {canWriteVisit && (
              <Button size="sm" onClick={handleNewVisit}>
                <Plus className="h-4 w-4 mr-1" /> Nuova visita
              </Button>
            )}
          </div>
          {patientVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna visita registrata</p>
          ) : (
            <div className="space-y-3">
              {patientVisits.map(v => (
                <VisitCard
                  key={v.id}
                  visit={v}
                  canWriteVisit={canWriteVisit}
                  canSeeAttachments={canSeeAttachments}
                  onEdit={handleEditVisit}
                  onDelete={setDeletingVisit}
                  onPrint={handlePrintVisit}
                  onPrintGiudizio={handlePrintGiudizio}
                />
              ))}
            </div>
          )}
        </Card>
      )}



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