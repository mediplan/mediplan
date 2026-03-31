import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roles';
import { ArrowLeft, FileHeart, User, Heart, Pill, Plus, Pencil, Trash2, Printer, Paperclip } from 'lucide-react';
import VisitAttachments from '@/components/visits/VisitAttachments';
import { openPrintWindow } from '@/lib/printVisit';
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
  const canSeeAttachments = canAccess(user, 'allegati_accertamenti');

  const [deletingVisit, setDeletingVisit] = useState(null);
  const [openAttachments, setOpenAttachments] = useState({});

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

  const handlePrintVisit = (v) => {
    const company = companies.find(c => String(c.id) === String(v.company_id || patient?.company_id));
    openPrintWindow(v, patient, company);
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
              <div key={v.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
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
                {/* Archivio allegati PDF della visita */}
                {canSeeAttachments && Array.isArray(v.attachments) && v.attachments.length > 0 && (
                  <div className="pt-1.5 border-t border-border/50">
                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                      <input
                        type="checkbox"
                        checked={!!openAttachments[v.id]}
                        onChange={e => setOpenAttachments(prev => ({ ...prev, [v.id]: e.target.checked }))}
                        className="h-3.5 w-3.5 accent-primary cursor-pointer"
                      />
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        Archivio documenti PDF ({v.attachments.length})
                      </span>
                    </label>
                    {openAttachments[v.id] && (
                      <div className="mt-2 pl-5">
                        <VisitAttachments attachments={v.attachments} compact />
                      </div>
                    )}
                  </div>
                )}
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